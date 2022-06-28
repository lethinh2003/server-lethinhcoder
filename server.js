const mongoose = require("mongoose");
const dotenv = require("dotenv");
const SocketServices = require("./services/chat.service");

const http = require("http");

const app = require("./app");

const server = http.createServer(app);

process.on("uncaughtException", (err) => {
  console.log("UNCAUGHT EXCEPTION! 💥 Shutting down...");
  console.log("Error: ", err);
  console.log(err.name, err.message);
  process.exit(1);
});
dotenv.config({ path: "./config.env" });

const DB = process.env.DATABASE;
mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("DB connected");
  });

const port = process.env.PORT || 8081;
const io = require("socket.io")(server, {
  cors: {
    origin: process.env.ENDPOINT_CLIENT,
  },
});
global._io = io;
global._io.on("connection", SocketServices.connection);

server.listen(port, () => {
  console.log("Server đang chay tren cong", port);
});
process.on("unhandledRejection", (err) => {
  console.log("UNHANDLED REJECTION! 💥 Shutting down...");
  console.log("Error: ", err);
  console.log(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});
