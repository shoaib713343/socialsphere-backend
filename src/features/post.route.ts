import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import validate from '../middleware/validate';
import { addCommentSchema, createPostSchema } from './post.validation';
import { addCommentHandler, createPostHandler, getAllPostsHandler, getFollowingFeedHandler, getPostsByUsernameHandler, getTrendingPostsHandler, getVideoReelsHandler, toggleLikePostHandler } from './post.controller';
import { upload } from '../middleware/multer.middleware';
import { getTrendingPosts } from './post.service';

const router = Router();

router.get('/', getAllPostsHandler);
router.post('/', protect, upload.single('media'), validate(createPostSchema), createPostHandler);
router.get('/feed', protect, getFollowingFeedHandler);
router.get('/user/:username', getPostsByUsernameHandler);
router.post('/:postId/like', protect, toggleLikePostHandler);
router.post('/:postId/comments', protect, validate(addCommentSchema), addCommentHandler);
router.get('/trending', getTrendingPostsHandler);
router.get('/reels', getVideoReelsHandler);


export default router;