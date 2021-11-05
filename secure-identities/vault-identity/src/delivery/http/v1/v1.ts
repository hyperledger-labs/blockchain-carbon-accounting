import { Router, Request, Response, NextFunction } from 'express';
import { VaultIdentityBackend } from '../../../service/vault';
import { log } from '../../../utils/logger';
import IdentityRouter from './identity';
import KeyRouter from './key';
import TokenRouter from './token';
import SecretsRouter from './secrets';
export default class RouterV1 {
    readonly router: Router;
    constructor(private readonly backend: VaultIdentityBackend) {
        this.router = Router();
        this.router.use((req: Request, res: Response, next: NextFunction) => {
            log.child({ url: req.url, method: req.method.toUpperCase() }).info('START');
            next();
            log.child({
                url: req.url,
                method: req.method.toUpperCase(),
                res_status: res.statusCode,
            }).info('END');
        });
        this.__routers();
    }
    private __routers() {
        this.__tokenMiddleware();
        this.router.use('/identity', new IdentityRouter(this.backend).router);
        this.router.use('/key', new KeyRouter(this.backend).router);
        this.router.use('/token', new TokenRouter(this.backend).router);
        this.router.use('/secrets', new SecretsRouter(this.backend).router);
    }

    private __tokenMiddleware() {
        this.router.use(async (req: Request, res: Response, next: NextFunction) => {
            if (
                (req.url === '/identity' && req.method.toUpperCase() === 'POST') ||
                (req.url === '/token' && req.method.toUpperCase() === 'POST')
            ) {
                next();
                return;
            }

            const authString = req.header('Authorization');
            if (authString === undefined) {
                res.status(400).json({ msg: 'Authorization Token Not-Provided' });
                return;
            }
            const auth = authString.split(' ');
            if (auth.length !== 2) {
            }

            const token = auth[1];
            try {
                const details = await this.backend.tokenDetails(token);
                (req as any).local = {
                    token: token,
                    username: details.username,
                    details: details,
                };
            } catch (error) {
                res.status(401).json({ msg: 'Unauthorized' });
                log.error(error);
                return;
            }

            next();
        });
    }
}
