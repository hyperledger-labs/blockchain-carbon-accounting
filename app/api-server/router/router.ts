import type { Request, Response } from 'express';
import { Router } from 'express';
import { getBalances } from '../controller/balance.controller';
import { countEmissionsRequests, declineEmissionsRequest, getEmissionsRequest, getEmissionsRequests, postEmissionsRequest, issueEmissionsRequest, postCalculateEmissionsRequest } from '../controller/emissionsRequests.controller';
import { handleSignedMessage } from '../controller/signedMessage.controller';
import { getTokens, getEmissionsRequestToken } from '../controller/token.controller';
import { getWallets, insertNewWallet, generateWalletWithCredentials, getWalletWithCredentials, verifyWalletEmail, passwordResetRequest } from '../controller/wallet.controller';
import { makeRateLimiterMiddleware, signinLimiter, signupAndResetLimiter } from '../utils/rateLimiter';

const router = Router();

// use a 30 seconds limiter for creating accounts and resetting passwords
const signupAndResetLimiterMiddleware = makeRateLimiterMiddleware(signupAndResetLimiter);
const signinLimiterMiddleware = makeRateLimiterMiddleware(signinLimiter);
// Apply the rate limiting middleware to API callsonly
router.use('/sign-up', signupAndResetLimiterMiddleware)
router.use('/request-password-reset', signupAndResetLimiterMiddleware)
// test we get the correct IP (in case of proxy use)
router.get('/ip', (request: Request, response: Response) => response.send(request.ip))

// use a basic limiter for signin
router.use('/sign-up', signinLimiterMiddleware)
router.post('/sign-in', getWalletWithCredentials);

router.post('/sign-up', generateWalletWithCredentials);
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

router.get('/emissionsrequesttoken/:nodeid/:requestuuid', getEmissionsRequestToken);

// for non-registered users
router.post('/calcemissionsrequest', postCalculateEmissionsRequest);


// WIP: testing signed message for POST
router.post('/signedMessage', handleSignedMessage);

export default router;
