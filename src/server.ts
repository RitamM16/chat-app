import express from "express";
import { Server } from "socket.io";
import http from "http";
import bodyParser from "body-parser";
import { login, signup } from "./routes/auth";
import cors from "cors";
import { rootSocketRoute } from "./socket events/root";
import { ExpressPeerServer } from "peer";
import path from "path";

const PORT = process.env.PORT || 8000;

const BUILD_DIR = path.join(__dirname,"../web","build")

//Setting up express app
const app = express();

//Adding middlewares
app.use(bodyParser.json());
app.use(cors())
app.use(express.static(BUILD_DIR))


//Creating a shared server from express app
const server = http.createServer(app);

//Initializing socket server
export const io = new Server(server);

//On new socket connection
io.on("connection", rootSocketRoute)

//Returns the index.html of the react production build
app.get('/', (req,res) => {
    res.sendFile(path.join(BUILD_DIR,"index.html"))
})

app.post("/signup", signup)

app.post("/login", login)

//Peer Server
const peerServer = ExpressPeerServer(server, {
    path: "/call"   
})

//Add peerServer
app.use(peerServer);

//For any other traffic return index.html
app.get('*', (req,res) =>{
    res.sendFile(path.join(BUILD_DIR,"index.html"));
});

//Peer server 
peerServer.on("connection", (peer) => {
    console.log("Peer connected with id:", peer.getId());
})


//Setting up Listener
function startServer(){
    server.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
}

startServer();