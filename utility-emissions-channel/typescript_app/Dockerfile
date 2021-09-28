FROM node:12.13.0-alpine as build
RUN apk add --update python3 py3-pip

WORKDIR /app

COPY package.json .
RUN npm install

COPY tsconfig.json .
COPY src /app/src

RUN npm run build

FROM node:12.13.0-alpine
WORKDIR /app

COPY --from=build /app/dist /app
COPY --from=build /app/node_modules /app/node_modules

CMD [ "node","./app.js" ]