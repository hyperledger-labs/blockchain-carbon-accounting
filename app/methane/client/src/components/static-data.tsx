import type { Field } from "@blockchain-carbon-accounting/react-app/src/components/static-data"
import { AssetOperator, Wallet, Product } from '@blockchain-carbon-accounting/data-postgres';

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
  name: string
  wallet: Wallet;
  status?: string;
  description?: string;
  asset_count?: number
  asset_operators?: AssetOperator[];
  products?: Product[];
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
    alias: 'Operator Name',
    name: 'operator',
    type: 'string',
    ops: ['like']
},
]