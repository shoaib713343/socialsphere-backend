import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { addPhoneHandler, getMeHandler, verifyPhoneOtpHandler } from './user.controller';
import { toggleFollowHandler } from './auth.controller';
import validate from '../middleware/validate';
import { addPhoneSchema, verifyOtpSchema } from './auth.validation';

const router = Router();


router.use(protect);

router.get('/me', getMeHandler);
router.post('/:userId/follow',toggleFollowHandler);
router.post('/me/phone', validate(addPhoneSchema), addPhoneHandler);
router.post('/me/phone/verify', validate(verifyOtpSchema), verifyPhoneOtpHandler);

export default router;