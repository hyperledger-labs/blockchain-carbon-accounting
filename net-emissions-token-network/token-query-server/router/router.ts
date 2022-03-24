import express from 'express';
import { getBalances, getNumOfBalances } from '../controller/balance.controller';
import { getNumOfTokens, getTokens } from '../controller/token.controller';

const router = express.Router();

router.get('/tokens/count', getNumOfTokens);
router.get('/tokens', getTokens);

router.get('/balances/count', getNumOfBalances);
router.get('/balances', getBalances)

export default router;