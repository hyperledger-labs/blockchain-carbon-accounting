FROM node:18-bullseye-slim as build
ENV DEBIAN_FRONTEND=noninteractive
RUN apt update && apt install -y python3 python3-pip && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json .
RUN npm install

COPY tsconfig.json .
COPY src /app/src

RUN npm run build

FROM node:18-bullseye-slim
WORKDIR /app

COPY --from=build /app/dist /app
COPY --from=build /app/node_modules /app/node_modules
WORKDIR /app

CMD [ "node","./index.js" ]
