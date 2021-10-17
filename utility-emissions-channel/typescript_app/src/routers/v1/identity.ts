import { Router } from 'express';
import { webSocket } from '../../controllers/identity';

const router = Router();

router.post('/webSocket', webSocket);

export default router;
