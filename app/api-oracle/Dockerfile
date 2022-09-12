FROM node:18-alpine AS base

WORKDIR /project

FROM base AS dependencies

# We only copy the dependencies we need
COPY app/api-oracle/postgresApi.ts app/api-oracle/postgresApi.ts
COPY app/api-oracle/package.json app/api-oracle/package.json
COPY app/api-oracle/tsconfig.json app/api-oracle/tsconfig.json
COPY data/package.json data/package.json
COPY data/src data/src
COPY lib/emissions_data lib/emissions_data
COPY lib/data-common lib/data-common
COPY lib/oil-and-gas-data lib/oil-and-gas-data

# The global package.json only contains build dependencies
COPY package.json .

RUN npm install

RUN npm run build

EXPOSE 3002
CMD [ "npm", "run", "api-oracle" ]