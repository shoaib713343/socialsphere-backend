import mongoose, { Schema, model, Document } from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables to get the MONGO_URI
dotenv.config();

// --- We are redefining everything in this one file to isolate it ---

// 1. Define the TypeScript interface
export interface ITestUser extends Document {
  _id: mongoose.Types.ObjectId; // Be explicit about the _id type
  username: string;
  email: string;
}

// 2. Create the Mongoose schema
const testUserSchema = new Schema<ITestUser>({
  username: { type: String, required: true },
  email: { type: String, required: true },
});

// 3. Create the model
const TestUserModel = model<ITestUser>('TestUser', testUserSchema);

// 4. Create an async function to run the test
const runTest = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI not found in .env file');
    }
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected.');

    // Find a user (replace with an email that exists in your DB)
    const userEmail = 'john.doe@example.com'; 
    console.log(`Searching for user with email: ${userEmail}`);

    const user: ITestUser | null = await TestUserModel.findOne({ email: userEmail });

    if (user) {
      console.log('User found!');
      // THIS IS THE CRITICAL TEST:
      const userIdString = user._id.toString();
      console.log('Successfully accessed and converted user._id:', userIdString);
    } else {
      console.log('User not found.');
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  }
};

// 5. Run the function
runTest();