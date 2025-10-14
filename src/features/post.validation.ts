import {z} from 'zod';

export const createPostSchema = z.object({
    body: z.object({
         content: z
      .string()
      .min(1, 'Post cannot be empty')
      .max(280, 'Post cannot be longer than 280 characters'),
    })
});

export const addCommentSchema = z.object({
  body: z.object({
    text: z
      .string().nonempty("Comment text is required")
      .min(1, "Comment cant be empty")
      .max(200, 'Comment cannot be longer than 200 characters'),
  }),
});