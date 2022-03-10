import { Router } from 'express';
import { register, enroll } from '../../controllers/registerEnroll';

const router = Router();

router.post('/enroll', enroll);
router.post('/register', register);

export default router;
