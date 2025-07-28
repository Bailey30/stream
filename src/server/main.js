import express from "express";
import dotenv from "dotenv";
import { createServer } from "node:http";
import ViteExpress from "vite-express";
import ServerSocket from "../server/serverSocket.js";

dotenv.config();

const app = express();
const server = createServer(app);

app.use((err, req, res, next) => {
  console.error("error:", err.stack);
  res.status(500).send("Something broke!");
});

new ServerSocket(server);

server.listen(3000, () => console.log("Server is listening on port 3000..."));
ViteExpress.bind(app, server);
