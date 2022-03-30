// Process query bundles for GET request
import {Request, Response, NextFunction } from 'express';
import { QueryBundle } from "../models/commonTypes";
import { queryProcessor } from './base.middle';

export const queryProcessing = async (req: Request, res: Response, next: NextFunction) => {
    // default offset value is zero(0)!
    const offset = parseInt(req.query.offset as string || '0');
    const limit = parseInt(req.query.limit as string || '25');
   
    // pass bundle to repository
    const bundles: Array<string> = req.query.bundles as Array<string>;
    let queryBundles: Array<QueryBundle> = [];
    if(bundles != undefined)
         queryBundles = queryProcessor(bundles);
    req.body.queryBundles = queryBundles;
    req.body.offset = offset;
    req.body.limit = limit;
    next();
}