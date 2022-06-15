# !/bin/bash


echo "[default]
aws_access_key_id = test
aws_secret_access_key = test" | tee credentials

docker exec -w /root locals3 mkdir .aws
docker cp credentials locals3:/root/.aws/credentials

SUCCESS=1
while [ $SUCCESS -eq 1 ];do
docker exec locals3 aws --endpoint-url=http://localhost:4566 s3 mb s3://local-bucket
SUCCESS=$(echo $?)
done

rm credentials