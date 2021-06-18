// I-fabricRegistry.ts : defines interface to enroll/register user
// with fabric ca.

export interface IEnrollRegistrarRequest{
    orgName:string;
    username:string;
    secret:string;
}

export interface IEnrollRegistrarResponse{
    orgName:string;
    msp:string;
    caName:string;
}

export interface IEnrollUserRequest{
    orgName:string;
    userId:string;
    secret:string;
    affiliation:string;
}