# Use a lightweight and secure Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker's cache
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for compilation)
RUN npm install

# Copy the rest of the application code
COPY . .

# Compile TypeScript into JavaScript using our new script
RUN npm run build

# Now, we can prune the dev dependencies to keep the final image small
RUN npm prune --production

# Expose the port the app will run on
EXPOSE 8000

# The command to run the application from the compiled 'dist' folder
CMD [ "node", "dist/server.js" ]