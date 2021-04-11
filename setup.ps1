# install npm packages for the server
Write-Output "Installing server npm packages..."
npm "install"

# Compile TypeScript files
Write-Output "Compining typeScript files..."
tsc

# init database and prisma client
if(!(Test-Path "./prisma/database")){
    Write-Output "Creating database and Prisma Client..."
    npx prisma migrate dev --name init
}

# install npm packages for the client
Write-Output "Installing Web app npm packages..."
Push-Location "./web"
npm install
Pop-Location

# build the client
Write-Output "Building web app..."
npm run "build:web-app"