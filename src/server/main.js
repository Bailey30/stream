import express from "express";
import dotenv from "dotenv";
import { createServer } from "node:http";
import ViteExpress from "vite-express";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import ServerSocket from "../server/serverSocket.js";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

app.use((err, req, res, next) => {
  console.error("error:", err.stack);
  res.status(500).send("Something broke!");
});

new ServerSocket(server);

server.listen(3000, () => console.log("Server is listening on port 3000..."));
ViteExpress.bind(app, server);
