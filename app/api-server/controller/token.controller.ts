import { 
    PostgresDBService, QueryBundle 
} from '@blockchain-carbon-accounting/data-postgres';
import { Request, Response } from 'express';

export async function getTokens(req: Request, res: Response) {
    try {
        // getting query from req body
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const limit = req.body.limit;
        const offset = req.body.offset;

        if(offset != undefined && limit != undefined && limit != 0) {
            const tokens = await db.getTokenRepo().selectPaginated(offset, limit, queryBundles);
            const totalCount = await db.getTokenRepo().countTokens(queryBundles);
            return res.status(200).json({
                status: 'success',
                tokens,
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

export async function getEmissionsRequestToken(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()

        const token = await db.getTokenRepo().selectTokenByEmissionsRequest(req.params.nodeid, req.params.requestuuid);
        return res.status(200).json({
            status: 'success',
            token,
        });

    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}


export async function getNumOfTokens (req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const numOfTokens = await db.getTokenRepo().countTokens(queryBundles);
        return res.status(200).json({
            status: 'success',
            count: numOfTokens
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            count: 0
        });
    }
}
