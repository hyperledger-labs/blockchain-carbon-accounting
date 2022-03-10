import { Router, Request, Response, NextFunction } from 'express';
import { appLogger } from '../../utils/logger';
import registerEnroll from './registerEnroll';
import emissionscontract from './utilityEmissionsChannel';
import identity from './identity';
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
