import { VaultIdentityBackend } from '../../../service/vault';
import { Router, Request, Response } from 'express';
import { header, validationResult } from 'express-validator';
import { log } from '../../../utils/logger';

export default class SecretsRouter {
    readonly router: Router;
    constructor(private readonly backend: VaultIdentityBackend) {
        this.router = Router();
        this.__setupEndpoints();
    }
    private __setupEndpoints() {
        this.router.post(
            '/eth',
            [header('address').isHexadecimal(), header('private').isHexadecimal()],
            this.putEthKey.bind(this),
        );
        this.router.get('/eth', this.getEthKey.bind(this));
        this.router.delete('/eth', this.deleteEthKey.bind(this));
    }

    private async putEthKey(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            log.debug(`bad request : ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ msg: `bad request : ${errors.array()}` });
        }
        const token = (req as any).local.token;
        const username = (req as any).local.username;

        try {
            await this.backend.putSecret(token, `eth-${username}`, {
                address: req.header('address'),
                private: req.header('private'),
            });
            res.status(200).send();
        } catch (error) {
            log.debug(`failed to put ethereum key : ${error}`);
            return res.status(409).json({ msg: `failed to put ethereum key : ${error}` });
        }
    }
    private async getEthKey(req: Request, res: Response) {
        const token = (req as any).local.token;
        const username = (req as any).local.username;

        try {
            const secret = await this.backend.getSecret(token, `eth-${username}`);
            res.status(200).json(secret);
        } catch (error) {
            log.debug(`failed to get ethereum key : ${error}`);
            return res.status(409).json({ msg: `failed to get ethereum key : ${error}` });
        }
    }
    private async deleteEthKey(req: Request, res: Response) {
        const token = (req as any).local.token;
        const username = (req as any).local.username;

        try {
            await this.backend.deleteSecret(token, `eth-${username}`);
            res.status(200).send();
        } catch (error) {
            log.debug(`failed to delete ethereum key : ${error}`);
            return res.status(409).json({ msg: `failed to delete ethereum key : ${error}` });
        }
    }
}
