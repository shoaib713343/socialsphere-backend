import Redis from "ioredis";
import logger from "../utils/logger";

const redisClient = new Redis(process.env.REDIS_URL!);

redisClient.on('connect', () => {
    logger.info('Redis connected successfully. ✅');
});

redisClient.on('error', (err) => {
    logger.error('Redis connection failed. ❌', err);
});

export default redisClient;