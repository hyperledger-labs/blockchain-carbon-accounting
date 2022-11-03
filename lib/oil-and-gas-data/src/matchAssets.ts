import { 
  OilAndGasAssetInterface, 
} from "./oilAndGasAsset"
import { 
  OilAndGasAssetDbInterface,
} from "@blockchain-carbon-accounting/data-common";
import { getDistance } from 'geolib';

// returns all asssets within resolution of the listed coordinate /
// resolution is in units of kilometers approx 0.008 degrees lat per km
// arc length of 1 km longitude is adjusted as approaching the polls.
export const matchAssets = async (
  db: OilAndGasAssetDbInterface,
  latitude: number, 
  longitude: number, 
  country: string, 
  resolution = 1)
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
          op: '<',
          conjunction: true,
        },{
          field: 'latitude',
          fieldSuffix: 'lower',
          fieldType: 'number',
          value: (latitude-0.008*resolution),
          op: '>',
          conjunction: true,           
        },{   
          field: 'longitude',
          fieldSuffix: 'upper',
          fieldType: 'number',
          value: longitude+360*resolution/(40075*Math.cos(latitude*Math.PI/180)),
          op: '<',
          conjunction: true,
        },{
          field: 'longitude',
          fieldSuffix: 'lower',
          fieldType: 'number',
          value: longitude-360*resolution/(40075*Math.cos(latitude*Math.PI/180)),
          op: '>',  
          conjunction: true,         
        }
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
  resolution = 1)
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