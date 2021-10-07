// SPDX-License-Identifier: Apache-2.0
const AWS = require('aws-sdk');

module.exports.webhook = (event, context, callback) => {
    const S3 = new AWS.S3({
        s3ForcePathStyle: true,
        accessKeyId: 'S3RVER', // This specific key is required when working offline
        secretAccessKey: 'S3RVER',
        endpoint: new AWS.Endpoint('http://localhost:8000'),
    });
    S3.putObject(
        {
            Bucket: 'local-bucket',
            Key: '1234',
            Body: new Buffer('abcd'),
        },
        () => {},
    );
};

module.exports.s3hook = (event, context) => {
    console.log(JSON.stringify(event));
    console.log(JSON.stringify(context));
    console.log(JSON.stringify(process.env));
};
