FROM golang:1.16.5-alpine3.14 as build

WORKDIR /chaincode
COPY go.mod go.mod
COPY go.sum go.sum

RUN go mod download

COPY . .
RUN go build -o requestCC

FROM alpine

COPY  --from=build /chaincode/requestCC /chaincode/requestCC

CMD [ "/chaincode/requestCC" ]