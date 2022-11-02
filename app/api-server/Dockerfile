FROM node:18-bullseye-slim as build
ENV DEBIAN_FRONTEND=noninteractive

WORKDIR /app

# We only copy the dependencies we need
COPY app/api-server app/api-server

COPY data/package.json data/package.json
COPY data/tsconfig.json data/tsconfig.json
COPY data/src data/src
COPY data/index.ts data/index.ts
COPY data/dist data/dist
COPY lib/ lib/

COPY app/frontend/contracts app/frontend/contracts

# The global package.json only contains build dependencies
COPY package.json .

RUN npm install

RUN npm run build

EXPOSE 8000
CMD ["npm", "run", "api-server:prod" ]