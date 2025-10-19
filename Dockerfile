# Use a lightweight and secure Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker's cache
COPY package*.json ./

# Install ALL dependencies
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript into JavaScript
RUN npm run build

# Prune the dev dependencies to keep the final image small
RUN npm prune --production

# Expose the port the app will run on
EXPOSE 8000

# The command to run the final, compiled application
CMD [ "node", "dist/server.js" ]