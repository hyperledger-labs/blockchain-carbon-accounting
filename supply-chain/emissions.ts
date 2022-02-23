import * as dotenv from 'dotenv';
import { readFileSync } from 'fs'
import { Activity, ActivityResult, FlightActivity, is_shipment_activity, is_shipment_flight, ProcessedActivity, ShipmentActivity } from "./src/common-types";
import { calc_direct_distance, calc_distance } from './src/distance-utils';
import { calc_emissions, weight_in_kg } from './src/emissions-utils';
import { get_ups_client, get_ups_shipment } from "./src/ups-utils";

// common config
dotenv.config();


export async function process_shipment(a: ShipmentActivity): Promise<ActivityResult> {
  if (a.carrier === 'ups') {
    const uc = get_ups_client();
    const shipment = await get_ups_shipment(uc, a.tracking);
    return { 
      distance: shipment.output.distance,
      weight: shipment.output.weight,
      emissions: shipment.output.emissions,
    };
  } else {
    // mode is required here
    if (!a.mode) throw new Error(`Shipment mode field value is required`);
    // calculate distance from the address fields ...
    const distance = await calc_distance(a.from, a.to, a.mode);
    // then calc emissions ...
    const weight = weight_in_kg(a.weight, a.weight_uom);
    const emissions = calc_emissions(weight, distance);
    return { distance, weight: {value: weight, unit: 'kg'}, emissions };
  }
}

export async function process_flight(a: FlightActivity): Promise<ActivityResult> {
  const distance = await calc_direct_distance(a.from, a.to, 'air');
  const weight = 80; // arbitrary value here
  const emissions = calc_emissions(weight, distance);
  return { distance, weight: {value: weight, unit: 'kg'}, emissions };
}

async function process_activity(activity: Activity) {
  // all activity must have an ID
  if (!activity.id) {
    throw new Error('Activity must have an id');
  }
  if (is_shipment_activity(activity)) {
    return await process_shipment(activity);
  } else if (is_shipment_flight(activity)) {
    return await process_flight(activity);
  } else {
    throw new Error("activity not recognized");
  }
}

/** Return an Array 
*/
async function process_activities(activities: Activity[]): Promise<ProcessedActivity[]> {
  return await Promise.all(activities.map(async (activity)=>{
    try {
      const result = await process_activity(activity);
      return { activity, result }
    } catch (error) {
      // console.error("Error in process_activities: ", error);
      return { activity, error: error.message||error }
    }
  }));
}


const args = process.argv.splice( /node$/.test(process.argv[0]) ? 2 : 1 );
const source = args.length > 0 ? args[0] : "/dev/stdin";
const data_raw = readFileSync(source, 'utf8');
const data = JSON.parse(data_raw);

process_activities(data.activities).then((activities)=>{
  // group the resulting emissions per activity type, and for shipment type group by mode:
  const grouped_by_type = activities.filter(a=>!a.error).reduce((prev:any,a)=>{
    const t = a.activity.type;
    if (t === 'shipment') {
      const m = a.result.distance.mode;
      const g = prev[t] || {};
      prev[t] = g;
      g[m] = (g[m]||0.0) + a.result.emissions.value;
    } else {
      prev[t] = (prev[t]||0.0) + a.result.emissions.value;
    }
    return prev;
  }, {});
  const result = { activities, grouped_by_type };
  console.log(JSON.stringify(result, null, 4));
});
