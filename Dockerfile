# Use a lightweight and secure Node.js image
FROM node:18-alpine

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first to leverage Docker's cache
COPY package*.json ./

# --- THIS IS THE FIX ---
# Step 1: Install ALL dependencies, including the dev tools needed for building.
RUN npm install

# Copy the rest of the application code
COPY . .

# Step 2: Use the installed tools (like tsc) to build the project.
RUN npm run build

# Step 3: After building, remove the dev tools to make the final image smaller.
RUN npm prune --production
# --- END OF FIX ---

# Expose the port the app will run on
EXPOSE 8000

# The command to run the final, compiled application
CMD [ "node", "dist/server.js" ]
