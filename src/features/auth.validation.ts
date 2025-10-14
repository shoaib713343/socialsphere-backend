import { email, z } from 'zod';

export const registerUserSchema = z.object({
  body: z.object({
    username: z
      .string().nonempty("Username is required")
      .min(3, 'Username must be at least 3 characters long'),
    email: z
      .string().nonempty("email is required")
      .email('Not a valid email'),
    password: z
      .string().nonempty("password is required")
      .min(8, 'Password must be at least 8 characters long'),
  }),
});

export const loginUserSchema = z.object({
  body: z.object({
    email: z.string().nonempty('Email is required').email('Not a valid email'),
    password: z.string().nonempty('Password is required'),
  }),
});

export const addPhoneSchema = z.object({
  body: z.object({
    phoneNumber: z
      .string()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        'Phone number must be in E.164 format (e.g., +919876543210)'
      ),
  }),
});

export const verifyOtpSchema = z.object({
  body: z.object({
    otp: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please provide a valid email address'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters long'),
    passwordConfirm: z.string(),
  })
}).refine((data) => data.body.newPassword === data.body.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['body', 'passwordConfirm'],
});