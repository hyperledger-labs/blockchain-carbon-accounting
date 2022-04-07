import { Response, Request } from 'express';
import { PostgresDBService } from "blockchain-accounting-data-postgres/src/postgresDbService";
import { QueryBundle } from 'blockchain-accounting-data-postgres/src/repositories/common';

export async function getWallets(req: Request, res: Response) {
    try {
        // getting query from req body
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const limit = req.body.limit;
        const offset = req.body.offset;

        if(offset != undefined && limit != undefined && limit != 0) {
            const wallets = await db.getWalletRepo().selectPaginated(offset, limit, queryBundles);
            const totalCount = await db.getWalletRepo().countWallets(queryBundles);
            return res.status(200).json({
                status: 'success',
                wallets,
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

export async function insertNewWallet(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const wallet = await db.getWalletRepo().insertWallet(req.body);
        return res.status(200).json({
            status: 'success',
            wallet,
        });

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}

export async function getNumOfWallets(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const numOfWallets = await db.getWalletRepo().countWallets(queryBundles);
        return res.status(200).json({
            status: 'success',
            count: numOfWallets
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            count: 0
        });
    }
}

