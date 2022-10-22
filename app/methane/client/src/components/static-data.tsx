import type { Field } from "@blockchain-carbon-accounting/react-app/src/components/static-data"
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
  wallet_address?: string;
  status?: string;
  description?: string;
  asset_count?: number;
  trackersCount?: number;
  assetsCount?:number;
  //asset_operators?: AssetOperator[];
  //products?: Product[];
}


export type Product = {
  uuid?: string;
  name: string;
  type: string;
  amount: number;
  unit: string;
  assets?: Asset[];
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
{
    alias: 'State',
    name: 'division_name',
    type: 'string',
    ops: ['eq']
},
]

export const PRODUCT_FIELDS: Field[] = [
{
    alias: 'Year',
    name: 'year',
    type: 'string',
    ops: ['eq']
},
{
    alias: 'Division',
    name: 'division_name',
    type: 'string',
    ops: ['like']
},
{
    alias: 'Month',
    name: 'month',
    type: 'string',
    ops: ['like']
},
{
    alias: 'Name',
    name: 'name',
    type: 'string',
    ops: ['like']
}
/*{
    alias: 'Division',
    name: 'division_type',
    type: 'string',
    ops: ['like']
}*/,
]