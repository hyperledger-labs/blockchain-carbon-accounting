export interface CreatedToken {
    tokenId: number;
    tokenTypeId: number;
    issuee: string;
    issuer: string;
    fromDate: number;
    thruDate: number;
    dateCreated: number;
    metadata: string;
    manifest: string;
    description: string;
    totalIssued: number;
    totalRetired: number;
}

export type FIELD = {
    fieldType: string;
    op: Array<string>;
}

const STRING_FIELD: FIELD = {
    fieldType: "string",
    op: ["eq", "like"],
}

const NUMERIC_FIELD: FIELD = {
    fieldType: "number",
    op: ["ls", "gt", "eq"],
}

export interface IOP_MAP {
    eq: string;
    like: string;
    ls: string;
    gt: string
}

export const OP_MAP: IOP_MAP = {
    'eq': '=',
    'like': 'like',
    'ls': '<',
    'gt': '>',
}

export type QueryPayload = {
    tokenId? : number,
    tokenTypeId? : number,
    issuer? : string,
    issuee? : string,
    fromDate? : number,
    thruDate? : number,
    dateCreated? : number,
    metadata? : string,
    manifest? : string,
    desc? : string,
    totalIssued? : number,
    totalRetired? : number,
    scope? : number,
    type? : string
}

export type IFIELDS = {
    "tokenId"? : FIELD,
    "tokenTypeId"? : FIELD,
    "issuer"? : FIELD,
    "issuee"? : FIELD,
    "fromDate"? : FIELD,
    "thruDate"? : FIELD,
    "dateCreated"? : FIELD,
    "metadata"? : FIELD,
    "manifest"? : FIELD,
    "desc"? : FIELD,
    "totalIssued"? : FIELD,
    "totalRetired"? : FIELD,
    "scope"? : FIELD,
    "type"? : FIELD,
    "retired"?: FIELD,
    "available"?: FIELD,
    "transferred"?: FIELD
}

export const FIELDS = {
    "tokenId" : STRING_FIELD,
    "tokenTypeId": NUMERIC_FIELD,
    "issuer": STRING_FIELD,
    "issuee": STRING_FIELD,
    "fromDate": NUMERIC_FIELD,
    "thruDate": NUMERIC_FIELD,
    "dateCreated": NUMERIC_FIELD,
    "metadata": STRING_FIELD,
    "manifest": STRING_FIELD,
    "desc": STRING_FIELD,
    "totalIssued": NUMERIC_FIELD,
    "totalRetired": NUMERIC_FIELD,
    "scope": NUMERIC_FIELD,
    "type": STRING_FIELD,
    "retired": NUMERIC_FIELD,
    "available": NUMERIC_FIELD,
    "transferred": NUMERIC_FIELD
};
