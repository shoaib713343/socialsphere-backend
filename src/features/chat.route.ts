import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getChatHistoryHandler } from './chat.controller';

const router = Router();


router.use(protect);


router.get('/:userId', getChatHistoryHandler);

export default router;