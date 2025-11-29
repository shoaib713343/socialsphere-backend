import { PostModel } from "./post.model";
import redisClient from "../config/redis";
import logger from "../utils/logger";
import { UserModel } from "./auth.model";
import { NotificationModel } from "./notification.model";
import ApiError from "../utils/ApiError";
import { uploadToCloudinary } from "../config/cloudinary"; // Correct Import
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
        .populate('author', 'username profilePicture')
        .populate('comments.author', 'username profilePicture');

    await redisClient.set(cacheKey, JSON.stringify(posts), 'EX', 60);
    return posts;
};

export const getPostsByUserId = async (userId: string) => {
  const posts = await PostModel.find({ author: userId })
    .sort({ createdAt: -1 })
    .populate('author', 'username profilePicture')
    .populate('comments.author', 'username profilePicture');
  return posts;
};

export const getPostsByUsername = async (username: string) => {
  const user = await UserModel.findOne({ username: username });
  
  if (!user) {
    return [];
  }

  const posts = await PostModel.find({ author: user._id })
    .sort({ createdAt: -1 })
    .populate('author', 'username profilePicture')
    .populate('comments.author', 'username profilePicture');
    
  return posts;
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
    .populate('comments.author', 'username profilePicture');

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
        updatedPost = await PostModel.findByIdAndUpdate(
            postId,
            { $pull: { likes: userId } },
            { new: true }
        );
        return { message: 'Post unliked successfully', post: updatedPost };
    } else {
        updatedPost = await PostModel.findByIdAndUpdate(
            postId,
            { $addToSet: { likes: userId } },
            { new: true }
        );

        // --- NOTIFICATION LOGIC ---
        // FIX: We use 'as any' here because TS doesn't know 'author' is populated or is an ID
        if(updatedPost && post.author.toString() !== userId) {
            const notification = await NotificationModel.create({
                recipient: post.author,
                sender: userId,
                type: 'like',
                post: postId,
                message: 'liked your post',
            });

            await notification.populate('sender', 'username profilePicture');
            
            // FIX: 'as any' to safely access .toString()
            io.to(post.author.toString()).emit('newNotification', notification);
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
        createdAt: new Date(), 
    };

    const updatedPost = await PostModel.findByIdAndUpdate(
        postId,
        {
            $push: { comments: newComment }
        },
        { new: true } 
    )
    .populate('author', 'username profilePicture')
    .populate('comments.author', 'username _id profilePicture'); 

    if (!updatedPost) {
        throw new ApiError(404, 'Post not found');
    }

    // --- NOTIFICATION LOGIC ---
    // FIX: We cast to 'any' because updatedPost.author is a full object now (due to populate)
    // but TypeScript interface says it's an ObjectId.
    if ((updatedPost.author as any)._id.toString() !== userId) {
        const notification = await NotificationModel.create({
            recipient: (updatedPost.author as any)._id,
            sender: userId,
            type: 'comment',
            post: postId,
            message: `commented: "${commentText.substring(0, 20)}..."`,
        });

        await notification.populate('sender', 'username profilePicture');
        io.to((updatedPost.author as any)._id.toString()).emit('newNotification', notification);
    }

    return updatedPost;
};

export const getTrendingPosts = async () => {
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
    const trendingPosts = await PostModel.aggregate([
        {
            $match: { createdAt: { $gte: fortyEightHoursAgo } },
        },
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
        { $sort: { engagementScore: -1 } },
        { $limit: 10 },
        {
            $lookup: {
                from: 'users',
                localField: 'author',
                foreignField: '_id',
                as: 'authorDetails',
            },
        },
        { $unwind: '$authorDetails' },
        {
            $project: {
                content: 1,
                imageUrl: 1,
                mediaUrl: 1,
                mediaType: 1,
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
    .populate('author', 'username profilePicture')
    .populate('comments.author', 'username profilePicture');

    return reels;
};

export const deletePost = async (postId: string, userId: string) => {
  const post = await PostModel.findById(postId);
  if (!post) throw new ApiError(404, 'Post not found');

  if (post.author.toString() !== userId) {
    throw new ApiError(403, 'You are not authorized to delete this post');
  }

  await PostModel.findByIdAndDelete(postId);


  return { message: 'Post deleted successfully' };
};