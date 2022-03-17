import { Response, Request } from 'express';
import { Token } from "../models/token.model";
import { FIELD, IFIELDS, FIELDS, QueryBundle, TokenPayload } from "../models/commonTypes";
import { selectAll, insert, count, selectPaginated } from "../repositories/token.repo";

function validateQuery(bundle: QueryBundle) : boolean {

    // field name checking
    const validator: FIELD = FIELDS[bundle.field as keyof IFIELDS];
    if(validator == null) return false;
    
    // type checking
    if(validator.fieldType != bundle.fieldType) return false;
    
    // op checking
    if(!validator.op.includes(bundle.op)) return false;

    // last 
    if(bundle.nextOp != '' && bundle.nextOp != undefined) {
        if(!validator.nextOp?.includes(bundle.nextOp)) return false;
    } else {
        // default next operation
        bundle.nextOp = 'and';
    }
    
    return true;
}

function queryProcessor(bundles: Array<string>) : Array<QueryBundle> {
    const queryBundles: Array<QueryBundle> = [];
    if(typeof bundles == "string") {
        const elems: string[] = (bundles as string).split(',');
        const queryBundle: QueryBundle = {
            field: elems[0],
            fieldType: elems[1],
            value: elems[2],
            op: elems[3],
            nextOp: elems[4]
        }
        if(validateQuery(queryBundle)) queryBundles.push(queryBundle);
    }
    else if(bundles.length != 0) {
        bundles.forEach((bundle: string) => {
            const elems: string[] = bundle.split(',');
            const queryBundle: QueryBundle = {
                field: elems[0],
                fieldType: elems[1],
                value: elems[2],
                op: elems[3],
                nextOp: elems[4]
            }
            if(validateQuery(queryBundle)) queryBundles.push(queryBundle);
        });
    }
    return queryBundles;
}

export async function getTokens(req: Request, res: Response) {
    try {
        // default offset value is zero(0)!
        const offset = parseInt(req.query.offset as string || '0');
        const limit = parseInt(req.query.limit as string || '25');
       
        // pass bundle to repository
        const bundles: Array<string> = req.query.bundles as Array<string>;
        const queryBundles: Array<QueryBundle> = queryProcessor(bundles);
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
    return insert(token);
}

export async function getNumOfTokens (req: Request, res: Response) {
    try {
        const numOfTokens = await count();
        console.log('======== get count =============', numOfTokens);
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