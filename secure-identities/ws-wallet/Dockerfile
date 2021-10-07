FROM node:12.13.0-alpine as build
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package.json /app/package.json

RUN npm install

COPY ./*.ts /app/*.ts
COPY tsconfig.json /app/tsconfig.json
COPY tslint.json /app/tslint.json

RUN npm run build

FROM node:12.13.0-alpine
WORKDIR /app
COPY --from=build /app/dist /app
COPY --from=build /app/node_modules /app/node_modules
RUN ls

EXPOSE 8080
#RUN npm run start
CMD [ "node", "dist/app.js" ]