FROM node:10-alpine
RUN apk update && apk add python make g++

ENV NPM_CONFIG_PREFIX=/home/node/.npm-global
ENV PATH="/home/node/.npm-global/bin:${PATH}"

RUN mkdir -p /typescript_app/node_modules
RUN chown -R node:node /typescript_app

# Create Directory for the Container
WORKDIR /typescript_app

# Only copy the package.json file to work directory
COPY --chown=node:node ./package.json .
COPY --chown=node:node ./tsconfig.json .
COPY --chown=node:node ./*.ts ./
COPY --chown=node:node ./*.js ./
COPY --chown=node:node ./*.sh ./
COPY --chown=node:node ./swagger.json .

USER node
# Install all Packages
RUN npm install

RUN npm install -g nodemon
RUN npm install -g serverless
RUN npm install -g typescript
RUN npm install -g mocha

# Copy all other source code to work directory
ADD --chown=node:node ./src /typescript_app/src

EXPOSE 9000

CMD [ "sh", "start.sh"]
