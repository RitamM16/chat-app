# install npm packages of the server
if(!(Test-Path "./node_modules")){
    npm "install"
}

# Compile TypeScript files
if(!(Test-Path "./dist")){
    tsc
}

# init database and prisma client
if(!(Test-Path "./prisma/database")){
    npx "prisma migrate dev --name init"
}

# install npm packages of the client
if(!(Test-Path "./web/node_modules")){
    npm "install --prefix web"
}

# build the client
if(!(Test-Path "./web/build")){
    npm "run build --prefix web"
}