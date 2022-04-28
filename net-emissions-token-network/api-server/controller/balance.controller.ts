import { Response, Request } from 'express';
import { BalancePayload, QueryBundle } from 'blockchain-accounting-data-postgres/src/repositories/common'
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";

export async function getBalances(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const offset = req.body.offset;
        const limit = req.body.limit;

        if(offset != undefined && limit != undefined && limit != 0) {
            const balances = await db.getBalanceRepo().selectPaginated(offset, limit, queryBundles);
            const totalCount = await db.getBalanceRepo().count(queryBundles);
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

export async function insertNewBalance(balance: BalancePayload): Promise<void> {
    const db = await PostgresDBService.getInstance()
    return db.getBalanceRepo().insert(balance);
}

export async function getNumOfBalances(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const numOfBalances = await db.getBalanceRepo().count(queryBundles);
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
