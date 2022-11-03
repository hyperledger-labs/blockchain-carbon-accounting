export interface CreatedToken {
    tokenId: number;
    tokenTypeId: number;
    issuedBy: string;
    issuedFrom: string;
    issuedTo: string;
    fromDate: number;
    thruDate: number;
    dateCreated: number;
    metadata: string;
    manifest: string;
    description: string;
    totalIssued: bigint;
    totalRetired: bigint;
}

export interface CreatedTracker {
    trackerId: number;
    trackee: string;
    auditor: string;
    createdBy: string;
    totalProductAmounts: bigint;
    totalEmissions: bigint;
    totalOffsets: bigint;
    fromDate: number;
    thruDate: number;
    dateCreated: number;
    dateUpdated: number;
    metadata: string;
    description: string;
    operatorUuid: string;
    tokens: CreatedToken[];
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

export type IFIELDS = {
    "tokenId"? : FIELD,
    "tokenTypeId"? : FIELD,
    "issuedBy"? : FIELD,
    "issuedFrom"? : FIELD,
    "issuedTo"? : FIELD,
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
    "issuedBy": STRING_FIELD,
    "issuedFrom": STRING_FIELD,
    "issuedTo": STRING_FIELD,
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
    "transferred": NUMERIC_FIELD,
    "address": STRING_FIELD,
    "name": STRING_FIELD,
    "organization": STRING_FIELD,
    "public_key": STRING_FIELD,
    "public_key_name": STRING_FIELD,
    "roles": STRING_FIELD,
    "metamask_encrypted_public_key": STRING_FIELD
};
