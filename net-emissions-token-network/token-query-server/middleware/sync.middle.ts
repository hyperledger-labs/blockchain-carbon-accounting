// synchronize middleware
import {Request, Response, NextFunction } from 'express';
import { fillBalances, fillTokens, truncateTable } from '../controller/synchronizer';

// for hardhat test!
export async function synchronize(req: Request, res: Response, next: NextFunction) {
    await truncateTable();
    const lastBlock = await fillTokens();
    await fillBalances(lastBlock);
    next();
}
