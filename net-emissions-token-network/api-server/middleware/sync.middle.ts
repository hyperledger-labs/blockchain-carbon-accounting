// synchronize middleware
import {Request, Response, NextFunction } from 'express';
import { fillBalances, fillTokens, truncateTable } from '../controller/synchronizer';

let running = false;

// for hardhat test!
export async function synchronizeTokens(req: Request, _: Response, next: NextFunction) {
    if(running) return next();
    running = true;
    await truncateTable();
    const lastBlock = await fillTokens(req.context.opts);
    await fillBalances(lastBlock, req.context.opts);
    running = false;
    next();
}
