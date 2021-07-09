#!/bin/bash
echo "Starting local S3..."
#docker exec -it api serverless s3 start --address 0.0.0.0
docker exec -it api serverless s3 start --address 127.0.0.1