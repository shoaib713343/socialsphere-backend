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
    
    await mongoose.connect(mongoUri);

    // Find a user (replace with an email that exists in your DB)
    const userEmail = 'john.doe@example.com'; 


    const user: ITestUser | null = await TestUserModel.findOne({ email: userEmail });

    if (user) {

      // THIS IS THE CRITICAL TEST:
      const userIdString = user._id.toString();
    }
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await mongoose.disconnect();
  }
};

// 5. Run the function
runTest();