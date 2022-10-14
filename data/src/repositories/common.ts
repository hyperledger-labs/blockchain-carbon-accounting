import { EntityTarget, SelectQueryBuilder } from "typeorm"
import { EmissionsRequest } from "../models/emissionsRequest";

export interface BalancePayload {
  issuedTo: string
  tokenId: number
  available: bigint
  retired: bigint
  transferred: bigint
}

export type QueryBundle = {
  field: string,
  fieldType: string,
  value: number | string,
  op: string,
  fieldSuffix?: string, // use this if conditioning the same field more than once
  conjunction?:boolean, // use this for AND querries. 
  // Warning! does not support combination of conjuction and disjunction
}

export interface StringPayload {
  [key: string] : string | number
}

export interface TokenPayload {
  tokenId: number;
  tokenTypeId: number;
  issuedBy: string;
  issuedFrom: string;
  issuedTo: string;
  fromDate: number;
  thruDate: number;
  dateCreated: number;
  // eslint-disable-next-line
  metadata: Object;
  // eslint-disable-next-line
  manifest: Object;
  description: string;
  totalIssued: bigint;
  totalRetired: bigint;
  scope: number;
  type: string;
}

export type EmissionsRequestPayload = Omit<EmissionsRequest, 'uuid' | 'created_at' | 'updated_at' | 'toJSON'>

export interface TrackerPayload {
  trackerId: number;
  trackee: string;
  auditor: string;
  totalProductAmounts: bigint;
  totalEmissions: bigint;
  totalOffset: bigint;
  fromDate: number;
  thruDate: number;
  dateCreated: number;
  // eslint-disable-next-line
  metadata: Object;
  description: string;
}

export interface ProductTokenPayload {
  productId: number;
  trackerId: number;
  auditor: string;
  amount: bigint;
  available: bigint;
  name: string;
  unit: string;
  unitAmount: bigint;
  hash: string;
}

export interface AssetPayload {
  type: string;
  country: string;
  latitude: string;
  longitude: string;
  name?: bigint;
  operator?: string;
  division_type?: string;
  division_name?: string;
  sub_division_name?: string;
  sub_division_type?: string;
  status?: string;
  api?: string;
  description?: string;
  source?: string;
  source_date?: Date;
  validation_method?: string;
  validation_date?: Date;
  product?: string;
  field?: string;
  depth?: string;
}


const OP_MAP: Record<string, string> = {
    'eq': '=',
    'like': 'like',
    'ls': '<',
    'gt': '>',
    'vector': 'vector'
};

// eslint-disable-next-line
export function buildQueries(
  table: string, 
  builder: SelectQueryBuilder<any>, 
  queries: Array<QueryBundle>, 
  entities?: EntityTarget<any>[],
) : SelectQueryBuilder<any> {
  
  queries.sort((a, b) => Number(a.conjunction) - Number(b.conjunction) )
  // sort queries to process disjunction querries first (orWhere) 
  // and then conjunction querries 
  // Temp fix to ensure andWhere overrides orWhere querry
  // Warning !!! TO-DO 
  // does not suuport combination of mixed multiple disjunction and conjuction groups
  // Reuqires implmenting Brackets ..
  
  const len = queries.length
  for (let i = 0; i < len; i++) {
    // if query_field has already been set


    const query: QueryBundle = queries[i]
    if (OP_MAP[query.op]) {
      query.op = OP_MAP[query.op]
    }
    let query_field_label = query.field
    if(query.fieldSuffix){
      query_field_label = [query_field_label,query.fieldSuffix].join('_')
    }

    // last payload
    const payload: StringPayload = {}
    if(query.fieldType == "string") {

      // process 'like' exception for payload
      if(query.op == 'like') payload[query_field_label] = '%' + query.value as string + '%'
      else if(query.op == '=') payload[query_field_label] = query.value as string
      else if(query.op == 'vector') payload[query_field_label] = query.value as string

    }
    else if (query.fieldType == 'number') payload[query_field_label] = query.value as number
    else continue

    // check which entity alias should be used
    let alias = null;
    // Entities should be given when the query uses a JOIN, for example when querying
    // Balance and Token via: leftJoinAndMapOne('balance.token', Token, 'token', 'token.tokenId = balance.tokenId')
    // this should be given [Balance, Token]
    if (entities) {
      for (const entity of entities) {
        const md = builder.connection.getMetadata(entity)
        if (md.hasColumnWithPropertyPath(query.field)) {
          alias = md.tableName;
          break;
        }
      }
      if (!alias) {
        console.log('No entity found for column', query.field, ' ?? using default ', table);
        alias = table;
      }
    } else {
      alias = table;
    }
    alias = alias.toLowerCase();

    // make case insensitive for issuee issuer cases
    let cond = '';
    if(query.op == "like" || query.field == 'issuedTo' || query.field == 'issuedBy' || query.field == 'issuedFrom') {
      cond = `LOWER(${alias}.${query.field}) ${query.op} LOWER(:${query.field})`
    }else if(query.op == "vector"){
      cond = `to_tsvector(${alias}.${query.field}) @@ to_tsquery(query.value)`
    } else {
      cond = `${alias}.${query.field} ${query.op} :${query_field_label}`
    }
    if(query.conjunction){
      builder = builder.andWhere(cond, payload)
    }else{   
      builder = builder.orWhere(cond, payload)
    }
  }
  return builder
}

