
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
  getNotificationsHandler, // New
  markNotificationsReadHandler // New
} from './user.controller';
import validate from '../middleware/validate';
import { upload } from '../middleware/multer.middleware';

const router = Router();

router.use(protect); // Apply protection to all routes

// --- SPECIFIC ROUTES (Must be first) ---
router.get('/', getAllUsersHandler);
router.get('/me', getMeHandler);
router.post('/me/phone', validate(addPhoneSchema), addPhoneHandler);
router.post('/me/phone/verify', validate(verifyOtpSchema), verifyPhoneOtpHandler);
router.put('/me/avatar', upload.single('avatar'), updateUserProfilePictureHandler);

// Notification Routes (Specific)
router.get('/notifications', getNotificationsHandler);
router.put('/notifications/read', markNotificationsReadHandler);


// --- DYNAMIC ROUTES (Must be last) ---
router.post('/:userId/follow', toggleFollowHandler);
router.get('/:username', getUserProfileHandler);

export default router;