import { Router } from 'express';
import { protect } from '../middleware/auth.middleware';
import { getChatHistoryHandler, getConversationsHandler } from './chat.controller';

const router = Router();


router.use(protect);

router.get('/conversations', getConversationsHandler);
router.get('/:userId', getChatHistoryHandler);

export default router;