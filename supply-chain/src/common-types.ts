import { LatLngLiteral } from "@googlemaps/google-maps-services-js";
import { UpsResponse } from './ups-types';

export type ValueAndUnit = {
  value: number,
  unit: string
};
export type Address = {
  country?: string,
  address?: string,
  city?: string,
  state_province?: string,
  zip_code?: string,
};
export type AddressAndCoordinates = Address & {
  coords?: LatLngLiteral
};
export type Distance = {
  origin: AddressAndCoordinates,
  destination: AddressAndCoordinates,
  value: number,
  unit: string
};
export type Flight = {
  flight_number: string,
  number_of_passengers?: number,
  carrier?: string,
  class?: string,
};
export type Shipment = {
  carrier: string,
  tracking: string,
  mode?: string,
  weight?: number,
  weight_uom?: string,
};
type ActivityBase = {
  id: string,
  type: 'shipment' | 'flight',
  from: Address,
  tp: Address,
};
export type ShipmentActivity = ActivityBase & Shipment;
export type FlightActivity = ActivityBase & Flight;
export type Activity = ShipmentActivity | FlightActivity;
export type EmissionActivity = Activity & {
  emissions: ValueAndUnit
}

export type OutputError = {
  error: string
};
export type Output = {
  ups?: UpsResponse,
  weight?: ValueAndUnit,
  distance?: Distance | OutputError,
  emissions?: ValueAndUnit,
  geocode?: OutputError,
};


