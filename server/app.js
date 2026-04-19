import express from "express";
import http from "http";
import dotenv from "dotenv";
import { Server } from "socket.io";
import cors from "cors";
import { setupSocket } from "./socket.js";

const app = express();
app.use(cors());
dotenv.config();

const PORT = process.env.PORT || 3000;

app.use(express.static("../client/"));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

setupSocket(io);

server.listen(PORT, () => {
  console.log(`Server is running on port: ${PORT}`);
});
