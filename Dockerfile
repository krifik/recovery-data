# Use an official Node.js runtime as the base image
FROM node:14

# Set the working directory inside the container
# WORKDIR /app

RUN mkdir sql
RUN chmod 777 sql

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install the application dependencies
RUN npm install

# Copy the rest of the application code to the working directory
COPY . .

# Expose a port (replace 3000 with the port your app listens on)

# Define the command to run your application
CMD [ "node", "main.js" ]