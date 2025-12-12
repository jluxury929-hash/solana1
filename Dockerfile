# ------------------------------------
# 1. BUILD STAGE: Installs dependencies and compiles TypeScript
# ------------------------------------
# Using the node:18-alpine base image
FROM docker.io/library/node:18-alpine AS build

# Set the working directory for all subsequent commands
WORKDIR /app

# 1. Copy package files first to leverage Docker layer caching.
# FIX: Removing 'package-lock.json' as requested.
COPY package.json ./ 

# 2. Install Git (FIX for 'ENOENT: syscall spawn git' error)
# Required for any dependencies that pull from git or rely on native compilation tools.
RUN apk add --no-cache git

# 3. Install Node.js dependencies
# Note: npm will use the package.json to determine versions, 
# but the build reproducibility is lower without a lock file.
RUN npm install

# 4. Copy all source files and config (tsconfig.json) into the container's root working directory (/app)
# Assumes all files are in the local root (per your previous statement).
COPY tsconfig.json ./
COPY . /app

# 5. Build the TypeScript project (Do NOT remove this)
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

# Command to run the bot when the container starts
CMD ["node", "./dist/index.js"]
