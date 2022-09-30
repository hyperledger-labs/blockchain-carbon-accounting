import type { Field } from "@blockchain-carbon-accounting/react-app/src/components/static-data"

export type Asset = {
  name?: string
  latitude: string
  longitude: string
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
  name?: string
  assetCount?: number
}

export const ASSET_FIELDS: Field[] = [
{
    alias: 'Operator Name',
    name: 'operator',
    type: 'string',
    ops: ['like']
},
]