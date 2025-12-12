# ------------------------------------
# 1. BUILD STAGE
# ------------------------------------
FROM docker.io/library/node:18-alpine AS build

WORKDIR /app

# Copy package files (These are in the root directory)
COPY package.json package-lock.json ./

# Install Git and Dependencies
RUN apk add --no-cache git
RUN npm install

# --- CRITICAL FIX SECTION ---
# Copy ALL source files from the root context into /app
# This includes all .ts files and tsconfig.json
COPY . . 
# --- CRITICAL FIX SECTION END ---

# Build the TypeScript project
RUN npm run build 
# ... (rest of the file)
