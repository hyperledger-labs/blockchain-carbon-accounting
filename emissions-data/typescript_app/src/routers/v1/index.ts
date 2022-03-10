import { NextFunction, Request, Response, Router } from 'express';
import { appLogger } from '../../utils/logger';
import emissionscontract from './EmissionsChannel';
import identity from './identity';
import registerEnroll from './registerEnroll';
const router = Router();
router.use((req: Request, res: Response, next: NextFunction) => {
    appLogger.info(`${req.method.toUpperCase()} ${req.url}`);
    if (req.headers.web_socket_key) {
        req.headers.web_socket_key = JSON.parse(`${req.headers.web_socket_key}`);
    }
    next();
});

router.use('/utilityemissionchannel/registerEnroll', registerEnroll);
router.use('/utilityemissionchannel/emissionscontract', emissionscontract);
router.use('/utilityemissionchannel/identity', identity);

export default router;
