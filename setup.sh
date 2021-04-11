#!/bin/bash

#install npm package for the server
echo "Installing server npm packages..."
npm install

# Compile TypeScript files
echo "Compiling TypeScript files ..."
tsc

# init database and prisma client
if [ ! -d "./prisma/database" ]; then
    echo "Creating database and Prisma Client..."
    npx prisma migrate dev --name init
fi

# install npm packages for the client
echo "Installing Web app npm packages..."
cd "./web" && npm install

# build the client
echo "Building web app..."
npm run build