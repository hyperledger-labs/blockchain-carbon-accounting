FROM node:18-alpine as build

WORKDIR /app


COPY package.json .
RUN npm install

COPY tsconfig.json .
COPY src /app/src

RUN npm run build

FROM node:18-alpine
WORKDIR /app

COPY --from=build /app/dist /app
COPY --from=build /app/node_modules /app/node_modules
WORKDIR /app

CMD [ "node","./index.js" ]
