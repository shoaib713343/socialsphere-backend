import mongoose, { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from "crypto";
import ApiError from '../utils/ApiError';

// Define the TypeScript interface for our User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  username: string;
  email: string;
  password?: string;
  provider: 'google' | 'email';
  isEmailVerified: boolean;
  emailVerificationToken?: string;
  emailVerificationExpiry?: Date;
  phoneNumber?: string;
  isPhoneVerified?: boolean;
  phoneOtp?: string;
  phoneOtpExpiry?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  generatePasswordResetToken(): string;

  refreshToken?: string;
  followers: mongoose.Types.ObjectId[];
  following: mongoose.Types.ObjectId[];
  isPasswordCorrect(password: string): Promise<boolean>;
  generateEmailVerificationToken(): string;
}

const userSchema = new Schema<IUser>(
  {
    username: { type: String, required: true, unique: true, trim: true, index: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: false, select: false },
    provider: { type: String, enum: ['google', 'email'], default: 'email' },
    refreshToken: { type: String },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpiry: { 
      type: Date,
      select: false,
    },
    phoneNumber: {
      type: String,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    phoneOtp: {
      type: String,
      select: false,
    },
    phoneOtpExpiry: {
      type: Date,
      select: false,
    },
    followers: [{
      type: Schema.Types.ObjectId,
      ref: 'User'
    }],
    following: [{
      type: Schema.Types.ObjectId,
      ref: 'User' 
    }],
    passwordResetToken: {
      type: String,
    },
    passwordResetExpiry: {
      type: Date,
    }

  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.methods.isPasswordCorrect = async function (password: string) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateEmailVerificationToken = function () : string {
  const verificationToken = crypto.randomBytes(20).toString('hex');
  this.emailVerificationToken = crypto
      .createHash('sha256')
      .update(verificationToken)
      .digest('hex')

  this.emailVerificationExpiry = new Date(Date.now() + 10 * 60 * 1000);

  return verificationToken;
}


export const UserModel = model<IUser>('User', userSchema);