import type { Field, Wallet } from "@blockchain-carbon-accounting/react-app/src/components/static-data"
export type Asset = {
  name?: string
  latitude: number
  longitude: number
  division_type?: string
  division_name?: string
  sub_division_type?: string
  sub_division_name?: string
  status?: string
  api?: string
  source?: string
  source_date?: Date
  product?: string
  metadata?: string
}

export type Operator = {
  uuid?: string;
  name?: string;
  wallet?: Wallet;
  status?: string;
  description?: string;
  asset_count?: number
  //asset_operators?: AssetOperator[];
  //products?: Product[];
}


export type Product = {
  uuid?: string;
  name: string;
  type: string;
  amount: number;
  unit: string;
  assets?: Asset;
  operator?: Operator;
  country?: string;
  division_type?: string;
  division_name?: string;
  sub_division_type?: string;
  sub_division_name?: string;
  latitude?: number;
  longitude?: number;
  year?: string;
  month?: string;
  from_date?: Date;
  thru_date?: Date;
  description?: string;
  metadata?: string;
  source?: string;
  source_date?: string;
}

export const OPERATOR_FIELDS: Field[] = [
{
    alias: 'Name',
    name: 'name',
    type: 'string',
    ops: ['like']
},
]

export const ASSET_FIELDS: Field[] = [
{
    alias: 'Name',
    name: 'name',
    type: 'string',
    ops: ['like']
},
]