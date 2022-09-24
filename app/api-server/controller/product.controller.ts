import { Response, Request } from 'express';
import { 
    PostgresDBService, QueryBundle 
} from '@blockchain-carbon-accounting/data-postgres';

export async function getProductTokens(req: Request, res: Response) {
    try {
        // getting query from req body
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const limit = req.body.limit;
        const offset = req.body.offset;

        if(offset != undefined && limit != undefined && limit != 0) {
            const products = await db.getProductTokenRepo().selectPaginated(offset, limit, queryBundles);
            const totalCount = await db.getProductTokenRepo().countProducts(queryBundles);
            return res.status(200).json({
                status: 'success',
                products,
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

export async function getNumOfTokens (req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const numOfTokens = await db.getProductTokenRepo().countProducts(queryBundles);
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
