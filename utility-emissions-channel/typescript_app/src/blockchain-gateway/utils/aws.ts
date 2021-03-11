// SPDX-License-Identifier: Apache-2.0
import * as fs from "fs";
import * as AWS from "aws-sdk";
import * as AWS_CONFIG from "../../config/aws-config";

const IAM_USER_KEY = AWS_CONFIG.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const IAM_USER_SECRET = AWS_CONFIG.AWS_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

function getS3Bucket() {
  let s3bucket: AWS.S3;
  if (AWS_CONFIG.S3_LOCAL) {
    s3bucket = new AWS.S3({
      s3ForcePathStyle: true,
      accessKeyId: "S3RVER",
      secretAccessKey: "S3RVER",
      endpoint: new AWS.Endpoint("http://127.0.0.1:4569"),
      s3BucketEndpoint: true,
    });
  } else {
    s3bucket = new AWS.S3({
      accessKeyId: IAM_USER_KEY,
      secretAccessKey: IAM_USER_SECRET,
    });
  }
  return s3bucket;
}

const BUCKET_NAME: string = AWS_CONFIG.BUCKET_NAME;
let s3bucket: AWS.S3 = getS3Bucket();

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

export function downloadFromS3(fileName: string): Promise<any> {
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
  };

  return new Promise((resolve, reject) => {
    s3bucket.getObject(params, function(err, data) {
      if (err) {
        return reject(err);
      }
      return resolve(data.Body.toString());
    });
  });
}
