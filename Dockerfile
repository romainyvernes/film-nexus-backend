# Use a Node.js base image
FROM node:alpine as deps

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install app dependencies
RUN npm ci --production && npm cache clean --force

# Create build
RUN npm run build

# Copy the rest of the application code to the working directory
COPY . .

# Expose the ports for Express, PostgreSQL, and Redis
EXPOSE 5000
EXPOSE 5432
EXPOSE 6379

# Specify the command to start the container
CMD [ "node", "dist-server/bin/www.js" ]
