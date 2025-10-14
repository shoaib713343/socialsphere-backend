import mongoose from "mongoose";
import logger from '../utils/logger';

const connectDB = async () => {
    try {
        if(!process.env.MONGODB_URI) {
            throw new Error('MONGO_URI is not defined in the environment variables.');
        }
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('MongoDB connected successfully. ✅')
    } catch (error) {
        logger.error('MongoDB connection failed. ❌', error);
        process.exit(1);
    }
};

export default connectDB;