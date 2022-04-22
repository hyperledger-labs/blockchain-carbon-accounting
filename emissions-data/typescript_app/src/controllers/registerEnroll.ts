import { Request, Response } from 'express';
import ClientError from '../errors/clientError';
import { fabricRegistryService } from '../service/service';

export async function enroll(req: Request, res: Response): Promise<void> {
    try {
        await fabricRegistryService.enroll({
            body: req.body,
            header: req.headers as Record<string, string | unknown>,
            query: req.query as Record<string, string>,
        });

        res.status(201).send();
    } catch (error) {
        if (error instanceof ClientError) {
            res.status(error.status).json({
                msg: error.message,
            });
        } else {
            const msg = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                msg,
            });
        }
    }
}

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const cred = await fabricRegistryService.register({
            body: req.body,
            header: req.headers as Record<string, string | unknown>,
            query: req.query as Record<string, string>,
        });
        res.status(201).json(cred);
    } catch (error) {
        if (error instanceof ClientError) {
            res.status(error.status).json({
                msg: error.message,
            });
        } else {
            const msg = error instanceof Error ? error.message : String(error);
            res.status(500).json({
                msg,
            });
        }
    }
}
