import { 
  OilAndGasAssetInterface, 
} from "./oilAndGasAsset"
import { 
  AssetOperatorInterface, 
} from "./assetOperator"
import { 
  OilAndGasAssetDbInterface,
  AssetOperatorDbInterface
} from "@blockchain-carbon-accounting/data-common";
import { getDistance } from 'geolib';

// returns all assets within resolution of the listed coordinate /
// resolution is in units of kilometers approx 0.008 degrees lat per km
// arc length of 1 km longitude is adjusted as approaching the polls.
export const matchAssets = async (
  db: OilAndGasAssetDbInterface,
  latitude: number, 
  longitude: number, 
  country: string, 
  resolution: number)
: Promise<OilAndGasAssetInterface[] | undefined > => {
  // aesst repo currently only has assets listed in Canada and U.S.
  if(country && ['United States of America',
      'United States','USA','US',
      'Canada','CAN'].includes(country?.replace(/\./g,'')))
  {
    // search for assets with width of resolution centered at lat/long
    resolution*=0.5; 
    try {
      //console.log('product coord: ', latitude,longitude)
      const assets: OilAndGasAssetInterface[] = await db.select([
        {   
          field: 'latitude',
          fieldSuffix: 'upper',
          fieldType: 'number',
          value: (latitude+0.008*resolution),
          op: '<=',
          conjunction: true,
        },{
          field: 'latitude',
          fieldSuffix: 'lower',
          fieldType: 'number',
          value: (latitude-0.008*resolution),
          op: '>=',
          conjunction: true,           
        },{   
          field: 'longitude',
          fieldSuffix: 'upper',
          fieldType: 'number',
          value: longitude+360*resolution/(40075*Math.cos(latitude*Math.PI/180)),
          op: '<=',
          conjunction: true,
        },{
          field: 'longitude',
          fieldSuffix: 'lower',
          fieldType: 'number',
          value: longitude-360*resolution/(40075*Math.cos(latitude*Math.PI/180)),
          op: '>=',  
          conjunction: true,         
        },{
          field: 'status',
          fieldType: 'string',
          value: 'NON-ACTIVE WELL',
          op: '!=',
          conjunction: true,
        }
        /*,{
          field: 'operatorUuid',
          fieldType: 'string',
          value: '868d7200-f5ad-40f3-891a-a4bdc58f96b5',
          op: 'like',  
          conjunction: true,         
        }*/
        
      ]);
    
      return assets;
    }catch (err) {
      console.error(err)
      throw new Error('Error in matchAssets: ' + err)
    }
  }else{
    undefined
  }
}
export const matchAsset = async (
  db: OilAndGasAssetDbInterface,
  latitude: number, 
  longitude: number, 
  country: string, 
  resolution = 10)
: Promise<OilAndGasAssetInterface | undefined > => {
  // aesst repo currently only has assets listed in Canada and U.S.
  const assets = await matchAssets(db,latitude,longitude,country,resolution);
  if(assets){
    const distances:number[]=[];
    for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        distances[i]= await getDistance(
            {latitude,longitude},
            {latitude:asset.latitude, longitude: asset.longitude}
        )
    }
    const min = await Math.min(...distances);
    const index = distances.indexOf(min);
    return assets[index];
  }  
}
// returns all operators within resolution of the listed coordinate /
// resolution is in units of kilometers approx 0.008 degrees lat per km
// arc length resulotion [km] is adjusted as approaching the polls.
export const matchOperators = async (
  db: AssetOperatorDbInterface,
  latitude: number, 
  longitude: number, 
  country: string, 
  resolution: number)
: Promise<AssetOperatorInterface[] | undefined > => {
  // aesst repo currently only has assets listed in Canada and U.S.
  if(country && ['United States of America',
      'United States','USA','US',
      'Canada','CAN'].includes(country?.replace(/\./g,'')))
  {
    // search for assets with width of resolution centered at lat/long
    resolution*=0.5; 
    try {
      //console.log('product coord: ', latitude,longitude)
      const assetOperators: AssetOperatorInterface[] = await db.select([
        {   
          field: 'latitude',
          fieldSuffix: 'upper',
          fieldType: 'number',
          value: (latitude+0.008*resolution),
          op: '<=',
          conjunction: true,
        },{
          field: 'latitude',
          fieldSuffix: 'lower',
          fieldType: 'number',
          value: (latitude-0.008*resolution),
          op: '>=',
          conjunction: true,           
        },{   
          field: 'longitude',
          fieldSuffix: 'upper',
          fieldType: 'number',
          value: longitude+360*resolution/(40075*Math.cos(latitude*Math.PI/180)),
          op: '<=',
          conjunction: true,
        },{
          field: 'longitude',
          fieldSuffix: 'lower',
          fieldType: 'number',
          value: longitude-360*resolution/(40075*Math.cos(latitude*Math.PI/180)),
          op: '>=',  
          conjunction: true,         
        }        
      ]);
    
      return assetOperators;
    }catch (err) {
      console.error(err)
      throw new Error('Error in matchOperators: ' + err)
    }
  }else{
    undefined
  }
}
export const matchOperator = async (
  dbAsset: OilAndGasAssetDbInterface,
  db: AssetOperatorDbInterface,
  latitude: number, 
  longitude: number, 
  country: string, 
  resolution = 5)
: Promise<AssetOperatorInterface | undefined > => {
  // aesst repo currently only has assets listed in Canada and U.S.
  const assetOperators = await matchOperators(db,latitude,longitude,country,resolution);
  if(assetOperators){
    const distances:number[]=[];
    for (let i = 0; i < assetOperators.length; i++) {
        const asset = await dbAsset.getAsset(assetOperators[i].assetUuid);
        if(asset){
        distances[i]= await getDistance(
            {latitude,longitude},
            {latitude: asset.latitude, longitude: asset.longitude}
        )}
    }
    const min = await Math.min(...distances);
    const index = distances.indexOf(min);
    return assetOperators[index];
  }  
}