FROM node:16

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 3002
# COPY . .
# COPY --from=builder /node/node_modules  /node/node_modules
# COPY --from=builder /node/package.json  /node/package.json
# COPY --from=builder /node/package-lock.json  /node/package-lock.json
CMD [ "npm","run","dev" ]
