# This image is a microservice in nodejs for the  utility-emissions chaincode
# ARG NODE_VER=12.13.0
FROM node:12.13.0-alpine

# Update and add packages
RUN apk add --no-cache \
	libltdl \
	rsync \
	nano \
	joe \
	less \
    busybox-extras

RUN mkdir -p /chaincode/input
RUN mkdir -p /chaincode/output
# Copy chaincode source dir to container
COPY ./ledger-api /chaincode/input/ledger-api
COPY ./lib /chaincode/input/lib
COPY ./index_ext.js /chaincode/input/
COPY ./package.json /chaincode/input/

# Installs npm packages
RUN cp -R /chaincode/input/* /chaincode/output/
WORKDIR /chaincode/output
RUN npm install

# Copy chaincode with node_modules to workdir
RUN cp -R /chaincode/output/. /usr/local/src
WORKDIR /usr/local/src

# Start chaincode server
CMD [ "npm", "run", "start_ext" ]
