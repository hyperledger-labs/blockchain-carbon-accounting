export interface CreatedToken {
    tokenId: number;
    tokenTypeId: number;
    issuee: string;
    issuer: string;
    fromDate: number;
    thruDate: number;
    dateCreated: number;
    automaticRetiredDate: number;
    metadata: string;
    manifest: string;
    description: string;
    totalIssued: number;
    totalRetired: number;
}

export interface TokenPayload extends CreatedToken {
    scope: number;
    type: string;
    metaObj: any;
}

export type QueryBundle = {
    field: string,
    fieldType: string,
    value: number | string,
    op: string,
}


export type FIELD = {
    fieldType: string;
    op: Array<string>;
}

const STRING_FIELD: FIELD = {
    fieldType: "string",
    op: ["=", "like"],
}

const NUMERIC_FIELD: FIELD = {
    fieldType: "number",
    op: [">", "<", "="],
}

export interface StringPayload {
    [key: string] : string | number
}

export type QueryPayload = {
    tokenId? : number,
    tokenTypeId? : number,
    issuer? : string,
    issuee? : string,
    fromDate? : number,
    thruDate? : number,
    dateCreated? : number,
    automaticRetireDate? : number,
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
    "automaticRetireDate"? : FIELD,
    "metadata"? : FIELD,
    "manifest"? : FIELD,
    "desc"? : FIELD,
    "totalIssued"? : FIELD,
    "totalRetired"? : FIELD,
    "scope"? : FIELD,
    "type"? : FIELD
}

export const FIELDS = {
    "tokenId" : STRING_FIELD,
    "tokenTypeId": NUMERIC_FIELD,
    "issuer": STRING_FIELD,
    "issuee": STRING_FIELD,
    "fromDate": NUMERIC_FIELD,
    "thruDate": NUMERIC_FIELD,
    "dateCreated": NUMERIC_FIELD,
    "automaticRetireDate": NUMERIC_FIELD,
    "metadata": STRING_FIELD,
    "manifest": STRING_FIELD,
    "desc": STRING_FIELD,
    "totalIssued": NUMERIC_FIELD,
    "totalRetired": NUMERIC_FIELD,
    "scope": NUMERIC_FIELD,
    "type": STRING_FIELD
};