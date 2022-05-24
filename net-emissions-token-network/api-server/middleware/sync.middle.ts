// synchronize middleware
import {Request, Response, NextFunction } from 'express';
import { fillBalances, fillTokens } from '../controller/synchronizer';

let running = false;

/** This will synchronize the database with the blockchain, **should only be used for blockchains that do not support event subscriptions**.
(For example hardhat).
This updates the tokens and balances since the last synchronization.
*/
export async function synchronizeTokens(req: Request, _: Response, next: NextFunction) {
    if(running) return next();
    running = true;
    const lastBlock = await fillTokens(req.context.opts);
    await fillBalances(lastBlock, req.context.opts);
    running = false;
    next();
}
