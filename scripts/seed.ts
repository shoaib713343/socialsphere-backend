// scripts/seed.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { UserModel } from '../src/features/auth.model';
import { PostModel } from '../src/features/post.model';

dotenv.config({ path: '.env' });

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in the environment variables.');
    }

    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for seeding...');

    // 1. Clean the database
    console.log('Cleaning database...');
    await UserModel.deleteMany({});
    await PostModel.deleteMany({});

    // 2. Create Users
    console.log('Creating users...');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const users = await UserModel.create([
      { username: 'alice', email: 'alice@example.com', password: hashedPassword },
      { username: 'bob', email: 'bob@example.com', password: hashedPassword },
      { username: 'charlie', email: 'charlie@example.com', password: hashedPassword },
    ]);

    const [userAlice, userBob, userCharlie] = users;
    console.log(`${users.length} users created.`);

    // 3. Create Posts
    console.log('Creating posts...');
    const posts = await PostModel.create([
      // Post 1: Very popular, recent
      {
        author: userAlice._id,
        content: 'This is a super popular post from today!',
        likes: [userBob._id, userCharlie._id],
        comments: [
          { author: userBob._id, text: 'Great post!' },
          { author: userCharlie._id, text: 'Awesome!' },
        ],
        createdAt: new Date(), // Now
      },
      // Post 2: Less popular, recent
      {
        author: userBob._id,
        content: 'A recent post with one like.',
        likes: [userAlice._id],
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
      },
      // Post 3: No engagement, recent
      {
        author: userCharlie._id,
        content: 'Just posted this, no likes yet.',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      // Post 4: Popular, but OLD (should not appear in trending)
      {
        author: userAlice._id,
        content: 'This was a popular post from last week!',
        likes: [userBob._id, userCharlie._id],
        comments: [{ author: userBob._id, text: 'Still relevant!' }],
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      },
      // Post 5: Decent engagement, recent
      {
        author: userCharlie._id,
        content: 'What does everyone think about the new update?',
        likes: [userAlice._id],
        comments: [{ author: userBob._id, text: 'I like it!' }],
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
      },
    ]);
    console.log(`${posts.length} posts created.`);

    console.log('Database seeded successfully! 🌱');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
  }
};

seedDatabase();