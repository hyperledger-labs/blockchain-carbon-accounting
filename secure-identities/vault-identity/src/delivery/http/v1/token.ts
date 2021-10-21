import { Router, Request, Response } from 'express';
import { VaultIdentityBackend } from '../../../service/vault';
import { header, validationResult } from 'express-validator';
import { log } from '../../../utils/logger';

export default class TokenRouter {
    readonly router: Router;
    constructor(private readonly backend: VaultIdentityBackend) {
        this.router = Router();
        this.__setupEndpoints();
    }
    private __setupEndpoints() {
        this.router.post(
            '/',
            [header('username').isString().notEmpty(), header('password').isString().notEmpty()],
            this.newToken.bind(this),
        );
        this.router.patch('/', this.extendTTL.bind(this));
        this.router.get('/', this.getTokenDetails.bind(this));
        this.router.delete('/', this.deleteToken.bind(this));
    }
    private async newToken(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            log.debug(`bad request : ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ msg: `bad request : ${errors.array()}` });
        }

        const username = req.header('username');
        const password = req.header('password');

        try {
            const token = await this.backend.genToken(username, password);
            return res.status(200).json({ token: token });
        } catch (error) {
            log.debug(`failed to create new token : ${error}`);
            return res.status(409).json({ msg: `failed to create new token : ${error}` });
        }
    }
    private async extendTTL(req: Request, res: Response) {
        const token = (req as any).local.token;

        try {
            await this.backend.renewToken(token);
            return res.status(200).send();
        } catch (error) {
            log.debug(`failed to extend TTL of token : ${error}`);
            return res.status(409).json({ msg: `failed to extend TTL of token : ${error}` });
        }
    }

    private async getTokenDetails(req: Request, res: Response) {
        return res.status(200).json((req as any).local.details);
    }

    private async deleteToken(req: Request, res: Response) {
        const token = (req as any).local.token;

        try {
            await this.backend.revokeToken(token);
            return res.status(204).send();
        } catch (error) {
            log.debug(`failed to delete token : ${error}`);
            return res.status(409).json({ msg: `failed to delete token : ${error}` });
        }
    }
}
