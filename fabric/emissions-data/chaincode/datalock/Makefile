# ==============================================================================
# Project

test:
	go test internal/*.go -count=1

coverage:
		go test internal/*.go -count=1 -coverprofile /tmp/cover.out
		go tool cover -html=/tmp/cover.out

lint:
	golangci-lint run

fix-lint:
	golangci-lint run --fix

tidy:
	go mod tidy

docker:
	docker build . -t zzocker20/datalock-chaincode:0.0.1

docker-push:
	docker push zzocker20/datalock-chaincode:0.0.1