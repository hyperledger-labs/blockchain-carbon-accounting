FROM node:18-alpine AS base

WORKDIR /project

FROM base AS dependencies

# We only copy the dependencies we need
COPY app/api-oracle/src app/api-oracle/src
COPY app/api-oracle/package.json app/api-oracle/package.json
COPY app/api-oracle/tsconfig.json app/api-oracle/tsconfig.json
COPY app/api-oracle/dist app/api-oracle/dist

COPY data/package.json data/package.json
COPY data/tsconfig.json data/tsconfig.json
COPY data/src data/src
COPY data/index.ts data/index.ts
COPY data/dist data/dist
COPY lib/ lib/

COPY app/api-server app/api-server
COPY app/frontend/contracts app/frontend/contracts

# The global package.json only contains build dependencies
COPY package.json .

RUN npm install

RUN npm run build

EXPOSE 3002
CMD ["npm", "run", "api-oracle:prod" ]