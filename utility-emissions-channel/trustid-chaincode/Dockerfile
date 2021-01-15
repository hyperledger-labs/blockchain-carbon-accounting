# This image is a microservice in golang for the Degree chaincode
FROM golang:1.13.8-alpine AS build

COPY ./ /go/src/github.com/coren-identitycc
WORKDIR /go/src/github.com/coren-identitycc

# Build application
RUN go build -o chaincode -v .

# Production ready image
# Pass the binary to the prod image
FROM alpine:3.11 as prod

COPY --from=build /go/src/github.com/coren-identitycc/chaincode /app/chaincode

USER 1000

WORKDIR /app
CMD ./chaincode
