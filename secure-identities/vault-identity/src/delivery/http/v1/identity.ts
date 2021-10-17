import { Router, Request, Response } from 'express';
import { VaultIdentityBackend } from '../../../service/vault';
import { body, header, validationResult } from 'express-validator';
import { randomBytes } from 'crypto';
import { log } from '../../../utils/logger';
export default class IdentityRouter {
    readonly router: Router;
    constructor(private readonly backend: VaultIdentityBackend) {
        this.router = Router();
        this.__setupEndpoints();
    }
    private __setupEndpoints() {
        this.router.post(
            '/',
            [
                header('Authorization').isString().notEmpty(),
                body('username').isString().notEmpty(),
                body('identity_type').custom((type) => {
                    if (!['MANAGER', 'CLIENT'].includes(type)) {
                        throw new Error(`require CLIENT | MANAGER, but provided : ${type}`);
                    }
                    return true;
                }),
            ],
            this.createIdentity.bind(this),
        );
        this.router.patch(
            '/',
            [header('new_password').isString().notEmpty()],
            this.updateIdentityPassword.bind(this),
        );
    }

    private async createIdentity(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            log.debug(`bad request : ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ msg: `bad request : ${errors.array()}` });
        }
        const auth = req.header('Authorization').split(' ');
        if (auth.length !== 2) {
            res.status(400).json({ msg: 'Authorization Token Not-Provided' });
            return;
        }

        const token = auth[1];
        const username = req.body.username;
        const identityType = req.body.identity_type;
        const password = randomBytes(16).toString('hex');
        try {
            if (identityType === 'CLIENT') {
                await this.backend.createClientIdentity(token, username, password);
            } else if (identityType === 'MANAGER') {
                await this.backend.createManagerIdentity(token, username, password);
            }
        } catch (error) {
            log.debug(`failed to create identity : ${error}`);
            return res.status(409).json({ msg: `failed to create identity : ${error}` });
        }
        res.status(200).json({
            username: username,
            password: password,
        });
    }

    private async updateIdentityPassword(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            log.debug(`bad request : ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ msg: `bad request : ${errors.array()}` });
        }

        const token = (req as any).local.token;
        const username = (req as any).local.username;
        const password = req.header('new_password');
        log.debug(username);
        try {
            await this.backend.updateIdentityPassword(token, username, password);
            res.status(204).send();
        } catch (error) {
            log.debug(`failed to update identity password : ${error}`);
            return res.status(409).json({ msg: `failed to update identity password : ${error}` });
        }
    }
}
