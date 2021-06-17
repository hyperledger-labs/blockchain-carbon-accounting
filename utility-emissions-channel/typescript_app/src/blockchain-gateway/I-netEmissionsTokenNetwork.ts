// I-netEmissionsTokenNetwork.ts : defines interface of request and response to/from
// netEmissionsTokenNetwork contract

export interface IIssueRequest{
    addressToIssue:string;
    quantity:number;
    fromDate:number;
    thruDate:number;
    automaticRetireDate:number;
    metadata:string;
    manifest:string;
    description:string;
}

export interface IIssueResponse{
    tokenId:string;
}