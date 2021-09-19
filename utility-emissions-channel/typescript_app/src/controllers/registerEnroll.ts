import { Request, Response } from 'express';
import { fabricRegistryService } from '../service/service';

export async function enroll(req: Request, res: Response): Promise<void> {
    try {
        await fabricRegistryService.enroll({
            body: req.body,
            header: req.headers,
            query: req.query,
        });
        res.status(201).send();
    } catch (error) {
        res.status(error.status).json({
            msg: error.message,
        });
    }
}

export async function register(req: Request, res: Response): Promise<void> {
    try {
        const cred = await fabricRegistryService.register({
            body: req.body,
            header: req.headers,
            query: req.query,
        });
        res.status(201).json(cred);
    } catch (error) {
        res.status(error.status).json({
            msg: error.message,
        });
    }
}
