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

export type EmissionsRequestPayload = Omit<EmissionsRequest, 'uuid' | 'created_at' | 'updated_at'>

const OP_MAP: Record<string, string> = {
    'eq': '=',
    'like': 'like',
    'ls': '<',
    'gt': '>',
};

// eslint-disable-next-line
export function buildQueries(table: string, builder: SelectQueryBuilder<any>, queries: Array<QueryBundle>, entities?: EntityTarget<any>[]) : SelectQueryBuilder<any> {
  const len = queries.length
  for (let i = 0; i < len; i++) {
    const query: QueryBundle = queries[i]
    if (OP_MAP[query.op]) {
      query.op = OP_MAP[query.op]
    }

    // last payload
    const payload: StringPayload = {}
    if(query.fieldType == "string") {

      // process 'like' exception for payload
      if(query.op == 'like') payload[query.field] = '%' + query.value as string + '%'
      else if(query.op == '=') payload[query.field] = query.value as string

    }
    else if (query.fieldType == 'number') payload[query.field] = query.value as number
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
          alias = md.name;
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
    if(query.field == 'issuedTo' || query.field == 'issuedBy' || query.field == 'issuedFrom') {
      cond = `LOWER(${alias}.${query.field}) ${query.op} LOWER(:${query.field})`
    } else {
      cond = `${alias}.${query.field} ${query.op} :${query.field}`
    }
    builder = builder.andWhere(cond, payload)

  }
  return builder
}

