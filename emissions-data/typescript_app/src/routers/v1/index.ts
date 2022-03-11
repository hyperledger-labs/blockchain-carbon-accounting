import { NextFunction, Request, Response, Router } from 'express';
import { appLogger } from '../../utils/logger';
import emissionscontract from './emissionsChannel';
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

router.use('/emissions-data/registerEnroll', registerEnroll);
router.use('/emissions-data/emissionscontract', emissionscontract);
router.use('/emissions-data/identity', identity);

export default router;
