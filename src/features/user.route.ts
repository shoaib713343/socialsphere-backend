import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { addPhoneSchema, verifyOtpSchema } from './auth.validation';
import {
  getMeHandler,
  toggleFollowHandler,
  getAllUsersHandler,
  addPhoneHandler,
  verifyPhoneOtpHandler,
  getUserProfileHandler,
  updateUserProfilePictureHandler, 
} from './user.controller';
import validate from '../middleware/validate';
import { upload } from '../middleware/multer.middleware';

const router = Router();


router.get('/', protect, getAllUsersHandler);
router.get('/me', protect, getMeHandler);
router.post('/me/phone', protect, validate(addPhoneSchema), addPhoneHandler);
router.post('/me/phone/verify', protect, validate(verifyOtpSchema), verifyPhoneOtpHandler);

router.put('/me/avatar',protect, upload.single('avatar'), updateUserProfilePictureHandler);
router.post('/:userId/follow', protect, toggleFollowHandler);

router.get('/:username', protect, getUserProfileHandler);

export default router;