FROM node:12.13.0-alpine as build
RUN apk add --update python3 py3-pip

WORKDIR /app

COPY package.json /app/package.json
RUN npm install

COPY tsconfig.json /app/tsconfig.json
COPY src /app/src
COPY app.ts /app/app.ts
COPY swagger.json /app/swagger.json

RUN npm run build

FROM node:12.13.0-alpine
WORKDIR /app

COPY --from=build /app/dist /app
COPY --from=build /app/node_modules /app/node_modules
RUN ls

CMD [ "node","./app.js" ]