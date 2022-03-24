import { Response, Request } from 'express';
import { Balance } from '../models/balance.model';
import { QueryBundle, BalancePayload } from "../models/commonTypes";
import { insert, selectPaginated } from '../repositories/balance.repo';
import { queryProcessor } from '../middleware/base.middle';
import { InsertResult } from 'typeorm';

export async function getBalances(req: Request, res: Response) {
    try {
        const offset = parseInt(req.query.offset as string || '0');
        const limit = parseInt(req.query.limit as string || '25');

        const bundles: Array<String> = req.query.bundles as Array<string>;

    } catch (error) {
        
    }
}

export async function insertNewBalance(balance: BalancePayload): Promise<InsertResult> {
    return insert(balance);
}