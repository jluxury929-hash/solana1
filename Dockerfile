# ------------------------------------
# 1. BUILD STAGE: Installs dependencies and compiles TypeScript
# ------------------------------------
FROM docker.io/library/node:18-alpine AS build

WORKDIR /app

# ... (Previous steps like copying package.json and running npm install)

# Install Node.js dependencies
RUN npm install

# --- CRITICAL FIX SECTION ---
# This step was missing or misplaced in your failing build.
# It copies the 'src' folder (your code) and tsconfig.json 
# into the Docker container's current working directory (/app).
COPY src ./src
COPY tsconfig.json ./
# --- CRITICAL FIX SECTION END ---

# Build the TypeScript project (Do NOT delete this!)
# This now finds the files in ./src and compiles them to ./dist
RUN npm run build
