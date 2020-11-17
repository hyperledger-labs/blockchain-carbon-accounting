import * as fs from "fs";
import * as AWS from "aws-sdk";
import * as AWS_CONFIG from "../../../../chaincode/node/lib/aws-config";

const BUCKET_NAME = "blockchain-carbon-accounting";
const IAM_USER_KEY = AWS_CONFIG.AWS_ACCESS_KEY_ID;
const IAM_USER_SECRET = AWS_CONFIG.AWS_SECRET_ACCESS_KEY;

const s3bucket = new AWS.S3({
  accessKeyId: IAM_USER_KEY,
  secretAccessKey: IAM_USER_SECRET,
});

export function uploadToS3(fileBin: string, fileName: string): Promise<any> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileBin,
  };

  return new Promise((resolve, reject) => {
    s3bucket.upload(params, function(err, data) {
      if (err) {
        return reject(err);
      }

      return resolve(data);
    });
  });
}
