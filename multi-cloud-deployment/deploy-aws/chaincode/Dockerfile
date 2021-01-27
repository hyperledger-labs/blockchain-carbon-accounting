# This image is a microservice in golang for the Degree chaincode
FROM golang:1.14.6-alpine AS build

COPY ./ /go/src/github.com/marbles
WORKDIR /go/src/github.com/marbles

# Build application
RUN go build -o chaincode -v .

# Production ready image
# Pass the binary to the prod image
FROM alpine:3.11 as prod

COPY --from=build /go/src/github.com/marbles/chaincode /app/chaincode

USER 1000

WORKDIR /app
CMD ./chaincode