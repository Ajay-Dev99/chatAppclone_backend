const { Server } = require("socket.io");

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    io.on("connection", (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        socket.on("join:room", (roomId) => {
            if (!roomId) return;
            socket.join(roomId);
            socket.emit("join:room:ack", roomId);
        });

        socket.on("leave:room", (roomId) => {
            if (!roomId) return;
            socket.leave(roomId);
        });

        socket.on("disconnect", (reason) => {
            console.log(`Socket disconnected: ${socket.id} - ${reason}`);
        });
    });

    return io;
};

module.exports = initializeSocket;

