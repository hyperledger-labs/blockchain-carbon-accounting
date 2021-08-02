import {getAWSConfig} from '../../config/aws-config';
import {S3,Endpoint, AWSError} from 'aws-sdk';
export default class AWSS3{
    private readonly s3:S3;
    private readonly bucketName:string;
    constructor(){
        const config = getAWSConfig();
        this.bucketName = config.bucketName;
        if(config.isS3Local){
            this.s3 = new S3({
                s3ForcePathStyle: true,
                accessKeyId: 'S3RVER',
                secretAccessKey: 'S3RVER',
                endpoint: new Endpoint(config.devS3Address),
                s3BucketEndpoint: true,
            });
        }else{
            this.s3 = new S3({
                accessKeyId: config.accessKeyId,
                secretAccessKey: config.accessKey
            });
        }
    }

    upload(fileBin:Buffer,filename:string){
        return new Promise((resolve:(value:S3.ManagedUpload.SendData)=>void,reject:(reason:Error)=>void)=>{
            this.s3.upload({
                Bucket: this.bucketName,
                Key: filename,
                Body: fileBin
            },(err:Error,data:S3.ManagedUpload.SendData)=>{
                if(err){
                    return reject(err);
                }
                resolve(data);
            });
        });
    }
    download(filename:string){
        return new Promise((resolve:(value:Buffer)=>void,reject:(err:AWSError)=>void)=>{
            this.s3.getObject({
                Bucket: this.bucketName,
                Key: filename
            },(err:AWSError,data)=>{
                if (err){
                    return reject(err);
                }
                resolve(data.Body as Buffer);
            });
        });
    }
}