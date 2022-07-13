import bodyParser from 'body-parser';
import express from 'express';
import { ActivityInterface } from "@blockchain-carbon-accounting/data-common/utils"
import {EmissionsFactorRepo} from './../repositories/emissionsFactor.repo'
import { DataSource } from 'typeorm';
import { EmissionsFactor } from "./../models/emissionsFactor"
import * as dotenv from 'dotenv'
dotenv.config({path:'../../../.env'})

const AppDataSource = new DataSource({
    type: "postgres",
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    entities: [EmissionsFactor],
});

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

app.post('/postgres', async(req,res)=>{
    //check if can connect to database
    await AppDataSource.initialize()
  .then(async () => {
    console.log("Connection initialized with database...");
  })
  .catch((error) => console.log(error));

  
     const database =  new EmissionsFactorRepo(AppDataSource);

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

    const ans=await database.getCO2EmissionByActivity(activity);
       res.json(ans);
});

app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});