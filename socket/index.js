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
            console.log("join:room", roomId);
            if (!roomId) return;
            socket.join(roomId);
            socket.emit("join:room:ack", roomId);
        });

        socket.on("leave:room", (roomId) => {
            if (!roomId) return;
            socket.leave(roomId);
        });

        socket.on("chat:message", (payload = {}, ack) => {
            const { roomId, content, senderId, receiverId, tempId } = payload;

            if (!roomId || !content || !senderId) {
                console.warn("chat:message missing fields", payload);
                if (typeof ack === "function") {
                    ack({ success: false, error: "Invalid message payload" });
                }
                return;
            }

            console.log("Received chat message:", {
                roomId,
                content,
                senderId,
                receiverId,
                tempId,
                socketId: socket.id,
            });

            socket.to(roomId).emit("chat:message:receive", {
                roomId,
                content,
                senderId,
                receiverId,
                tempId,
                createdAt: new Date().toISOString(),
            });

            if (typeof ack === "function") {
                ack({ success: true });
            }
        });

        socket.on("disconnect", (reason) => {
            console.log(`Socket disconnected: ${socket.id} - ${reason}`);
        });
    });

    return io;
};

module.exports = initializeSocket;

