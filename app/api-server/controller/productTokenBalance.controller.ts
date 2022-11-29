import { 
    PostgresDBService, ProductTokenBalancePayload, QueryBundle 
} from '@blockchain-carbon-accounting/data-postgres';
import { Request, Response } from 'express';

export async function getBalances(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const offset = req.body.offset;
        const limit = req.body.limit;

        if(offset != undefined && limit != undefined && limit != 0) {
            const balances = await db.getProductTokenBalanceRepo().selectPaginated(offset, limit, queryBundles);
            const totalCount = await db.getProductTokenBalanceRepo().count(queryBundles);
            return res.status(200).json({
                status: 'success',
                balances,
                count: totalCount
            });
        }
        return res.status(400).json({
            status: 'failed',
            error: 'Bad query request'
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}

export async function insertNewProductTokenBalance(balance: ProductTokenBalancePayload): Promise<void> {
    const db = await PostgresDBService.getInstance()
    return db.getProductTokenBalanceRepo().insert(balance);
}

export async function getNumOfBalances(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const numOfBalances = await db.getProductTokenBalanceRepo().count(queryBundles);
        return res.status(200).json({
            status: 'success',
            count: numOfBalances
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}
