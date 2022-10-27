import * as crypto from "crypto";
import { EntityTarget, SelectQueryBuilder } from "typeorm"
import { EmissionsRequest } from "../models/emissionsRequest";
import { QueryBundle } from "@blockchain-carbon-accounting/data-common";

export type { QueryBundle }

export interface BalancePayload {
  issuedTo: string
  tokenId: number
  available: bigint
  retired: bigint
  transferred: bigint
}

import type { ProductInterface } from "@blockchain-carbon-accounting/oil-and-gas-data-lib";

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
  createdBy: string;
  auditor: string;
  totalProductAmounts: bigint;
  totalEmissions: bigint;
  totalOffset: bigint;
  fromDate: number;
  thruDate: number;
  dateCreated: number;
  dateUpdated: number;
  // eslint-disable-next-line
  metadata: object;
  description: string;
  operatorUuid: string;
}

export interface ProductTokenPayload {
  productId: number;
  trackerId: number;
  auditor: string;
  amount: bigint;
  available: bigint;
  name: string;
  unit: string;
  unitAmount: number;
  hash: string;
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

export function encryptField(sourceStr: string) {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    throw new Error('Encryption key is not set.');
  }
  const iv = crypto.randomBytes(16);
  const key = crypto.createHash('sha256').update(String(process.env.FIELD_ENCRYPTION_KEY)).digest('base64').substr(0, 32);
  const chiper = crypto.createCipheriv('aes-256-cbc', key.toString(), iv);
  let encrypted = chiper.update(sourceStr, 'utf8', 'hex');
  encrypted += chiper.final('hex');

  return encrypted + '#' + iv.toString('hex');
}

export function decryptField(encStr: string) {
  if (!process.env.FIELD_ENCRYPTION_KEY) {
    throw new Error('Encryption key is not set.');
  }
  const encarr = encStr.split('#');
  if (encarr.length != 2) {
    throw new Error('Wrong field encrypted string format.');
  }
  const key = crypto.createHash('sha256').update(String(process.env.FIELD_ENCRYPTION_KEY)).digest('base64').substr(0, 32);
  const decipher = crypto.createDecipheriv('aes-256-cbc', key.toString(), Buffer.from(encarr[1], 'hex'));
  let decrypted = decipher.update(encarr[0], 'hex', 'utf8')
  decrypted += decipher.final('utf8');

  return decrypted;
}