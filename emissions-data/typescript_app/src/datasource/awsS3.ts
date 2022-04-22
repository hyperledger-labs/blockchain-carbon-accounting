import { S3, Endpoint, AWSError } from 'aws-sdk';
import { DeleteObjectOutput } from 'aws-sdk/clients/s3';
export default class AWSS3 {
    private readonly s3: S3;
    private readonly bucketName: string;
    constructor() {
        const isDev = process.env.S3_LOCAL === 'true';
        this.bucketName = process.env.BUCKET_NAME || 'local-bucket';
        if (isDev) {
            this.s3 = new S3({
                s3ForcePathStyle: true,
                accessKeyId: 'S3RVER',
                secretAccessKey: 'S3RVER',
                endpoint: new Endpoint(process.env.DEV_S3_ADDRESS || ''),
                s3BucketEndpoint: true,
            });
        } else {
            this.s3 = new S3({
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            });
        }
    }

    upload(fileBin: Buffer, filename: string): Promise<S3.ManagedUpload.SendData> {
        return new Promise(
            (
                resolve: (value: S3.ManagedUpload.SendData) => void,
                reject: (reason: Error) => void,
            ) => {
                this.s3.upload(
                    {
                        Bucket: this.bucketName,
                        Key: filename,
                        Body: fileBin,
                    },
                    (err: Error, data: S3.ManagedUpload.SendData) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(data);
                    },
                );
            },
        );
    }
    download(filename: string): Promise<Buffer> {
        return new Promise((resolve: (value: Buffer) => void, reject: (err: AWSError) => void) => {
            this.s3.getObject(
                {
                    Bucket: this.bucketName,
                    Key: filename,
                },
                (err: AWSError, data) => {
                    if (err) {
                        return reject(err);
                    }
                    resolve(data.Body as Buffer);
                },
            );
        });
    }
    delete(filename: string): Promise<DeleteObjectOutput> {
        return new Promise(
            (resolve: (value: DeleteObjectOutput) => void, reject: (err: AWSError) => void) => {
                this.s3.deleteObject(
                    {
                        Bucket: this.bucketName,
                        Key: filename,
                    },
                    (err: AWSError, data) => {
                        if (err) {
                            return reject(err);
                        }
                        resolve(data);
                    },
                );
            },
        );
    }
}
