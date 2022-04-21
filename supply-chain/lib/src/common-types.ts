import { LatLngLiteral } from "@googlemaps/google-maps-services-js";
import { EmissionsFactorInterface } from "emissions_data_chaincode/src/lib/emissionsFactor";
import { UpsResponse } from './ups-types';

export type ValueAndUnit = {
  value: number,
  unit: string
};
export type AddressObject = {
  country?: string,
  address?: string,
  city?: string,
  state_province?: string,
  zip_code?: string,
};
export type Emissions = {
    amount: ValueAndUnit,
    factor: EmissionsFactorInterface 
}
export type Address = string | AddressObject;
export type AddressAndCoordinates = AddressObject & {
  coords?: LatLngLiteral
};
export type ActivityType = 'shipment' | 'flight' | 'emissions_factor';
export type ShippingMode = 'air' | 'ground' | 'sea' | 'rail';
export type Distance = {
  origin?: AddressAndCoordinates,
  destination?: AddressAndCoordinates,
  value: number,
  unit: string,
  mode: ShippingMode
};
export type Flight = {
  flight_number: string,
  number_of_passengers?: number,
  carrier?: string,
  class?: string,
};
export type Hybrid = {
  emissions_factor_uuid: string,
  distance?: number,
  distance_uom?: string,
  weight?: number,
  weight_uom?: string,
  activity_amount?: number,
  activity_uom?: string,
};
export type Shipment = {
  carrier: string,
  tracking: string,
  mode?: ShippingMode
  weight?: number,
  weight_uom?: string,
};
export type Path = {
  from: Address,
  to: Address,
};
type ActivityCommon = {
  id: string,
  type: ActivityType,
  from_date?: Date,
  thru_date?: Date,
};
type ActivityBase = Path & ActivityCommon
export type ShipmentActivity = ActivityBase & Shipment;
export type FlightActivity = ActivityBase & Flight;
export type EmissionsFactorActivity = ActivityCommon & (Partial<Flight> & Hybrid);
export type Activity = ShipmentActivity | FlightActivity | EmissionsFactorActivity;
export type ActivityResult = {
  distance?: Distance,
  weight?: ValueAndUnit,
  flight?: { number_of_passengers?: number, class?: string },
  emissions?: Emissions,
  details?: any // eslint-disable-line @typescript-eslint/no-explicit-any
}
export type ProcessedActivity = {
  activity: Activity,
  result?: ActivityResult,
  error?: string
}

export type Output = {
  ups?: UpsResponse,
  from?: Address,
  to?: Address,
  weight?: ValueAndUnit,
  distance?: Distance,
  emissions?: Emissions,
};

export type MetadataType = {
  "Total emissions": number,
  "UOM": string,
  "Scope": number,
  "Type": string
  "Mode"?: string
}

export function is_shipment_activity(a: Activity): a is ShipmentActivity {
  return a.type === 'shipment';
}

export function is_flight_activity(a: Activity): a is FlightActivity {
  return a.type === 'flight';
}

export function is_emissions_factor_activity(a: Activity): a is EmissionsFactorActivity {
  return a.type === 'emissions_factor';
}

export function is_address_object(a: Address): a is AddressObject {
  return typeof a !== 'string';
}

export function address_to_address_object(a: Address): AddressObject {
  if (is_address_object(a)) return a;
  return {
    address: a
  }
}

