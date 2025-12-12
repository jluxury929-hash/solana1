# Stage 1: Build the application
# Use a secure and common Node.js base image
FROM node:18-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# --- CRITICAL FIX: Install Yarn Globally ---
# This is required because the '@jito-labs/jito-ts' dependency uses 'yarn run compile' 
# in its 'prepare' script, causing the build to fail if 'yarn' is missing.
RUN npm install -g yarn 

# 1. Copy only the package files to install dependencies (for effective caching)
# This step relies on the .dockerignore file to exclude node_modules/
COPY package*.json ./

# 2. Install project dependencies
RUN npm install

# 3. Copy the rest of the source code
COPY . .

# 4. Compile the TypeScript code into JavaScript (npm run build)
RUN npm run build


# Stage 2: Final (smaller) runtime image
# Use a minimal node image for smaller deployment size
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# 1. Copy the compiled code and package files from the build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package.json ./package.json

# 2. Copy the .env file
# NOTE: For production, using secrets management (like Kubernetes Secrets or Vault)
# and mounting the .env file as a volume is safer than baking it into the image.

# 3. Install production-only dependencies
# --omit=dev ensures only necessary dependencies are installed, keeping the image small
RUN npm install --omit=dev

# 4. Expose the port used by the optional API server
EXPOSE 8080

# 5. Set the default command to start the bot
CMD ["npm", "run", "start"]
