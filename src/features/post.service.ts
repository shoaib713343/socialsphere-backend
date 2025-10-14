import { PostModel } from "./post.model";
import redisClient from "../config/redis";
import logger from "../utils/logger";
import cloudinary from "../config/cloudinary";
import { Readable } from "stream";
import { UserModel } from "./auth.model";
import ApiError from "../utils/ApiError";
import mongoose from "mongoose";
import { io } from "../socket";

export const createPost = async(
    postData: {content:string},
    authorId: string,
    file?: Express.Multer.File
) => {
    let mediaUrl : string | undefined = undefined;
    let mediaType: 'image' | 'video' | undefined = undefined;

    if(file){
        mediaUrl = await uploadToCloudinary(file.buffer);
        if(file.mimetype.startsWith('image')){
          mediaType = 'image';
        } else if(file.mimetype.startsWith('video')){
          mediaType = 'video';
        }
    }

    const newPost = await PostModel.create({
        content: postData.content,
        author: authorId,
        mediaUrl: mediaUrl,
        mediaType: mediaType,
    });
    return newPost;
};

export const getAllPosts = async (options: { page: number, limit: number }) => {
    const {page, limit} = options;
    const skip = (page-1) * limit;

    const cacheKey = `posts:page:${page}:limit:${limit}`;

    const cachedPosts = await redisClient.get(cacheKey);

    if(cachedPosts) {
        logger.info('Cache Hit for key: ' + cacheKey);
        return JSON.parse(cachedPosts);
    }

    logger.info('Cache MISS for key' + cacheKey);


    const posts = await PostModel.find()
        .sort({createdAt: -1})
        .skip(skip)
        .limit(limit)
        .populate('author', 'username profilePicture');

        await redisClient.set(cacheKey, JSON.stringify(posts), 'EX', 60);

        return posts;
};

export const uploadToCloudinary = (fileBuffer: Buffer): Promise<string> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            { resource_type: 'auto' },
            (error, result) => {
                if(error) return reject(error);
                if(!result) return reject(new Error('Cloudinary upload failed'));
                resolve(result.secure_url);
            }
        );
        Readable.from(fileBuffer).pipe(uploadStream);
    } );
};

export const getFollowingFeed = async (
    userId: string,
    options: { page: number; limit: number }
) => {
    const { page, limit } = options;
    const skip = (page-1) * limit;

    const user = await UserModel.findById(userId);
    if(!user || user.following.length === 0) {
        return [];
    }

    const posts = await PostModel.find({
        author: { $in: user.following },
    })
    .sort({createdAt: -1})
    .skip(skip)
    .limit(limit)
    .populate('author', 'username profilePicture')

    return posts;
};

export const toggleLikePost = async (userId: string, postId: string) => {
    const post = await PostModel.findById(postId);
    if(!post) {
        throw new ApiError(404, 'Post not found');
    }

    const isLiked = post.likes.some(likeId => likeId.toString() === userId);

    let updatedPost;
    if (isLiked) {
    // --- Unlike logic ---
    updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      { $pull: { likes: userId } },
      { new: true }
    );
    return { message: 'Post unliked successfully', post: updatedPost };
  } else {
    // --- Like logic ---
    updatedPost = await PostModel.findByIdAndUpdate(
      postId,
      { $addToSet: { likes: userId } },
      { new: true }
    );

    if(updatedPost && post.author.toString() !== userId) {
    const notificationData = {
    type: 'like',
    message: `Your post was liked by a user.`,
    postId: post._id,
    postContent: post.content.substring(0, 30),
    };
    io.to(post.author.toString()).emit('newNotification', notificationData);
}
return { message: 'Post liked succesfully', post: updatedPost };
  }
};

export const addCommentToPost = async (
    userId: string,
    postId: string,
    commentText: string
) => {
    const newComment = {
        author: userId,
        text: commentText,
    };

    const updatedPost = await PostModel.findByIdAndUpdate(
        postId,
        {
            $push: {comments: newComment}
        },
        {new:true}
    ).populate('author', 'username');


  if (!updatedPost) {
    throw new ApiError(404, 'Post not found');
  }

  if(updatedPost.author.toString() !== userId) {
    const notificationData = {
        type: 'comment',
        message: `A user commented on your post.`,
        postId: updatedPost._id,
        postContent: updatedPost.content.substring(0, 30)
    };
    io.to(updatedPost.author.toString()).emit('newNotification', notificationData);
  }
  return updatedPost;
};

export const getTrendingPosts = async () => {
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  const trendingPosts = await PostModel.aggregate([
    // Stage 1: Match documents created recently
    {
      $match: {
        createdAt: { $gte: fortyEightHoursAgo }, // Corrected field name from 'created' to 'createdAt'
      },
    },
    // Stage 2: Add the engagement score (this is a new, separate object)
    {
      $addFields: {
        engagementScore: {
          $add: [
            { $size: '$likes' },
            { $multiply: [{ $size: '$comments' }, 2] },
          ],
        },
      },
    },
    // Stage 3: Sort by the new score
    {
      $sort: {
        engagementScore: -1,
      },
    },
    // Stage 4: Limit the results
    {
      $limit: 10,
    },
    // Stage 5: Join with the users collection
    {
      $lookup: {
        from: 'users',
        localField: 'author',
        foreignField: '_id',
        as: 'authorDetails',
      },
    },
    // Stage 6: Deconstruct the authorDetails array
    {
      $unwind: '$authorDetails',
    },
    // Stage 7: Reshape the final output and remove sensitive fields
    {
      $project: {
        content: 1,
        imageUrl: 1,
        likes: 1,
        comments: 1,
        createdAt: 1,
        engagementScore: 1,
        author: {
          _id: '$authorDetails._id',
          username: '$authorDetails.username',
          profilePicture: '$authorDetails.profilePicture',
        }
      },
    },
  ]);

  return trendingPosts;
};

export const getVideoReels = async (options: {page: number; limit: number}) => {
  const { page, limit} = options;
  const skip = (page-1) * limit;

  const reels = await PostModel.find({
    mediaType: 'video',
  })
    .sort({ createdAt: -1  })
    .skip(skip)
    .limit(limit)
    .populate('author', 'username profilePicture');

    return reels;
};

