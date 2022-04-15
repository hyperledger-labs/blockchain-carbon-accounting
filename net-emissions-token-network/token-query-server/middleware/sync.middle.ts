// synchronize middleware
import {Request, Response, NextFunction } from 'express';
import { fillBalances, fillTokens } from '../controller/synchronizer';

let running = false;

// for hardhat test!
export async function synchronizeTokens(req: Request, res: Response, next: NextFunction) {
    if(running) return next();
    running = true;
    const lastBlock = await fillTokens();
    await fillBalances(lastBlock);
    running = false;
    next();
}
