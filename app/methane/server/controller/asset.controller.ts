import { 
    PostgresDBService,
    QueryBundle 
} from "@blockchain-carbon-accounting/data-postgres";
import type { 
    OilAndGasAssetInterface 
} from "@blockchain-carbon-accounting/oil-and-gas-data-lib";

import { Request, Response } from 'express';

export async function insertNewAsset(asset: OilAndGasAssetInterface): Promise<void> {
    const db = await PostgresDBService.getInstance()
    return db.getOilAndGasAssetRepo().putAsset(asset);
}

export async function getAssets(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const offset = req.body.offset;
        const limit = req.body.limit;

        if(offset != undefined && limit != undefined && limit != 0) {
            const assets = await db.getOilAndGasAssetRepo().selectPaginated(offset, limit, queryBundles);
            const totalCount = await db.getOilAndGasAssetRepo().countAssets(queryBundles);
            return res.status(200).json({
                status: 'success',
                assets,
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

export async function getNumOfAssets(req: Request, res: Response) {
    try {
        const db = await PostgresDBService.getInstance()
        const queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const numOfAssets = await db.getOilAndGasAssetRepo().countAssets(queryBundles);
        return res.status(200).json({
            status: 'success',
            count: numOfAssets
        });
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            status: 'failed',
            error
        });
    }
}
