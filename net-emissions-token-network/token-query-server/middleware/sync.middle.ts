// synchronize middleware
import {Request, Response, NextFunction } from 'express';
import { fillTokens } from '../controller/synchronizer';

export async function synchronize(req: Request, res: Response, next: NextFunction) {
    await fillTokens();
    next();
}