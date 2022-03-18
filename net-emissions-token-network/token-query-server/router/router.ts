import express from 'express';
import { getNumOfTokens, getTokens } from '../controller/token.controller';

const router = express.Router();

router.get('/count', getNumOfTokens);
router.get('/tokens', getTokens);

export default router;