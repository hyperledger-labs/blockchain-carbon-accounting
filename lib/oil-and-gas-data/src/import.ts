import { 
  OilAndGasAssetInterface, 
  OIL_AND_GAS_ASSET_CLASS_IDENTIFIER 
} from "./oilAndGasAsset"

import { 
  ProductInterface, 
  PRODUCT_CLASS_IDENTIFIER 
} from "./product";

import { 
  OperatorInterface, 
  OPERATOR_CLASS_IDENTIFIER 
} from "./operator";

import {
  matchAsset
} from "./matchAssets"
import {
  CATF_COMPANY_NAME_SEARCH
}from "./nameMapping"
import { 
  ASSET_OPERATOR_CLASS_IDENTIFIER,
  AssetOperatorInterface
} from "./assetOperator";

import { 
  parseWorksheet,
  ParseWorksheetOpts,
  getStateNameMapping, 
  LoadInfo,
} from "@blockchain-carbon-accounting/data-common";

import { 
  Operator, 
  PostgresDBService, 
  Wallet,
  OilAndGasAsset 
} from '@blockchain-carbon-accounting/data-postgres';

import { SingleBar } from "cli-progress";
import { v4 as uuidv4 } from 'uuid';
import { chain } from 'stream-chain';
import { parser } from 'stream-json';
import { streamArray } from 'stream-json/streamers/StreamArray';
import { pick } from'stream-json/filters/Pick';
//import { batch } from'stream-json/utils/Batch';
import fs from 'fs';

const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const importOilAndGasAssets = async (opts: ParseWorksheetOpts, 
  progressBar: SingleBar, db: PostgresDBService) => {

  if (opts.format === "US_asset_data") {
    const loader = new LoadInfo(opts.file, opts.sheet, progressBar, 1506238);
      
    const repo = db.getOilAndGasAssetRepo()
    const pipeline = chain([
      fs.createReadStream('./'+opts.file),
      parser(),
      pick({filter: "features"}),
      streamArray(),
      //batch({batchSize: 5000}),
      async (data)  => {
        //loader  
        // import data for each valid stream, eg:
        //for (const row of data) {
          const prop = data.value.properties
          //if (!prop) { loader.incIgnored('Undefined row'); continue; }
          //if (!prop["Data Year"]) { loader.incIgnored('Missing "Data Year"'); continue; }
          //if (prop["Data Year"] == "YEAR") { loader.incIgnored('Header row'); continue; }
          opts.verbose && console.log("-- Prepare to insert from ", prop);
          const details = JSON.stringify({
            "product": prop["PRODTYPE"],
            "field": prop["FILED"],
            "depth": prop["TOTDEPTH"] !== '-999' ? prop["TOTDEPTH"] : null,
          });
          const d: OilAndGasAssetInterface = {
            uuid: uuidv4(),
            class: OIL_AND_GAS_ASSET_CLASS_IDENTIFIER,
            type: prop["TYPE"],
            country: prop["COUNTRY"],
            //location: {type: "Point", "coordinates": [0,0]},
            latitude: prop["LATITUDE"],
            longitude: prop["LONGITUDE"],
            name: prop["NAME"],//prop["NAME"] !== "NOT AVAILABLE" ? prop["NAME"] : null,
            operator: prop["OPERATOR"],
            division_type: "State",
            division_name: prop["STATE"],
            sub_division_type: "County",
            sub_division_name: prop["COUNTY"],
            status: prop["STATUS"],
            api: prop["API"],
            description: prop["NAICS_DESC"],
            source: prop["SOURCE"],
            source_date: new Date(prop["SOURCEDATE"]),
            validation_method: prop["VAL_METHOD"],
            validation_date: new Date(prop["VAL_DATE"]),
            metadata: details
          };
          await repo.putAsset(d);
          loader.incLoaded();
        //}
        return;   
      }
    ]);
    const counter = 0;
    //pipeline.on('data', (data:any) => console.log(data));
    pipeline.on('data', (counter) => {
      ++counter
    });
    pipeline.on('end', async () => {
      loader.done();
      console.log(`Loaded ${counter} entries to oil_and_gas_asset table.`);
      const count = await db.getOilAndGasAssetRepo().countAssets([])
      console.log(`=== Done, we now have ${count} OilAndGasAssets in the DB`)
      await db.close()
    })
  }
}

export const importProductData = async (opts: ParseWorksheetOpts, 
  progressBar: SingleBar, db: PostgresDBService) => {

  if (opts.format === "VIIRS") {
    //if(opts.year === undefined){return Error('no year provided')}
    const data = parseWorksheet(opts);
    const loader = new LoadInfo(opts.file, opts.sheet, progressBar, data.length);
    for (const row of data) {
      if (!row) { loader.incIgnored('Undefined row'); continue; }
      const amount = row["BCM "+opts.year] || row["BCM_"+opts.year];
      if (!amount) { loader.incIgnored('Undefined amount'); continue; }
      //if (row["Data Year"] == "YEAR") { loader.incIgnored('Header row'); continue; }
      opts.verbose && console.log("-- Prepare to insert from ", row);
      // get annual generation and emissions
      const country = row["Country"]?.toString();
      const catalog_id = row["Catalog ID"] || row["Catalog id"];
      const db_id = row["id #"] || row["ID "+opts.year];
      const det_freq = row["Detection frequency "+opts.year] || row["Detection freq."];
      const avg_temp = row["Avg. temp., K"]?.toString() || row["Avg. temp"]?.toString();
      const clear_obs = row["Clear Obs."] || row["Clear obs. "] || row["Clear obs "+opts.year];
      const details = JSON.stringify({
        "catalogId": catalog_id,
        "dbId": db_id,
        "detectionFreq": det_freq?.toString(),
        "avgTempK": avg_temp?.toString(),
        "ellipticity": row["Ellipticity"]?.toString(),
        "sector": row["Type"].toString(),
        "clearObs": clear_obs?.toString()
      });

      // generate a unique for the row
      const d: ProductInterface = {
        uuid: uuidv4(),
        class: PRODUCT_CLASS_IDENTIFIER,
        type: "Flaring",
        name: "methane",
        amount: Number(amount),
        unit: "bcm",
        year: opts.year,
        country: country,
        latitude: row["Latitude"],
        longitude: row["Longitude"],
        metadata: details,
        description: "VIIRS satellite flaring data",
        source: opts.source || opts.file
      };
      const asset = await matchAsset(
        row["Latitude"],
        row["Longitude"],
        country
      ); 
      if(asset){ d['assets']=[asset] }
      try{
        await db.getProductRepo().putProduct(d);
      }catch(error){
        opts.verbose && console.warn(error)
      }
      loader.incLoaded();
    }
    loader.done();
    return;
  }else if(opts.format === "EIA"){
    opts.cellDates = true;
    //if(opts.year === undefined){return Error('no year provided')}
    const data = parseWorksheet(opts);
    const loader = new LoadInfo(opts.file, opts.sheet, progressBar, data.length);
    for (const row of data) {
      if (!row) { loader.incIgnored('Undefined row'); continue; }

      //if (row["Data Year"] == "YEAR") { loader.incIgnored('Header row'); continue; }
      opts.verbose && console.log("-- Prepare to insert from ", row);

      // generate a unique for the row
      let amountHeader:string;

      if(opts.name === "Crude Oil"){
        amountHeader = ["U.S.",opts.type,"of",opts.name,"("+opts.unit+")"].join(" ")
      }else{
        amountHeader = ["U.S.",opts.name,opts.type,"("+opts.unit+")"].join(" ")
      }
      if (!opts.name) { loader.incIgnored('Undefined name'); continue; }
      if (!opts.type) { loader.incIgnored('Undefined type'); continue; }
      if (!opts.unit) { loader.incIgnored('Undefined unit'); continue; }

      const d: ProductInterface = {
        uuid: uuidv4(),
        class: PRODUCT_CLASS_IDENTIFIER,
        type: opts.type,
        name: opts.name,
        unit: opts.unit,
        amount: Number(row[amountHeader]),
        year: row["Date"].getFullYear().toString(),
        month: months[row["Date"].getMonth()],
        from_date: row["Date"],
        country: "USA",
        description: "EIA oil & gas data",
        source: opts.source || opts.file
      };
      let states:string[]=[];
      if(opts.sheet === "Data 1"){
        if (!row[amountHeader]) { loader.incIgnored('Undefined amount'); } 
        else{
          try{
            await db.getProductRepo().putProduct(d);
          }catch(error){
            opts.verbose && console.warn(error)
          } 
        }
        states = ["Alaska","Arkansas","California","Colorado","Federal Offshore--Gulf of Mexico","Kansas","Louisiana","Montana","New Mexico","North Dakota","Ohio","Oklahoma","Pennsylvania","Texas","Utah","West Virginia","Wyoming"]
      }else if(opts.sheet === "Data 2"){
        states = ["Other States","Alabama","Arizona","Florida","Idaho","Illinois","Indiana","Kentucky","Maryland","Michigan","Mississippi","Missouri","Nebraska","Nevada","New York","Oregon","South Dakota","Tennessee","Virginia"]
      }
      d["division_type"] = "state";
      for (const state of states){
        d["uuid"] = uuidv4();
        amountHeader = [state,opts.name,opts.type,"("+opts.unit+")"].join(" ");
        if (!row[amountHeader]) { loader.incIgnored('Undefined amount'); continue; }
        d["division_name"] = state;
        d["amount"] = Number(row[amountHeader]);
        try{
          await db.getProductRepo().putProduct(d);
        }catch(error){
          opts.verbose && console.warn(error)
        } 
      }
      loader.incLoaded();
    }
    loader.done();
    return;
  }else if(opts.format === "FlareMonitor"){
    //if(opts.year === undefined){return Error('no year provided')}
    if (opts.file.includes("flaring_monitor_detailed_observations")){
      opts.cellDates = true}
    else{ opts.raw=true}
    const data = parseWorksheet(opts);
    let loaderInit=true;
    let loaderLength=data.length;
    
    const cols:string[] = [
      "jan_2019", "feb_2019", "mar_2019", "apr_2019", "may_2019", "jun_2019", "jul_2019", "aug_2019", "sep_2019", "oct_2019", "nov_2019", "dec_2019",
      "jan_2020", "feb_2020", "mar_2020", "apr_2020", "may_2020", "jun_2020", "jul_2020", "aug_2020", "sep_2020", "oct_2020", "nov_2020", "dec_2020",
      "jan_2021", "feb_2021", "mar_2021", "apr_2021", "may_2021"]; 
    let loader = new LoadInfo(opts.file, opts.sheet, progressBar, loaderLength);
    for (const row of data) {
      if(loaderInit && row["product_type"]){
        loaderLength*=cols.length;
        loader = new LoadInfo(opts.file, opts.sheet, progressBar, loaderLength);
        loaderInit = false;
      }

      if (!row) { loader.incIgnored('Undefined row'); continue; }
      
      opts.verbose && console.log("-- Prepare to insert from ", row);

      const d: ProductInterface = {
        uuid: uuidv4(),
        class: PRODUCT_CLASS_IDENTIFIER,
        source: opts.source || opts.file,
        description: "Flare Monitor oil & gas data",
        type: '',
        name: '',
        unit: '',
        amount: 0
      };
      if (row["estimated_flare_volume_mcf"]) {     
        d["type"]='Flaring';
        d["name"]='Methane';  
        d['unit']='MCF';
        d["amount"]=Number(row["estimated_flare_volume_mcf"]); 
        d["year"]=row["month"].getFullYear().toString();
        d["month"]=months[row["month"].getMonth()];
        d["from_date"]=row["month"];
        d["country"]="USA";
        d["division_type"]="State";
        d["division_name"]=getStateNameMapping(row["state"]);
        d["longitude"]=row["longitude"];
        d["latitude"]=row["latitude"];
        const asset = await matchAsset(
          row["latitude"],
          row["longitude"],
          'United States'
        ); 
        if(asset){d['assets'] = [asset]}
        // check for operate assigned to identified asset
        let operators = asset?.asset_operators?.map(ao =>(ao.operator));
        if(operators?.length==0){
          // check for  operators already stored in DB
          operators = await getOpertors(opts, db, row['company_name']);
        }
        if(operators! && operators[0]){d['operator']=operators[0]}
        if(operators! && operators.length>0 && asset){
          const ao: AssetOperatorInterface = {
            uuid: uuidv4(),
            class: ASSET_OPERATOR_CLASS_IDENTIFIER,
            assetUuid: asset.uuid,
            asset,
            operatorUuid: operators[0].uuid,
            operator: operators[0],
            from_date: new Date(),//new Date(row["month"]),
            share: 1
          }
          try{
            await db.getAssetOperatorRepo().putAssetOperator(ao);
          }catch(error){
            opts.verbose && console.warn(error)
          }
        }
        d["metadata"]=JSON.stringify({
          type: row["type"],
          sum_rh: row["sum_rh"],
          radius: row["radius"],
          company: row["company_name"],
          cid: row["cid"],
          wells: row["wells"],
          equivalent_co2_released_metric_tons: row["equivalent_co2_released_metric_tons"]
        })
        try{
          await db.getProductRepo().putProduct(d); 
        }catch(error){
          opts.verbose && console.warn(error)
        }
        loader.incLoaded();
      }else if(row["product_type"]){
        const operators = await getOpertors(opts, db, row["company_name"]);
        if(operators! && operators[0]){d["operator"]=operators[0];}
        if (row["basin"]){
          d["division_type"]="basin";
          d["division_name"]=row["basin"];
          d["sub_division_type"]="subbasin";
          d["sub_division_name"]=row["play_subbasin"];
        }else if (row["state"]){
          d["division_type"]="State";
          d["division_name"]=getStateNameMapping(row["state"]);
          d["metadata"]=JSON.stringify({
            company_name: row["company_name"],
            ticker: row["ticker"]
          });
        }else{loader.incIgnored('No col identifier'); continue}
        d["type"]=row["product_type"];
        d["name"]=row["product_type"];
        d["unit"]=row["product_units"];
        for(const col of cols){
          if (!row[col]) {loader.incIgnored('Undefined col amount'); continue } 
          d["amount"]=Number(row[col]);
          d["year"] = col.substr(col.length - 4);
          d["month"] = col.slice(0,3);
          try{
            await db.getProductRepo().putProduct(d);
          }catch(error){
            opts.verbose && console.warn(error)
          } 
          d["uuid"] = uuidv4();
          loader.incLoaded();
        } 
      }else{
        loader.incIgnored('No row identifier'); continue
      }
    }
    loader.done();
    return;
  }else if(opts.format === "Benchmark"){

    const data = parseWorksheet(opts);
    
    const cols:string[] = ["Gas (MBOE)",  "Oil (MBOE)", 
      "CO2", "CH4", "N2O", "GHG", 
      "NGSI Methane Intensity",  "GHG Emissions Intensity", 
      "Process & Equipment Vented", "Process & Equipment Flared",  
      "Fugitive",  "Other Combustion",  "Associated Gas Vented/Flared"]; 
    const skip_rows = 0*3240/cols.length;
    const loader = new LoadInfo(opts.file, opts.sheet, progressBar, (data.length-skip_rows)*cols.length);
    for (const row of data.slice(skip_rows)) {
      if (!row) { loader.incIgnored('Undefined row'); continue; }

      //create operator
      let operator = await db.getOperatorRepo().findByName(row["Company"]);
      
      if(!operator){
        operator = await createOperator(opts,db,row["Company"]);
      }
      if(operator!){
        const names = CATF_COMPANY_NAME_SEARCH[row["Company"]];
        const queries=[];
        if(names){
          for(const name of names){
            queries.push({
              field: 'operator',
              fieldType: 'string',
              value: name,
              op: 'like'              
            })
            queries.push({
              field: 'name',
              fieldType: 'string',
              value: name,
              op: 'like'              
            })
          }
        }else if (row["Company"].length>0){
          queries.push({
            field: 'operator',
            fieldType: 'string',
            value: row["Company"],
            op: 'like'              
          }) 
          queries.push({
            field: 'name',
            fieldType: 'string',
            value: row["Company"],
            op: 'like'              
          })         
        } 
        const assets:OilAndGasAsset[] = 
          await db.getOilAndGasAssetRepo().select(queries);
        if(assets.length==0){
          console.log('No assets found for company : ', row["Company"])
        } 
        for (const asset of assets) {
          const ao: AssetOperatorInterface = {
            uuid: uuidv4(),
            class: ASSET_OPERATOR_CLASS_IDENTIFIER,
            asset,
            assetUuid: asset.uuid,
            operatorUuid: operator.uuid,
            operator,
            from_date: new Date(),
            share: 1
          }
          try{
            await db.getAssetOperatorRepo().putAssetOperator(ao);
          }catch(error){
            opts.verbose && console.warn(error)
          }
        }
      }

      opts.verbose && console.log("-- Prepare to insert from ", row);
      const d: ProductInterface = {
        uuid: uuidv4(),
        class: PRODUCT_CLASS_IDENTIFIER,
        source: opts.source || opts.file,
        description: "CATF U.S. O&G Benchmarking",
        type: '',
        name: '',
        unit: '',
        amount: 0,
        year: row["Data Year"],
        division_type: "Company",
        division_name: row["Company"],
        country: "USA",
      };
      if(operator){d['operator']=operator}
      if(row["Basin"]){
        d["sub_division_type"]="basin";
        d["sub_division_name"]=row["Basin"];
      }
      for (const col of cols){
        
        d["amount"] = Number(row[col]);
        if (!row[col]) { loader.incIgnored('Undefined col'); continue; }
        switch(col) {
          case "CO2": case "CH4": case "N2O": case "GHG" :
            d["type"] = "Emissions";
            d["unit"] = "MT";
            d["name"] = col;
            d["metadata"] = JSON.stringify({
              "GWP": "IPCC AR6 100-year"
            });
            break;
          case "Gas (MBOE)": case "Oil (MBOE)":
            d["type"] = "Production";
            d["unit"] = "MBOE";
            d["name"] = col.slice(0,3);
            break;
          case "NGSI Methane Intensity":
            d["type"] = "Performance metric";
            d["name"] = col;
            d["unit"] = "%";
            break;
          case "GHG Emissions Intensity":
            d["type"] = "Performance metric";
            d["unit"] = "ton CO2e/BOE";
            d["name"] = col;
            break;
          case "Process & Equipment Vented": case "Process & Equipment Flared": case "Fugitive": case "Other Combustion": case "Associated Gas Vented/Flared":
            d["type"] = "Emissions";
            d["unit"] = "MT CO2e";
            d["name"] = col;
            d["metadata"] = JSON.stringify({
              "GWP": "IPCC AR6 100-year"
            });
            break;
          default:
        }
        try{
          await db.getProductRepo().putProduct(d); 
        }catch(error){
          opts.verbose && console.warn(error)
        } 
        d["uuid"] = uuidv4();
        d["metadata"] = undefined;
        loader.incLoaded();
      }
    }
    loader.done();
    return;
  }
}

const getOpertors = async(
  opts: ParseWorksheetOpts,
  db: PostgresDBService, 
  name: string
) :Promise<Operator[] | undefined> => {
  let operators;
  if(name){
    operators = await db.getOperatorRepo().selectPaginated(
      0,0,[{
        field: 'name',
        fieldType: 'string',
        value: name.split(" ")[0],
        op: 'like'}]
    );
    if(operators?.length==0){
      // create a new operator
      const operator = await createOperator(opts,db,name);
      if(operator){operators.push(operator)}
    }

    if(operators?.length>0){
      return operators
    }else{return undefined}

  }else{
    return undefined
  }
}

const createOperator = async(
  opts: ParseWorksheetOpts,
  db: PostgresDBService,
  name: string
):Promise<Operator | null> => {
  const o: OperatorInterface = {
    uuid: uuidv4(),
    class: OPERATOR_CLASS_IDENTIFIER,
    name: name,
    wallet: await setWallet(db),
    //asset_count: 0,
  }; 
  try{
    await db.getOperatorRepo().putOperator(o);
  }catch(error){
    opts.verbose && console.warn(error)
  } 
  const operator = await db.getOperatorRepo().findByName(name);
  return operator
}

const setWallet = async(db: PostgresDBService):Promise<Wallet> => {
  let wallet = await db.getWalletRepo().findWalletByAddress(
      "0xf3AF07FdA6F11b55e60AB3574B3947e54DebADf7");
    
  if(!wallet){
    wallet = await db.getWalletRepo().insertWallet({
      name: 'Operator Repository',
      email: "bertrand@tworavens.consulting",
      address: '0xf3AF07FdA6F11b55e60AB3574B3947e54DebADf7',
      organization: 'Two Ravens Energy & Climate Consulting Ltd.'
    })
  }
  return wallet;
}