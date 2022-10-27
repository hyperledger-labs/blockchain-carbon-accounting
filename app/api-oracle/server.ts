import bodyParser from 'body-parser';
import express from 'express';
//import { ActivityInterface } from "@blockchain-carbon-accounting/data-common"
import { CO2EmissionFactorInterface } from "@blockchain-carbon-accounting/emissions_data_lib"

import type { IGetEmissionsByLookUp } from "@blockchain-carbon-accounting/blockchain-gateway-lib"
// above is used for typechecking of accpeted queryParams 
// passed from a blockchain-gateway to the oracle  

import NodeCache from 'node-cache'
import fetch from 'node-fetch'

import hash from 'object-hash';

import { argv } from 'process';
import superjson from 'superjson';

import * as dotenv from 'dotenv'
dotenv.config({path:'.env'})

const globalAny = global as any; 
globalAny.fetch = fetch; 

import type{ 
  AppRouter
} from '@blockchain-carbon-accounting/api-server';

import { createTRPCClient } from '@trpc/client';
const trpc_url = process.env.API_SERVER_TRPC || "http://localhost:8000/trpc"

const trpcClient = createTRPCClient<AppRouter>({
    url: trpc_url,
    transformer: superjson
});

const cache = new NodeCache();
  
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

app.post('/emissionsRecord', async(req,res) =>{
    try{
        // TO-DO create helper to handle different database endpoints & queries
        const query = req.body.query.toString()
    
        let query_uuid = hash(req.body);
        const key = query_uuid+"_resp";
        const responseInitialized = cache.get(query_uuid);

        let query_response:CO2EmissionFactorInterface|undefined;
        if(responseInitialized){
            query_response = await returnCachedResponse(key);
        }else{
            cache.set(query_uuid, true, 300);
            if(query==='getEmissionsByUtilityLookUpItem'){

                const queryParams:IGetEmissionsByLookUp = 
                    JSON.parse(req.body.queryParams)

                query_response = await trpcClient.query(
                    'emissionsFactors.getEmissionsByUtilityLookUpItem',
                    queryParams
                )
                console.log(query_response)
                cache.set(key, query_response, 300);
            }else{
                throw new Error(`/emissionsRecord: query string '${query}' not recognized`)
            }
        }
        return res.status(200).json(query_response);
    } catch (error) {
        console.log(error)
        return res.status(500).json(`Error calling /emissionsRecord: ${error}`);
    }
});

async function returnCachedResponse(key:string):Promise<CO2EmissionFactorInterface> {
    return new Promise(function (resolve, reject) {
        (function waitForResponse(){
            const cachedResponse: CO2EmissionFactorInterface|undefined 
                = cache.get(key);
            if (cachedResponse){return resolve(cachedResponse)}
            else{ setTimeout(waitForResponse, 30)};
        })();
    });
}


/*app.post('/postgres/Activity', async(req,res)=>{
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
});*/

app.listen(port, async() => {
    console.log('Api is running on port',port);
});
export default app
