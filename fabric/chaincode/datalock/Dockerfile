FROM golang:1.18-alpine AS build

WORKDIR /datalock
COPY go.mod .
COPY go.sum .
RUN go mod download

COPY . .

RUN go build -o datalock

FROM alpine:3 as prod

COPY  --from=build /datalock/datalock /datalock

CMD [ "/datalock" ]
