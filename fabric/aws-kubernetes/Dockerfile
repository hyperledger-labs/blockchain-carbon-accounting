FROM node:14-alpine
RUN apk update && apk add python3 make g++

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH="/home/node/.npm-global/bin:${PATH}"

RUN mkdir -p /typescript_app/node_modules
RUN chown -R node:node /typescript_app

# Create Directory for the Container
WORKDIR /typescript_app

# Only copy the package.json file to work directory
COPY --chown=node:node ./typescript_app/package.json .
COPY --chown=node:node ./typescript_app/tsconfig.json .
COPY --chown=node:node ./typescript_app/*.js ./

USER node
# Install all Packages
RUN npm install

RUN npm install -g nodemon
RUN npm install -g serverless
RUN npm install -g typescript
RUN npm install -g mocha

# Copy all other source code to work directory
ADD --chown=node:node ./typescript_app/src /typescript_app/src

RUN npm run-script buildtsc

EXPOSE 9000

CMD ["npm", "run-script", "start"]
