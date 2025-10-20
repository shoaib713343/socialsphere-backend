// src/features/auth.service.ts
import { UserModel, IUser } from './auth.model';
import ApiError from '../utils/ApiError';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import { sendEmail } from '../utils/mail';
import logger from '../utils/logger';
import { sendSms } from '../utils/sms';

export const registerUser = async (userData: Record<string, any>) => {
  const existingUser = await UserModel.findOne({
    $or: [{ email: userData.email }, { username: userData.username }],
  });

  if (existingUser) {
    throw new ApiError(409, 'User with this email or username already exists');
  }

  const user = await UserModel.create(userData);

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${config.backendUrl}/api/v1/auth/verify-email?token=${verificationToken}`;
  const message = `<p>Please verify your email by clicking this link: <a href="${verificationUrl}">${verificationUrl}</a></p>`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'SocialSphere - Email Verification',
      html: message,
    });
  } catch (error) {
    logger.error('Email could not be sent', error);
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });
  }

  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

export const generateAccessAndRefreshTokens = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  const accessTokenPayload = { 
    _id: user._id, 
    username: user.username, 
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    following: user.following || [], // Ensure 'following' is always an array
    followers: user.followers || [], // Ensure 'followers' is always an array
    profilePicture: user.profilePicture || ''
  };
  const accessToken = jwt.sign(
    accessTokenPayload,
    config.jwt.accessTokenSecret,
    { expiresIn: config.jwt.accessTokenExpiry }
  );
  const refreshToken = jwt.sign({ _id: user._id }, config.jwt.refreshTokenSecret, {
    expiresIn: config.jwt.refreshTokenExpiry,
  });
  return { accessToken, refreshToken };
};

export const loginUser = async (loginData: Record<string, any>) => {
  const { email, password } = loginData;
  const user: IUser | null = await UserModel.findOne({ email }).select('+password');
  if (!user) { throw new ApiError(401, 'Invalid email or password'); }
  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) { throw new ApiError(401, 'Invalid email or password'); }
  
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id.toString());
  const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
  user.refreshToken = hashedRefreshToken;
  await user.save({ validateBeforeSave: false });

  const userFromToken = jwt.decode(accessToken);

  return { user: userFromToken, accessToken, refreshToken };
};

export const refreshAccessToken = async (token: string) => {
  if (!token) { throw new ApiError(401, 'Unauthorized: No refresh token provided'); }
  const decoded = jwt.verify(token, config.jwt.refreshTokenSecret) as { _id: string };
  const user = await UserModel.findById(decoded._id);
  if (!user) { throw new ApiError(401, 'Unauthorized: Invalid refresh token'); }
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  if (user.refreshToken !== hashedToken) { throw new ApiError(401, 'Unauthorized: Refresh token has expired or is invalid'); }
  
  // Use the central function to guarantee a complete token is always created
  const { accessToken } = await generateAccessAndRefreshTokens(user._id.toString());
  return { accessToken };
};
export const logoutUser = async (userId: string) => {
  await UserModel.findByIdAndUpdate(userId, { $unset: { refreshToken: 1 } });
};

export const toggleFollowUser = async (currentUserId: string, targetUserId: string) => {
    if (currentUserId === targetUserId) {
      throw new ApiError(400, 'You cannot follow yourself');
    }
  
    const currentUser = await UserModel.findById(currentUserId);
  
    if (!currentUser) {
      throw new ApiError(404, 'Current user not found');
    }
  
    const isFollowing = currentUser.following.some(id => id.equals(targetUserId));
  
    if (isFollowing) {
      // Unfollow
      await UserModel.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId } });
      await UserModel.findByIdAndUpdate(targetUserId, { $pull: { followers: currentUserId } });
      return { message: 'User unfollowed successfully' };
    } else {
      // Follow
      await UserModel.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
      await UserModel.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
      return { message: 'User followed successfully' };
    }
};

// --- THIS FUNCTION IS THE MAIN CHANGE ---
export const verifyEmail = async (token: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await UserModel.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });
  if (!user) { throw new ApiError(400, 'Invalid or expired verification token'); }
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;
  await user.save();
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id.toString());
  return { user, accessToken, refreshToken };
};

export const addPhoneAndSendOtp = async (userId: string, phoneNumber: string) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  await UserModel.findByIdAndUpdate(userId, {
    phoneNumber,
    phoneOtp: hashedOtp,
    phoneOtpExpiry: otpExpiry,
    isPhoneVerified: false,
  });

  const messageBody = `Your SocialSphere verification code is: ${otp}`;
  await sendSms(phoneNumber, messageBody);

  return { message: 'OTP sent successfully' };
};

export const verifyPhoneOtp = async (userId: string, otp: string) => {
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');
  const user = await UserModel.findById(userId).select('+phoneOtp +phoneOtpExpiry');

  if (!user || !user.phoneOtp || !user.phoneOtpExpiry) {
    throw new ApiError(400, 'OTP was not requested or has already been used');
  }
  if (user.phoneOtpExpiry < new Date(Date.now())) {
    throw new ApiError(400, 'OTP has expired');
  }
  if (user.phoneOtp !== hashedOtp) {
    throw new ApiError(400, 'Invalid OTP');
  }
  user.isPhoneVerified = true;
  user.phoneOtp = undefined;
  user.phoneOtpExpiry = undefined;
  await user.save();
  return { message: 'Phone number verified successfully' };
};

export const forgotPassword = async (email: string) => {
  const user = await UserModel.findOne({ email });
  if (!user) {
    return;
  }
  const resetToken = user.generatePasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;
    const message = `<p>You requested a password reset. Click this link: <a href="${resetUrl}">${resetUrl}</a></p>`;
    await sendEmail({
      to: user.email,
      subject: 'SocialSphere - Password Reset Request',
      html: message,
    });
  } catch (error) {
    user.passwordResetToken = undefined;
    user.passwordResetExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Email could not be sent. Please try again.');
  }
};

export const resetPassword = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  });
  if (!user) {
    throw new ApiError(400, 'Token is invalid or has expired');
  }
  user.password = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;
  await user.save();
};


export const resendVerificationEmail = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  if (user.isEmailVerified) {
    throw new ApiError(400, 'Email is already verified');
  }

  const verificationToken = user.generateEmailVerificationToken();
  await user.save({ validateBeforeSave: false });

  const verificationUrl = `${config.backendUrl}/api/v1/auth/verify-email?token=${verificationToken}`;
  const message = `<p>Here is your new verification link: <a href="${verificationUrl}">${verificationUrl}</a></p>`;

  try {
    await sendEmail({
      to: user.email,
      subject: 'SocialSphere - Resend Email Verification',
      html: message,
    });
    return { message: 'Verification email resent successfully.' };
  } catch (error) {
    logger.error('Email could not be resent', error);
    // Clear the token so they can try again
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(500, 'Email could not be sent.');
  }
};
