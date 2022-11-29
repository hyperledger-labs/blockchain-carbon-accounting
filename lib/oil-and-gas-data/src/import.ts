import { 
  OilAndGasAssetInterface, 
  OIL_AND_GAS_ASSET_CLASS_IDENTIFIER 
} from "./oilAndGasAsset"

import { 
  ProductInterface, 
  ProductType,
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
  AssetOperatorDbInterface,
  OilAndGasAssetDbInterface,
  OperatorDbInterface,
  ProductDbInterface,
} from "@blockchain-carbon-accounting/data-common";

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
  progressBar: SingleBar, db: OilAndGasAssetDbInterface) => {

  if (opts.format === "US_asset_data") {
    const loader = new LoadInfo(opts.file, opts.sheet, progressBar, 1506238);
      
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
          await db.putAsset(d);
          loader.incLoaded();
        //} 
      }
    ]);
    return {pipeline,loader};
  }
}

export const importProductData = async (opts: ParseWorksheetOpts, 
  progressBar: SingleBar, 
  db: ProductDbInterface, 
  dbOperator: OperatorDbInterface,
  dbAsset: OilAndGasAssetDbInterface,
  dbAssetOperator: AssetOperatorDbInterface,
  walletAddress: string) => {

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
        type: "emissions" as ProductType,
        name: "methane flaring",
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
      d['from_date'] = setFromDate(opts,loader,d);
      d['thru_date'] = setThruDate(opts,loader,d);
      const asset = await matchAsset(
        dbAsset,
        row["Latitude"],
        row["Longitude"],
        country
      ); 
      if(asset){ d['assets']=[asset] }
      try{
        await db.putProduct(d);
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
    let states:string[]=[];
    if(opts.sheet === "Data 1"){
      states = ["Alaska","Arkansas","California","Colorado","Federal Offshore--Gulf of Mexico","Kansas","Louisiana","Montana","New Mexico","North Dakota","Ohio","Oklahoma","Pennsylvania","Texas","Utah","West Virginia","Wyoming"]
    }else if(opts.sheet === "Data 2"){
      states = ["Other States","Alabama","Arizona","Florida","Idaho","Illinois","Indiana","Kentucky","Maryland","Michigan","Mississippi","Missouri","Nebraska","Nevada","New York","Oregon","South Dakota","Tennessee","Virginia"]
    }
    const loader = new LoadInfo(opts.file, opts.sheet, progressBar, data.length*states.length);
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
      if (!opts.unit) { loader.incIgnored('Undefined unit'); continue; }
      let type;
      switch(opts.type) {
        case 'Field Production': case 'Marketed Production': case 'Production': case 'Gross Withdrawals': 
          type = 'production' as ProductType;
          break
        case 'Vented and Flared':
          type = 'emissions' as ProductType;
          break
        case 'Repressuring':
          type = 'storage' as ProductType;
          break
        default: 
      }
      if (!type) { loader.incIgnored('Undefined type'); continue; }

      const d: ProductInterface = {
        uuid: uuidv4(),
        class: PRODUCT_CLASS_IDENTIFIER,
        type: type,
        name: [opts.name,opts.type].join(' '),
        unit: opts.unit,
        amount: Number(row[amountHeader]),
        year: row["Date"].getFullYear().toString(),
        month: months[row["Date"].getMonth()],
        country: "USA",
        description: "EIA oil & gas data",
        source: opts.source || opts.file
      };
      d['from_date'] = setFromDate(opts,loader,d);
      d['thru_date'] = setThruDate(opts,loader,d);
      
      if(opts.sheet === "Data 1"){
        if (!row[amountHeader]) { loader.incIgnored('Undefined amount'); } 
        else{
          try{
            await db.putProduct(d);
          }catch(error){
            opts.verbose && console.warn(error)
          } 
        }
      }
      d["division_type"] = "state";
      for (const state of states){
        d["uuid"] = uuidv4();
        amountHeader = [state,opts.name,opts.type,"("+opts.unit+")"].join(" ");
        if (!row[amountHeader]) { loader.incIgnored('Undefined amount'); continue; }
        d["division_name"] = state;
        d["amount"] = Number(row[amountHeader]);
        try{
          await db.putProduct(d);
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
        type: 'emissions' as ProductType,
        name: '',
        unit: '',
        amount: 0
      };
      if (row["estimated_flare_volume_mcf"]) {     
        d["name"]='Methane Flaring';  
        d['unit']='tons CO2e';
        d["amount"]=Number(row["equivalent_co2_released_metric_tons"]); 
        d["year"]=row["month"].getFullYear().toString();
        d["month"]=months[row["month"].getMonth()];
        d["country"]="USA";
        d["division_type"]="State";
        d["division_name"]=getStateNameMapping(row["state"]);
        d["longitude"]=row["longitude"];
        d["latitude"]=row["latitude"];
        d['from_date'] = setFromDate(opts,loader,d);
        d['thru_date'] = setThruDate(opts,loader,d);
        const asset = await matchAsset(
          dbAsset,
          row["latitude"],
          row["longitude"],
          'United States'
        ); 
        if(asset){d['assets'] = [asset]}
        // check for operate assigned to identified asset
        let operator: null | OperatorInterface=null;
        const operatorMapping = asset?.assetOperators?.map(ao =>(ao.operator))[0];
        if(operatorMapping){operator=operatorMapping}

        if(!operator){
          // check for  operators already stored in DB
          operator = await getOpertor(opts, dbOperator, row['company_name'],walletAddress);
        }
        
        // D'ont associate the asset level (lat/long) product data direclty to the pperator!
        //if(operator){d['operator']=operator}

        if(operator && asset){
          const ao: AssetOperatorInterface = {
            uuid: uuidv4(),
            class: ASSET_OPERATOR_CLASS_IDENTIFIER,
            assetUuid: asset.uuid,
            operatorUuid: operator.uuid,
            operator,
            // eslint-disable-next-line
            from_date: d['from_date']!,//new Date(row["month"]),
            share: 1
          }
          try{
            await dbAssetOperator.putAssetOperator(ao);
          }catch(error){
            opts.verbose && console.warn(error)
          }
        }
        const metadata = {
          type: row["type"],
          sum_rh: row["sum_rh"],
          radius: row["radius"],
          company: row["company_name"],
          cid: row["cid"],
          wells: row["wells"],
          estimated_flare_volume_mcf: row["estimated_flare_volume_mcf"],
          flare_week: null
        }
        if(row['flare_week']){
          metadata.flare_week = row['flare_week'];
        }
        d["metadata"]=JSON.stringify(metadata);
        
        try{
          await db.putProduct(d); 
        }catch(error){
          opts.verbose && console.warn(error)
        }
        loader.incLoaded();
      }else if(row["product_type"]){
        let type;
        switch(row['product_type']) {
          case 'produced gas': case 'produced oil': 
            type = 'production' as ProductType;
            break
          case 'flared gas': case 'reported equivalent co2 released': case 'equivalent co2 released monthly': case 'equivalent co2 released daily': case 'sat estimated volume': case 'reported volume': case 'sat estimate lower': case 'sat estimate upper': case 'blended estimate': case 'blended estimate equivalent co2 released':
            type = 'emissions' as ProductType;
            break
          default: 
        }
        if (!type) { loader.incIgnored('Undefined type'); continue; }
        d['type']=type
        const operator = await getOpertor(opts, dbOperator, row["company_name"],walletAddress);
        if(operator){d["operator"]=operator;}
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
        d["name"]=row["product_type"];
        d["unit"]=row["product_units"];
        for(const col of cols){
          if (!row[col]) {loader.incIgnored('Undefined col amount'); continue } 
          d["amount"]=Number(row[col]);
          d["year"] = col.substr(col.length - 4);
          d["month"] = col.slice(0,3);
          d['from_date'] = setFromDate(opts,loader,d);
          d['thru_date'] = setThruDate(opts,loader,d);
          try{
            await db.putProduct(d);
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
      opts.verbose && console.log("-- Prepare to insert from ", row);
      const d: ProductInterface = {
        uuid: uuidv4(),
        class: PRODUCT_CLASS_IDENTIFIER,
        source: opts.source || opts.file,
        description: "CATF U.S. O&G Benchmarking",
        type: 'emissions' as ProductType,
        name: '',
        unit: '',
        amount: 0,
        year: row["Data Year"],
        country: "USA",
      };
      d['from_date'] = setFromDate(opts,loader,d);
      d['thru_date'] = setThruDate(opts,loader,d);

      const metadata:Record<string, unknown>={
        company_name: row["Company"]
      };
      //create operator
      const operator = await createOperator(opts, dbOperator, row["Company"],walletAddress);
      if(operator){d['operator']=operator}
      if(row["Basin"]){
        d["division_type"]="basin";
        d["division_name"]=row["Basin"];
      }
      for (const col of cols){
        d["amount"] = Number(row[col]);
        if (!row[col]) { loader.incIgnored('Undefined col'); continue; }
        switch(col) {
          case "CO2": case "CH4": case "N2O": case "GHG" :
            d["type"] = 'emissions' as ProductType;
            d["unit"] = "MT";
            d["name"] = col;
            metadata["GWP"] = "IPCC AR6 100-year"
            break;
          case "Process & Equipment Vented": case "Process & Equipment Flared": case "Fugitive": case "Other Combustion": case "Associated Gas Vented/Flared":
            d["type"] = 'emissions' as ProductType;
            d["unit"] = "MT CO2e";
            d["name"] = col;
            metadata["GWP"]= "IPCC AR6 100-year";
            break;
          case "Gas (MBOE)": case "Oil (MBOE)":
            d["type"] = "production" as ProductType;
            d["unit"] = "MBOE";
            d["name"] = col.slice(0,3);
            break;
          case "NGSI Methane Intensity":
            d["type"] = "credential" as ProductType;
            d["name"] = col;
            d["unit"] = "%";
            break;
          case "GHG Emissions Intensity":
            d["type"] = "credential" as ProductType;
            d["unit"] = "ton CO2e/BOE";
            d["name"] = col;
            break;
          default:
        }
        d["metadata"] = JSON.stringify(metadata);
        try{
          await db.putProduct(d); 
        }catch(error){
          opts.verbose && console.warn(error)
        } 
        d["uuid"] = uuidv4();
        d["metadata"] = undefined;
        loader.incLoaded();
      }
      // Match operator to asset 
      if(operator){
        // find oil and gas assets that match operator name 
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
        const assets:OilAndGasAssetInterface[] = 
          await dbAsset.select(queries);
        if(assets.length==0){
          opts.verbose && console.log('No assets found for company : ', row["Company"])
        } 
        for (const asset of assets) {
          const ao: AssetOperatorInterface = {
            uuid: uuidv4(),
            class: ASSET_OPERATOR_CLASS_IDENTIFIER,
            assetUuid: asset.uuid,
            operatorUuid: operator.uuid,
            operator,
            // eslint-disable-next-line
            from_date: d['from_date']!,
            share: 1
          }
          try{
            await dbAssetOperator.putAssetOperator(ao);
          }catch(error){
            opts.verbose && console.warn(error)
          }
        }
      }
    }
    loader.done();
    return;
  }
}

const getOpertor = async(
  opts: ParseWorksheetOpts,
  db: OperatorDbInterface, 
  name: string,
  walletAddress: string,
) :Promise<OperatorInterface | null> => {
  let operator = await db.selectOne(
    [{
      field: 'name',
      fieldType: 'string',
      value: name?.split(" ")[0],
      op: 'like'}]
  );
  if(!operator){
    // create a new operator
    operator = await createOperator(opts,db,name,walletAddress);
  }
  return operator
}

const createOperator = async(
  opts: ParseWorksheetOpts,
  db: OperatorDbInterface,
  name: string,
  walletAddress: string 
):Promise<OperatorInterface> => {
  let operator = await db.findByName(name);
  if(!operator){
    operator = {
      uuid: uuidv4(),
      class: OPERATOR_CLASS_IDENTIFIER,
      name: name,
      wallet_address: walletAddress,
    }; 
    try{
      await db.putOperator(operator);
    }catch(error){
      opts.verbose && console.warn(error)
    } 
  }
  return operator
}


export const updateProductDates = async (
  opts: ParseWorksheetOpts,
  progressBar: SingleBar,
  dbProduct: ProductDbInterface
) => {
  const products = await dbProduct.getAllProducts();
  const count = await dbProduct.count([]);
  const loader = new LoadInfo('', '', progressBar, count);
  for (const product of products) {
    product['from_date'] = setFromDate(opts,loader,product)
    product['thru_date'] = setThruDate(opts,loader,product)
    try{
      await dbProduct.putProduct(product);
    }catch(error){
      opts.verbose && console.warn(error)
    }
    loader.incLoaded();
  }
  loader.done();
  return;
}
const setFromDate = (
  opts: ParseWorksheetOpts,
  loader: LoadInfo, 
  product: ProductInterface
):Date|undefined => {
  let month = 0;
  const year = Number(product.year);
  if(!product.from_date){
    if(!product.year){
      loader.incIgnored(`No year available for product ${product.uuid}`);
      return
    }
    if(product.month){
      month = new Date([product.year,product.month].join()).getMonth()
    }
    return new Date(Date.UTC(year,month))
  }
}
const setThruDate = (
  opts: ParseWorksheetOpts,
  loader: LoadInfo, 
  product: ProductInterface
):Date|undefined => {
  let month = 0;
  let year = Number(product.year);
  if(!product.thru_date){
    if(!product.year){
      loader.incIgnored(`No year available for product ${product.uuid}`);
      return;
    }
    
    if(product.month){
      const date = new Date([product.year,product.month].join())
      //thru date is start of next month
      month = date.getMonth()+1
    }else{
      //thru date is start of next year
      year+=1;
    }
    return new Date(Date.UTC(year,month))
  }
}



