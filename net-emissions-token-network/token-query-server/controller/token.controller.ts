import { Response, Request } from 'express';
import { Token } from "../models/token.model";
import { QueryBundle, TokenPayload, } from "../models/commonTypes";
import { countTokens, selectPaginated, insertToken } from "../repositories/token.repo";

export async function getTokens(req: Request, res: Response) {
    try {
        // getting query from req body
        let queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const limit = req.body.limit;
        const offset = req.body.offset;

        if(offset != undefined && limit != undefined && limit != 0) {
            const tokens = await selectPaginated(offset, limit, queryBundles);
            return res.status(200).json({
                status: 'success',
                tokens
            });
        }

        return res.status(400).json({
            status: 'falied',
            error: 'Bad query request'
        });
    } catch (error) {
        return res.status(500).json({
            status: 'failed',
            count: 0,
            error
        });
    }
}

// not used!
export async function insertNewToken(token: TokenPayload): Promise<Token> {
    return insertToken(token);
}

export async function getNumOfTokens (req: Request, res: Response) {
    try {
        let queryBundles: Array<QueryBundle> = req.body.queryBundles;
        const numOfTokens = await countTokens(queryBundles);
        return res.status(200).json({
            status: 'success',
            count: numOfTokens
        });
    } catch (error) {
        return res.status(500).json({
            status: 'failed',
            count: 0
        });
    }
}