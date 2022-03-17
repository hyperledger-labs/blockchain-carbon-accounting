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
    metaMap: Map<string, string>;
    scope: string;
    type: string;
}
