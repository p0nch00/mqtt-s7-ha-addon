FROM node:slim

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY bin/package*.json ./
RUN npm install --only=production

# Bundle app source
COPY bin/* ./

COPY run.sh /run.sh
RUN chmod +x /run.sh

# Start CMD
CMD ["./run.sh"]
