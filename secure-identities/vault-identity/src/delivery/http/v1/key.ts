import { Router, Request, Response } from 'express';
import { query, validationResult } from 'express-validator';
import { log } from '../../../utils/logger';

import { VaultIdentityBackend } from '../../../service/vault';

export default class KeyRouter {
    readonly router: Router;
    constructor(private readonly backend: VaultIdentityBackend) {
        this.router = Router();
        this.__setupEndpoints();
    }
    private __setupEndpoints() {
        this.router.post(
            '/',
            [
                query('kty').custom((input) => {
                    if (!['ecdsa-p256', 'ecdsa-p384'].includes(input)) {
                        throw new Error(
                            `require 'ecdsa-p256' | 'ecdsa-p384', but provided : ${input}`,
                        );
                    }
                    return true;
                }),
            ],
            this.createNewKey.bind(this),
        );
        this.router.patch('/', this.rotateKey.bind(this));

        this.router.get('/', this.getKeyDetails.bind(this));
    }

    private async createNewKey(req: Request, res: Response) {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            log.debug(`bad request : ${JSON.stringify(errors.array())}`);
            return res.status(400).json({ msg: `bad request : ${errors.array()}` });
        }
        const token = (req as any).local.token;
        const username = (req as any).local.username;
        const kty = req.query.kty;
        try {
            await this.backend.createTransitKey(
                token,
                username,
                kty as 'ecdsa-p256' | 'ecdsa-p384',
            );
            res.status(201).send();
        } catch (error) {
            log.debug(`failed to rotate transit key : ${error}`);
            return res.status(409).json({ msg: `failed to create transit key : ${error}` });
        }
    }
    private async rotateKey(req: Request, res: Response) {
        const token = (req as any).local.token;
        const username = (req as any).local.username;
        try {
            await this.backend.rotateTransitKey(token, username);
            res.status(200).send();
        } catch (error) {
            log.debug(`failed to rotate transit key : ${error}`);
            return res.status(409).json({ msg: `failed to rotate transit key : ${error}` });
        }
    }

    private async getKeyDetails(req: Request, res: Response) {
        const token = (req as any).local.token;
        const username = (req as any).local.username;
        try {
            const key = await this.backend.readTransitKey(token, username);
            res.status(200).json(key);
        } catch (error) {
            log.debug(`failed to read transit key : ${error}`);
            return res.status(409).json({ msg: `failed to read transit key : ${error}` });
        }
    }
}
