import { Router } from 'express';
import validate from '../middleware/validate';
import { forgotPasswordSchema, loginUserSchema, registerUserSchema, resetPasswordSchema } from './auth.validation';
import { forgotPasswordHandler, loginSuccessHandler, loginUserHandler, logoutUserHandler, registerUserHandler, resendVerificationEmailHandler, resetPasswordHandler, verifyEmailHandler } from './auth.controller';
import { refreshAccessTokenHandler } from './auth.controller';
import { protect } from '../middleware/auth.middleware';
import passport from 'passport';

const router = Router();

router.post('/register', validate(registerUserSchema), registerUserHandler);
router.post('/login', validate(loginUserSchema), loginUserHandler);
router.post('/resend-verification', protect, resendVerificationEmailHandler);
router.post('/refresh-token', refreshAccessTokenHandler);
router.post('/logout', protect, logoutUserHandler);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPasswordHandler);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPasswordHandler);
router.get('/verify-email', verifyEmailHandler);
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));
router.get('/google/callback', passport.authenticate('google', { session: false, failureRedirect: '/login-failed' }), loginSuccessHandler);


export default router;
