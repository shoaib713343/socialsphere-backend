import { UserModel, IUser } from './auth.model';
import ApiError from '../utils/ApiError';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config';
import cloudinary from '../config/cloudinary';
import { Readable } from 'stream';
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
  await user.save( {validateBeforeSave: false} );

  const verificationUrl = `http://localhost:${process.env.PORT}/api/v1/auth/verify-email?token=${verificationToken}`;
  const message = `<p>Please verify your email by clicking this link: <a href="${verificationUrl}">${verificationUrl}</a></p>`;

  try{
    await sendEmail({
      to: user.email,
      subject: 'SocialSphere - Email Verification',
      html: message,
    });
  } catch (error){
    logger.error('Email could not be sent', error);
     user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;
    await user.save({ validateBeforeSave: false });

  }

  const userObject = user.toObject();
  delete userObject.password;
  return userObject;
};

export const generateAccessAndRefreshTokens = (userId: string) => {
  const accessToken = jwt.sign({ _id: userId }, config.jwt.accessTokenSecret, {
    expiresIn: config.jwt.accessTokenExpiry,
  });
  const refreshToken = jwt.sign({ _id: userId }, config.jwt.refreshTokenSecret, {
    expiresIn: config.jwt.refreshTokenExpiry,
  });
  return { accessToken, refreshToken };
};

export const loginUser = async (loginData: Record<string, any>) => {
  const { email, password } = loginData;

  const user: IUser | null = await UserModel.findOne({ email }).select('+password');

  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const isPasswordCorrect = await user.isPasswordCorrect(password);
  if (!isPasswordCorrect) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const { accessToken, refreshToken } = generateAccessAndRefreshTokens(user._id.toString());

  const hashedRefreshToken = crypto
    .createHash('sha256')
    .update(refreshToken)
    .digest('hex');

  user.refreshToken = hashedRefreshToken;
  await user.save({ validateBeforeSave: false });

  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.refreshToken;

  return { user: userObject, accessToken, refreshToken };
};

export const refreshAccessToken = async (token: string) => {
  if(!token) {
    throw new ApiError(401, 'Unauthorized: No refresh token provided');
  }
const decoded = jwt.verify(token, config.jwt.refreshTokenSecret) as { _id: string };

const user = await UserModel.findById(decoded._id);
if(!user){
    throw new ApiError(401, 'Unauthorized: Invalid refresh token');
}

const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
if (user.refreshToken !== hashedToken) {
    throw new ApiError(401, 'Unauthorized: Refresh token has expired or is invalid');
  }

const newAccessToken = jwt.sign({_id: user._id}, config.jwt.accessTokenSecret, {
  expiresIn: config.jwt.accessTokenExpiry,
});

return {accessToken: newAccessToken};

}

export const logoutUser = async (userId: string) => {
  await UserModel.findByIdAndUpdate(
    userId, 
    {
      $unset: { refreshToken: 1 },
    },
    {new: true}
  );
};

export const toggleFollowUser = async (currentUserId: string, targetUserId: string) => {
  if (currentUserId === targetUserId) {
    throw new ApiError(400, 'You cannot follow yourself');
  }

  const currentUser = await UserModel.findById(currentUserId);
  const targetUser = await UserModel.findById(targetUserId);

  if (!currentUser || !targetUser) {
    throw new ApiError(404, 'User not found');
  }

  const isFollowing = currentUser.following.includes(targetUser._id);

  if(isFollowing){
    await UserModel.findByIdAndUpdate(currentUserId, { $pull: { following: targetUserId }});
    await UserModel.findByIdAndUpdate(targetUserId, {$pull: {followers: currentUserId}});
    return { message: 'User unfollwed successfully'};
  } else {
    // --- Follow logic ---
    await UserModel.findByIdAndUpdate(currentUserId, { $addToSet: { following: targetUserId } });
    await UserModel.findByIdAndUpdate(targetUserId, { $addToSet: { followers: currentUserId } });
    return { message: 'User followed successfully' };
  }

};

export const verifyEmail = async (token: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await UserModel.findOne({
    emailVerificationToken: hashedToken,
    emailVerificationExpiry: { $gt: Date.now() },
  });

  if(!user){
    throw new ApiError(400, 'Invalid or expired verification token');
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpiry = undefined;

  await user.save();
};

export const addPhoneAndSendOtp = async (userId: string, phoneNumber: string) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString(); 
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  const updatedUser= await UserModel.findByIdAndUpdate(userId, {
    phoneNumber,
    phoneOtp: hashedOtp,
    phoneOtpExpiry: otpExpiry,
    isPhoneVerified: false,
  }, {new: true}).select('+phoneOtp +phoneOtpExpiry');

   console.log('--- USER DOCUMENT AFTER OTP SAVE ---', updatedUser);

  const messageBody = `Your SocialSphere verification code is: ${otp}`;
  await sendSms(phoneNumber, messageBody);

  return { message: 'OTP sent seccessfully' };

};

export const verifyPhoneOtp = async (userId: string, otp: string) => {
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  const user = await UserModel.findById(userId).select('+phoneOtp +phoneOtpExpiry');

  console.log('--- USER DOCUMENT ON VERIFY ---', user);

  if(!user || !user.phoneOtp || !user.phoneOtpExpiry) {
    throw new ApiError(400, 'OTP was not requested or has already been used');
  }

  if(user.phoneOtpExpiry < new Date(Date.now())){
    throw new ApiError(400, 'OTP has expired');
  }

  if(user.phoneOtp !== hashedOtp){
    throw new ApiError(400, 'Invalid OTP');
  }

  user.isPhoneVerified = true;
  user.phoneOtp = undefined;
  user.phoneOtpExpiry = undefined;

  await user.save();

  return { message: 'Phone number verified successfully' };
};

export const forgotPassword = async (email:string) => {
  const user = await UserModel.findOne({ email });

  if(!user) {
    return;
  }

  const resetToken = crypto.randomBytes(20).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiryDate = new Date(Date.now() + 10 * 60 * 1000);

  await UserModel.findByIdAndUpdate(user._id, {
    passwordResetToken: hashedToken,
    passwordResetExpiry: expiryDate,
  });

  try {
    const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;
    const message = `<p>You requested a password reset. Please click this link to reset your password: <a href="${resetUrl}">${resetUrl}</a></p>`
  
    await sendEmail({
      to: user.email,
      subject: 'SocialSphere - Password Reset Request',
      html: message,
    });
  
  } catch (error) {
    await UserModel.findByIdAndUpdate(user._id, {
      passwordResetToken: undefined,
      passwordResetExpiry: undefined,
    })
    throw new ApiError(500, 'Email could not be sent. Please try again.');
  }
};

export const resetPassword  = async (token: string, newPassword: string) => {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await UserModel.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpiry: { $gt: Date.now() },
  });

  if(!user){
    throw new ApiError(400, 'Token is invalid or has expired');
  }

  user.password = newPassword;
  
  user.passwordResetToken = undefined;
  user.passwordResetExpiry = undefined;

  await user.save();

};





