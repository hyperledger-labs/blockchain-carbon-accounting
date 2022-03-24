import { Response, Request } from 'express';
import { Balance } from '../models/balance.model';
import { QueryBundle, BalancePayload } from "../models/commonTypes";
import { insert, selectPaginated, count } from '../repositories/balance.repo';
import { queryProcessor } from '../middleware/base.middle';
import { InsertResult } from 'typeorm';

export async function getBalances(req: Request, res: Response) {
    try {
        let queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const offset = req.body.offset;
        const limit = req.body.limit;

        if(offset != undefined && limit != undefined && limit != 0) {
            const balances = await selectPaginated(offset, limit, queryBundles);
            return res.status(200).json({
                status: 'success',
                balances
            });
        }
        return res.status(400).json({
            status: 'falied',
            error: 'Bad query request'
        });
    } catch (error) {
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}

export async function insertNewBalance(balance: BalancePayload): Promise<InsertResult> {
    return insert(balance);
}

export async function getNumOfBalances(req: Request, res: Response) {
    try {
        let queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const numOfBalances = await count(queryBundles);
        return res.status(200).json({
            status: 'success',
            count: numOfBalances
        });
    } catch (error) {
        return res.status(500).json({
            status: 'failed',
            count: 0
        });
    }
}