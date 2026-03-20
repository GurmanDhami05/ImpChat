import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import { setupSocket } from "./socket.js";

const app = express();
app.use(cors());

app.use(express.static("../client/"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

setupSocket(io);

server.listen(3000, () => {
  console.log("Server is running on prot 3000");
});
