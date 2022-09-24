import bodyParser from 'body-parser';
import express from 'express';
import { 
    parseCommonYargsOptions,
    PostgresDBService 
} from "@blockchain-carbon-accounting/data-postgres"
import { argv } from 'process';

import * as dotenv from 'dotenv'
import { MD5 } from 'crypto-js'
import NodeCache from 'node-cache'
import yargs = require('yargs')
import { hideBin } from "yargs/helpers"

dotenv.config({path:'../../../.env'})
const cache = new NodeCache();
interface ActivityInterface {
    scope: string;
    level_1: string;
    level_2: string;
    level_3: string;
    level_4?: string;
    text?: string;
    activity_uom: string;
    activity: number;
    passengers?: number;
    tonnesShipped?: number;
  }
  
const app = express();
const port = 3002;

app.use(bodyParser.json());
app.use(
    bodyParser.urlencoded({
        extended: true,
    }),
);


app.get('/', (request, response) => {
    response.json({ info: 'welcome to Postgres API' });
});

app.post('/postgres/uuid', async(req,res)=>{
    const uuid = req.body.uuid.toString()
    const usage = Number(req.body.usage)
    const usageUOM = req.body.usageUOM.toString()
    const thruDate = req.body.thruDate.toString()

    let query_uuid = MD5(uuid + usage + usageUOM + thruDate).toString();
    const key = query_uuid+"_resp";
    const responseInitialized = cache.get(query_uuid);
    let query_response;
    if(responseInitialized){
        query_response = await returnCachedResponse(key);
    }else{
        cache.set(query_uuid, true, 300);
        const db = await PostgresDBService.getInstance(parseCommonYargsOptions({}))
        const lookup= await db.getUtilityLookupItemRepo().getUtilityLookupItem(uuid)
        if(lookup===null){res.status(500)}
        else{
            query_response = await db.getEmissionsFactorRepo().getCO2EmissionFactorByLookup(lookup,usage,usageUOM,thruDate);
            db.close();
            cache.set(key, query_response, 300);
        }
    }
    
    return res.status(200).json(query_response);
});

async function returnCachedResponse(key:string) {
    return new Promise(function (resolve, reject) {
        (function waitForResponse(){
            let cachedResponse = cache.get(key);
            if (cachedResponse){return resolve(cachedResponse)}
            else{ setTimeout(waitForResponse, 30)};
        })();
    });
}


app.post('/postgres/Activity', async(req,res)=>{
    const db = await PostgresDBService.getInstance(parseCommonYargsOptions(argv))

    const activity: ActivityInterface = {
        scope : req.body.scope.toString(),
        level_1 : req.body.level1.toString(),
        level_2 : req.body.level2.toString(),
        level_3 : req.body.level3.toString(),
        level_4 : req.body.level4.toString(),
        text : req.body.text.toString(),
        activity : Number(req.body.amount),
        activity_uom : req.body.uom.toString(),
    }

    const ans= await db.getEmissionsFactorRepo().getCO2EmissionByActivity(activity);
    db.close();
       res.status(200).json(ans);
});

app.listen(port, async() => {
    console.log('Api is running on port',port);
});
export default app
