import express from 'express';
import { getBalances } from '../controller/balance.controller';
import { handleSignedMessage } from '../controller/signedMessage.controller';
import { getTokens } from '../controller/token.controller';
import { getWallets, insertNewWallet } from '../controller/wallet.controller';

const router = express.Router();

router.get('/tokens', getTokens);
router.get('/balances', getBalances)
router.get('/wallets', getWallets)
router.post('/wallets', insertNewWallet)

// WIP: testing signed message for POST
router.post('/signedMessage', handleSignedMessage);

export default router;
