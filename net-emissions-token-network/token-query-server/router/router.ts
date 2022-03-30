import express from 'express';
import { getBalances } from '../controller/balance.controller';
import { getTokens } from '../controller/token.controller';

const router = express.Router();

router.get('/tokens', getTokens);
router.get('/balances', getBalances)

export default router;