export interface IRequestManagerInput{
    keys:string[];
    params:string; // a base64 json encoded string
}

export interface IRequestManagerOutput{
    keys:string[];
    // base64 json encoded string
    outputToClient?:string;
    // value is base64 json encoded string
    outputToStore?:{[key:string] :string};
}