import { UserModel } from './auth.model';
import ApiError from '../utils/ApiError';
import { uploadToCloudinary } from './post.service';

export const getUserByUsername = async (username: string) => {
  const user = await UserModel.findOne({ username });
  if (!user) {
    throw new ApiError(404, 'User not found');
  }
  return user;
};

export const updateUserProfilePicture = async (userId: string, file: Express.Multer.File) => {
  if (!file) {
    throw new ApiError(400, 'No image file provided');
  }

  // Upload the image buffer to Cloudinary
  const avatarUrl = await uploadToCloudinary(file.buffer);

  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { profilePicture: avatarUrl },
    { new: true } 
  );

  if (!updatedUser) {
    throw new ApiError(404, 'User not found');
  }

  return updatedUser;
};