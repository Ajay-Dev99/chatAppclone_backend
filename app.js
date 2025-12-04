require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");

const connectDB = require("./config/Dbconnection");
const router = require("./router");
const initializeSocket = require("./socket");

const app = express();
const server = http.createServer(app);

connectDB();

app.use(
    cors({
        origin: ["https://whatsapp-clone-silk-rho.vercel.app", process.env.CLIENT_URL || "http://localhost:5173"],
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
);
app.use(express.json());

app.use("/api", router);

app.use("/", (req, res) => {
    res.send("backend is running and hosted successfully");
});

const PORT = process.env.PORT || 3000;

const io = initializeSocket(server);
app.set("io", io);

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});