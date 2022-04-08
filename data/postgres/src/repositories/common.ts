import { SelectQueryBuilder } from "typeorm"

export interface BalancePayload {
  issuee: string
  tokenId: number
  available: number
  retired: number
  transferred: number
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
  issuee: string;
  issuer: string;
  fromDate: number;
  thruDate: number;
  dateCreated: number;
  // eslint-disable-next-line
  metadata: Object;
  manifest: string;
  description: string;
  totalIssued: number;
  totalRetired: number;
  scope: number;
  type: string;
}

export interface EmissionsRequestPayload {
  input_data: string;
  public_key: string;
  public_key_name: string;
  issuee: string;
  status: string;
}


const BALANCE_FIELDS = ['issuee', 'tokenId', 'available', 'retired', 'transferred']

// eslint-disable-next-line
export function buildQueries(table: string, builder: SelectQueryBuilder<any>, queries: Array<QueryBundle>) : SelectQueryBuilder<any> {
  const len = queries.length
  for (let i = 0; i < len; i++) {
    const query: QueryBundle = queries[i]

    // last payload
    const payload: StringPayload = {}
    if(query.fieldType == "string") {

      // process 'like' exception for payload
      if(query.op == 'like') payload[query.field] = '%' + query.value as string + '%'
      else if(query.op == '=') payload[query.field] = query.value as string

    }
    else if (query.fieldType == 'number')
    payload[query.field] = query.value as number
    else continue

    // make case insensitive for issuee issuer cases
    if(!BALANCE_FIELDS.includes(query.field)) {
      console.log(query)
      table = 'token'
    } else {
      table = 'balance'
    }
    if(query.field == 'issuee' || query.field == 'issuer') {
      builder = builder.andWhere(`LOWER(${table}.${query.field}) ${query.op} LOWER(:${query.field})`, payload)
    } else {
      builder = builder.andWhere(`${table}.${query.field} ${query.op} :${query.field}`, payload)
    }

  }
  return builder
}

