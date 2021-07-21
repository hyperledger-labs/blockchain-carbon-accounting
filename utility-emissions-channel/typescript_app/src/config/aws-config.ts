// aws.config.ts : read aws environment variable and do some checks

import {Checks} from '@hyperledger/cactus-common';

export interface IAWSConfigs{
    accessKeyId?:string;
    accessKey?:string;
    devS3Address?:string;
    isS3Local:boolean;
    bucketName:string;
}

export function getAWSConfig():IAWSConfigs{
    let isS3Local = true;
    if (process.env.S3_LOCAL === 'false'){
        isS3Local = false;
    }

    if (!isS3Local){
        Checks.nonBlankString(process.env.AWS_ACCESS_KEY_ID,'AWS_ACCESS_KEY_ID');
        Checks.nonBlankString(process.env.AWS_SECRET_ACCESS_KEY,'AWS_SECRET_ACCESS_KEY');
    }

    Checks.nonBlankString(process.env.BUCKET_NAME,'BUCKET_NAME');

    return {
        accessKey: process.env.AWS_SECRET_ACCESS_KEY,
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        isS3Local,
        bucketName: process.env.BUCKET_NAME,
        devS3Address: process.env.DEV_S3_ADDRESS ||'http://127.0.0.1:4569'
    };
}