# Chat Application

A simple chat app made in react and that uses express, socket.io, endcrypt and peer.js for providing video calling service and End-to-End encrypted chat facility. 

DISCLAIMER: The webapp only works in desktop environment and does not guarantee quality experience on smart phone.

To setup the app follow the provided steps below.

1. Pre-requisites

   1. Should have NodeJS v10.19.0 or above installed.
   2. Should have NPM v6.14.4 or above installed

2. Install Steps.

   1. Their is two scripts to set everything up, you can use the `setup.ps1` for `Windows` and `setup.sh` for `linux`

   2. OR manually follow the steps in the project directory

      1. Install server dependencies

         ```shell
         npm install
         ```

      2. Compile source code

         ```shell
         npm run build
         ```

      3. Initialize database and prisma client

         ```shell
         npx prisma migrate dev --name init
         ```

      4. Install client dependencies

         ```shell
         cd ./web
         npm install
         ```

      5. Build production web client

         ```shell
         npm run build
         ```

3. Running steps

   1. Run this command in the root of the project

      ```shell
      npm start
      ```

   2.  Open `http://localhost:8000` in the browser.

   
