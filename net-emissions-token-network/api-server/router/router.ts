import express from 'express';
import rateLimit from 'express-rate-limit'
import { getBalances } from '../controller/balance.controller';
import { countEmissionsRequests, declineEmissionsRequest, getEmissionsRequest, getEmissionsRequests, postEmissionsRequest, issueEmissionsRequest } from '../controller/emissionsRequests.controller';
import { handleSignedMessage } from '../controller/signedMessage.controller';
import { getTokens } from '../controller/token.controller';
import { getWallets, insertNewWallet, generateWalletWithCredentials, getWalletWithCredentials, verifyWalletEmail, passwordResetRequest } from '../controller/wallet.controller';

const router = express.Router();

// use a 30 seconds limiter for creating accounts and resetting passwords
const signupAndResetLimiter = rateLimit({
  windowMs: 30 * 1000, // 30 seconds
  max: 1, // Limit each IP to 1 request per `window` (here, per 30 seconds)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
})

// Apply the rate limiting middleware to API calls only
router.use('/sign-up', signupAndResetLimiter)
router.use('/request-password-reset', signupAndResetLimiter)
// test we get the correct IP (in case of proxy use)
router.get('/ip', (request: express.Request, response: express.Response) => response.send(request.ip))

router.post('/sign-up', generateWalletWithCredentials);
router.post('/sign-in', getWalletWithCredentials);
router.post('/request-password-reset/:email', passwordResetRequest);
router.get('/verify-email/:token/:email', verifyWalletEmail);

router.get('/tokens', getTokens);
router.get('/balances', getBalances)
router.get('/wallets', getWallets)
router.post('/wallets', insertNewWallet)

router.delete('/emissionsrequest/:uuid', declineEmissionsRequest);
router.put('/emissionsrequest/:uuid', issueEmissionsRequest);
router.post('/emissionsrequest', postEmissionsRequest);
router.get('/emissionsrequest/:uuid', getEmissionsRequest);
router.get('/emissionsrequests/:auditor', getEmissionsRequests);
router.get('/emissionsrequests/:auditor/:op', countEmissionsRequests);

// WIP: testing signed message for POST
router.post('/signedMessage', handleSignedMessage);

export default router;
