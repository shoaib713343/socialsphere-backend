import { Response } from 'express';
import { Request } from 'express'; // Use the globally typed Request
import * as postService from './post.service';
import asyncHandler from 'express-async-handler';
import ApiError from '../utils/ApiError';
import { IUser } from './auth.model';
import { success } from 'zod';

export const createPostHandler = asyncHandler(
    async (req: Request, res: Response) => {
        const {content} = req.body;
        const user  = req.user as IUser;
    const authorId = user._id;
        const file = req.file;

        const newPost = await postService.createPost({content}, authorId.toString(), file);

        res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Post created successfully',
      data: newPost,
    });
    }
)

export const getAllPostsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // Set default values for pagination
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await postService.getAllPosts({ page, limit });

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: posts,
    });
  }
);

export const getFollowingFeedHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user  = req.user as IUser;
    const userId = user._id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const posts = await postService.getFollowingFeed(userId.toString(), {page, limit});
     res.status(200).json({
      success: true,
      statusCode: 200,
      data: posts,
    });
  }
);

export const toggleLikePostHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user  = req.user as IUser;
        const userId = user._id;
    const { postId } = req.params;

    const result = await postService.toggleLikePost(userId.toString(), postId);

    res.status(200).json({
      success: true,
      statusCode: 200,
      message: result.message,
      data: result.post,
    });
  }
);

export const addCommentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const user  = req.user as IUser;
        const userId = user._id;
    const {postId} = req.params;
    const {text} = req.body;

     const updatedPost = await postService.addCommentToPost(userId.toString(), postId, text);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: 'Comment added successfully',
      data: updatedPost,
    });
  }
);

export const getTrendingPostsHandler = asyncHandler(
  async(req: Request, res: Response) => {
    const posts = await postService.getTrendingPosts();
     res.status(200).json({
      success: true,
      statusCode: 200,
      data: posts,
    });
  }
);

export const getVideoReelsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const reels = await postService.getVideoReels({page, limit});

    res.status(200).json({
      success: true,
      statusCode: 200,
      data: reels,
    });

  }
);

export const getPostsByUsernameHandler = asyncHandler(
  async (req: Request, res: Response) => {
    // The parameter from the URL is now 'username'
    const { username } = req.params;
    
    // Call the new service function that can handle a username
    const posts = await postService.getPostsByUsername(username);
    
    res.status(200).json({
      success: true,
      statusCode: 200,
      data: posts,
    });
  }
);

export const deletePostHandler = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const userId = (req.user as IUser)._id;
  
  const result = await postService.deletePost(postId, userId.toString());
  
  res.status(200).json({ 
    success: true, 
    statusCode: 200, 
    message: result.message 
  });
});
