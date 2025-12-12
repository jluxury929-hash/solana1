# ------------------------------------
# 1. BUILD STAGE: Installs dependencies and compiles TypeScript
# ------------------------------------
FROM docker.io/library/node:18-alpine AS build

# Set the working directory for all subsequent commands
WORKDIR /app

# The base image (node:18-alpine) usually has yarn, 
# so we remove the redundant 'RUN npm install -g yarn' step.

# Copy package files first to leverage Docker layer caching.
# This ensures 'npm install' only reruns if package.json changes.
COPY package.json package-lock.json ./

# Install Git (FIX for 'ENOENT: syscall spawn git' error)
# One or more of your npm packages needs 'git' during installation.
RUN apk add --no-cache git

# Install Node.js dependencies
RUN npm install

# Copy all source files into the container
# (FIX for 'TS18003: No inputs were found' error)
COPY src ./src
COPY tsconfig.json ./

# Build the TypeScript project
# This compiles .ts files in /app/src into .js files in /app/dist
RUN npm run build


# ------------------------------------
# 2. PRODUCTION STAGE: Creates a minimal image for running the bot
# ------------------------------------
FROM docker.io/library/node:18-alpine AS production

# Set environment variables for production
ENV NODE_ENV=production

# Set the working directory for the final running process
WORKDIR /app

# Only copy the essential files needed at runtime:
# 1. package.json (for start command)
# 2. node_modules (pre-installed dependencies)
# 3. The compiled JavaScript code (.js files in /dist)
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# NOTE: The .env file must NOT be copied here. 
# Secrets (like private keys and RPC URLs) should be passed 
# as environment variables when running the container (e.g., using -e or Docker Secrets).

# Command to run the bot when the container starts
CMD ["node", "./dist/index.js"]
