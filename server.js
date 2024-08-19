const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const mongoose = require("mongoose");
const { readdirSync } = require("fs");
const path = require("path");

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(
  http,
  {
    path: "/socket.io",
    cors: {
      origin: [
        "http://localhost:3000",
        "https://connect-buzz-backend.onrender.com",
      ],
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-type"],
      credentials: true,
    },
  }
);

const port = process.env.PORT || 8000;

require("dotenv").config();

// Database Connection
// DB=mongodb://localhost:27017/new_project
mongoose
  .connect(process.env.DB)
  .then(() => console.log("DataBase Connected"))
  .catch((err) => console.log("DataBase Connection Error =>", err));

// Middlewares
app.use(morgan("combined"));
app.use(
  express.json({
    limit: "5mb",
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "https://connect-buzz-backend.onrender.com",
    ],
    methods: ["GET", "PUT", "POST", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true, // if you're using cookies or other credentials
  })
);

// Autolaod routes
const routes = readdirSync("./routes");
routes.forEach((route) => {
  const routePath = `./routes/${route}`;
  app.use("/api", require(routePath));
});
// .map((r) => app.use("/api", require(`./routes ${r}`)))
// .catch((err) => console.log(err));

// Socket Io
io.on("connect", (socket) => {
  // console.log("A user connected with SocketIo Id", socket.id);
});

io.on("connect", (socket) => {
  socket.on("new-post", (newPost) => {
    // console.log("New socket IO post in console", newPost);
    socket.broadcast.emit("new-post", newPost); 
  });
});

// Server running on port
http.listen(port, () => console.log(`Server is running on Port ${port}`));
