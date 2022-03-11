FROM golang:1.16.5-alpine3.14 as build

WORKDIR /datalock
COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .

RUN go build -o datalock

FROM alpine

COPY  --from=build /datalock/datalock /datalock

CMD [ "/datalock" ]