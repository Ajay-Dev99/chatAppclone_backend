require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");

const connectDB = require("./config/Dbconnection");
const router = require("./router");
const initializeSocket = require("./socket");

const app = express();

// Connect to database
connectDB();

// CORS configuration
app.use(
    cors({
        origin: [
            "https://whatsapp-clone-silk-rho.vercel.app",
            process.env.CLIENT_URL,
            "http://localhost:5173"
        ].filter(Boolean),
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    })
);

app.use(express.json());

// API routes
app.use("/api", router);

// Health check
app.get("/", (req, res) => {
    res.json({ status: "ok", message: "Backend is running" });
});

// Only start server if NOT running on Vercel (local development)
if (!process.env.VERCEL) {
    const server = http.createServer(app);
    const io = initializeSocket(server);
    app.set("io", io);

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}

// Export for Vercel serverless
module.exports = app;
