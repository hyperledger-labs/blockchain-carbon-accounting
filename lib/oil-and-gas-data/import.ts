import { OilAndGasAssetInterface, OIL_AND_GAS_ASSET_CLASS_IDENTIFER } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset";
import { ProductInterface, PRODUCT_CLASS_IDENTIFER } from "@blockchain-carbon-accounting/oil-and-gas-data-lib/src/product";
import { parseWorksheet, getStateNameMapping, LoadInfo } from "@blockchain-carbon-accounting/data-common/spreadsheetImport";
import { Presets, SingleBar } from "cli-progress";
import { v4 as uuidv4 } from 'uuid';
import { OilAndGasAssetDbInterface, ProductDbInterface } from '@blockchain-carbon-accounting/data-common/db';
import { PostgresDBService } from '@blockchain-carbon-accounting/data-postgres/src/postgresDbService';
const {chain}  = require('stream-chain');
const {parser} = require('stream-json');
const {streamValues} = require( 'stream-json/streamers/StreamValues');
const {streamArray} = require( 'stream-json/streamers/StreamArray');
const {pick} = require('stream-json/filters/Pick');
const {batch} = require('stream-json/utils/Batch');
const fs = require('fs');

var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export const importOilAndGasAssets = async (opts: any, 
  progressBar: SingleBar, db: PostgresDBService) => {

  if (opts.format === "US_asset_data") {
    let loader = new LoadInfo(opts.file, opts.sheet, progressBar, 1506238);
    const pipeline = chain([
      fs.createReadStream('./'+opts.file),
        //new URL("https://services1.arcgis.com/Hp6G80Pky0om7QvQ/arcgis/rest/services/Oil_and_Natural_Gas_Wells/FeatureServer/0/query?outFields=*&where=1%3D1&f=geojson")),
      parser(),
      pick({filter: "features"}),
      streamArray(),
      //batch({batchSize: 5000}),
      async (data:any)  => {
        //loader  
        // import data for each valid stream, eg:
        //console.log(data)
        //for (const row of data) {
          let prop = data.value.properties
          //if (!prop) { loader.incIgnored('Undefined row'); continue; }
          //if (!prop["Data Year"]) { loader.incIgnored('Missing "Data Year"'); continue; }
          //if (prop["Data Year"] == "YEAR") { loader.incIgnored('Header row'); continue; }
          opts.verbose && console.log("-- Prepare to insert from ", prop);
          const d: OilAndGasAssetInterface = {
            uuid: uuidv4(),
            class: OIL_AND_GAS_ASSET_CLASS_IDENTIFER,
            type: prop["TYPE"],
            country: prop["COUNTRY"],
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
            product: prop["PRODTYPE"],
            field: prop["FILED"],
            depth: prop["TOTDEPTH"] !== '-999' ? prop["TOTDEPTH"] : null,
          };
          await db.getOilAndGasAssetRepo().putAsset(d);
          loader.incLoaded();
        //}
        return;   
      }
    ]);
    //console.log(pipeline)
    
    let counter = 0;
    //pipeline.on('data', (data:any) => console.log(data));
    pipeline.on('data', () => 
      ++counter
    );
    pipeline.on('end', async () => {
      loader.done();
      console.log(`Loaded ${counter} entries to oil_and_gas_asset table.`);
      let count = await db.getOilAndGasAssetRepo().countAllAssets()
      console.log(`=== Done, we now have ${count} OilAndGasAssets in the DB`)
      await db.close()
    })
  }
}

export const importFlareData = async (opts: any, 
  progressBar: SingleBar, db: ProductDbInterface) => {

  if (opts.format === "VIIRS") {
    //if(opts.year === undefined){return Error('no year provided')}
    const data = parseWorksheet(opts);
    let loader = new LoadInfo(opts.file, opts.sheet, progressBar, data.length);
    for (const row of data) {
      if (!row) { loader.incIgnored('Undefined row'); continue; }
      //if (row["Data Year"] == "YEAR") { loader.incIgnored('Header row'); continue; }
      opts.verbose && console.log("-- Prepare to insert from ", row);
      // get annual generation and emissions
      const country = row["Country"]?.toString();
      let det_freq = row["Detection frequency "+opts.year] | row["Detection freq."];
      let avg_temp = row["Avg. temp., K"] | row["Avg. temp"];
      let clear_obs = row["Clear Obs."] | row["Clear obs. "] | row["Clear obs "+opts.year] | row["Clear_obs_"+opts.year];
      const details = JSON.stringify({
        "detectionFreq": det_freq?.toString(),
        "avgTempK": avg_temp?.toString(),
        "ellipticity": row["Ellipticity"]?.toString(),
        "sector": row["Type"].toString(),
        "clearObs": clear_obs?.toString()
      });
      let amount = row["BCM "+opts.year] | row["BCM_"+opts.year]
      // generate a unique for the row
      const d: ProductInterface = {
        class: PRODUCT_CLASS_IDENTIFER,
        type: "Flaring",
        uuid: uuidv4(),
        name: "methane",
        amount: amount?.toString(),
        unit: "bcm",
        year: opts.year,
        country: country,
        latitude: row["Latitude"].toString(),
        longitude: row["Longitude"].toString(),
        metadata: details,
        description: "VIIRS satelite flaring data",
        source: opts.source || opts.file
      };
      await db.putProduct(d);
      loader.incLoaded();
    }
    loader.done();
    return;
  }else if(opts.format === "EIA"){
    opts.cellDates = true;
    //if(opts.year === undefined){return Error('no year provided')}
    const data = parseWorksheet(opts);
    let loader = new LoadInfo(opts.file, opts.sheet, progressBar, data.length);
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
      let d: ProductInterface = {
        class: PRODUCT_CLASS_IDENTIFER,
        type: opts.type,
        uuid: uuidv4(),
        name: opts.name,
        unit: opts.unit,
        amount: row[amountHeader],
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
        else{ await db.putProduct(d) };
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
        d["amount"] = row[amountHeader];
        await db.putProduct(d);
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
    
    let cols:string[] = [
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
      let d: ProductInterface = {
        class: PRODUCT_CLASS_IDENTIFER,
        uuid: uuidv4(),
        source: opts.source || opts.file,
        description: "Flare Monitor oil & gas data",
        type: opts.type,
        name: opts.name,
        unit: opts.unit,
        amount: '0'
      };
      if (row["estimated_flare_volume_mcf"]) {        
        d["amount"]=row["estimated_flare_volume_mcf"]; 
        d["year"]=row["month"].getFullYear().toString();
        d["month"]=months[row["month"].getMonth()];
        d["from_date"]=row["month"];
        d["country"]="USA";
        d["division_type"]="State";
        d["division_name"]=getStateNameMapping(row["state"]);
        d["longitude"]=row["longitude"];
        d["latitude"]=row["latitude"];
        d["metadata"]=JSON.stringify({
          type: row["type"],
          sum_rh: row["sum_rh"],
          radius: row["radius"],
          company: row["company_name"],
          cid: row["cid"],
          wells: row["wells"],
          equivalent_co2_released_metric_tons: row["equivalent_co2_released_metric_tons"]
        })
        await db.putProduct(d); 
        loader.incLoaded();
      }else if(row["product_type"]){
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
          d["amount"]=row[col];
          d["year"] = col.substr(col.length - 4);
          d["month"] = col.slice(0,3);
          await db.putProduct(d);
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
    
    let cols:string[] = ["Gas (MBOE)",  "Oil (MBOE)", 
      "CO2", "CH4", "N2O", "GHG", 
      "NGSI Methane Intensity",  "GHG Emissions Intensity", 
      "Process & Equipment Vented", "Process & Equipment Flared",  
      "Fugitive",  "Other Combustion",  "Associated Gas Vented/Flared"]; 
    let loader = new LoadInfo(opts.file, opts.sheet, progressBar, data.length*cols.length);
    for (const row of data) {
      
      if (!row) { loader.incIgnored('Undefined row'); continue; }

      opts.verbose && console.log("-- Prepare to insert from ", row);
      let d: ProductInterface = {
        uuid: uuidv4(),
        class: PRODUCT_CLASS_IDENTIFER,
        source: opts.source || opts.file,
        description: "CATF U.S. O&G Benchmarking",
        type: opts.type,
        name: opts.name,
        unit: opts.unit,
        amount: '0',
        year: row["Data Year"],
        division_type: "Company",
        division_name: row["Company"],
        country: "USA",
      };
      if(row["Basin"]){
        d["sub_division_name"]="basin";
        d["sub_division_type"]=row["Basin"];
      }
      for (const col of cols){
        
        d["amount"] = row[col];
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
        await db.putProduct(d); 
        d["uuid"] = uuidv4();
        d["metadata"] = undefined;
        loader.incLoaded();
      }
    }
    loader.done();
    return;
  }
}