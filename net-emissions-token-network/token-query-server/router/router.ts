import express from 'express';
import { getBalances } from '../controller/balance.controller';
import { getTokens } from '../controller/token.controller';
import { getWallets, insertNewWallet } from '../controller/wallet.controller';

const router = express.Router();

router.get('/tokens', getTokens);
router.get('/balances', getBalances)
router.get('/wallets', getWallets)
router.post('/wallets', insertNewWallet)

export default router;
