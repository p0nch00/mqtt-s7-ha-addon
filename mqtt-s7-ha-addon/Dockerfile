FROM node:slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY bin/package*.json ./
RUN npm install --only=production

# Bundle app source
COPY bin/* ./

# Create a symlink to Home Assistant's /data/config.json
RUN ln -s /data/config.json /usr/src/app/config.json

# Start CMD
CMD ["./run.sh"]
