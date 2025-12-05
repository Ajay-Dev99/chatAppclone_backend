const { Server } = require("socket.io");
const { handleJoinRoom, handleSendMessage } = require("../controllers/socketController.js/socketControllers");
const User = require("../model/userModel");
const Connection = require("../model/connectionModel");

const initializeSocket = (server) => {
    const io = new Server(server, {
        cors: {
            origin: process.env.CLIENT_URL || "http://localhost:5173",
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true,
        },
        transports: ["websocket", "polling"],
    });

    io.on("connection", async (socket) => {
        console.log(`Socket connected: ${socket.id}`);

        // Extract authenticated user id from handshake
        const auth = socket.handshake?.auth || {};
        const userId = auth.userId;

        if (userId) {
            socket.data.userId = userId;

            try {
                // Mark user online
                await User.findByIdAndUpdate(userId, { online: true }, { new: true });

                // Join user's personal room for notifications
                socket.join(`user:${userId}`);
                console.log(`User ${userId} joined personal room and marked online`);

                // Notify all accepted connections that this user is online
                const connections = await Connection.find({
                    status: "accepted",
                    $or: [{ requester: userId }, { recipient: userId }],
                }).lean();

                connections.forEach((conn) => {
                    const otherUserId =
                        conn.requester.toString() === userId.toString()
                            ? conn.recipient.toString()
                            : conn.requester.toString();

                    io.to(`user:${otherUserId}`).emit("user:online", {
                        userId,
                        online: true,
                    });
                });
            } catch (err) {
                console.error("Error updating user online status on connect:", err);
            }
        }

        socket.on("join:room", async (data, ack) => {
            console.log("join:room", data);

            const response = await handleJoinRoom(data);

            if (!response.success) {
                if (typeof ack === "function") {
                    ack({ success: false, error: response.message });
                }
                return;
            }

            const roomId = response.room._id.toString();
            socket.join(roomId);

            const payload = {
                success: true,
                roomId,
                room: response.room,
            };

            socket.emit("join:room:ack", payload);

            if (typeof ack === "function") {
                ack(payload);
            }
        });

        socket.on("leave:room", (roomId) => {
            if (!roomId) return;
            socket.leave(roomId);
        });

        socket.on("chat:message", async (payload = {}, ack) => {
            const { roomId, content, senderId, receiverId, tempId, type } = payload;

            console.log("Received chat message:", {
                roomId,
                content,
                senderId,
                receiverId,
                tempId,
                type,
                socketId: socket.id,
            });

            // Save message to database
            const result = await handleSendMessage({
                roomId,
                content,
                senderId,
                receiverId,
                tempId,
                type
            });

            if (!result.success) {
                console.error("Failed to save message:", result.message);
                if (typeof ack === "function") {
                    ack({
                        success: false,
                        error: result.message,
                        tempId
                    });
                }
                return;
            }

            // Broadcast to all users in the room (including sender for other devices)
            io.to(roomId).emit("chat:message:receive", {
                success: true,
                message: result.data,
                tempId
            });

            // Send acknowledgment to sender
            if (typeof ack === "function") {
                ack({
                    success: true,
                    message: result.data,
                    tempId
                });
            }
        });

        // Typing indicators
        socket.on("typing:start", (data) => {
            const { roomId, userId, userName } = data;
            if (!roomId || !userId) return;

            console.log(`User ${userName} started typing in room ${roomId}`);

            // Broadcast to all other users in the room (not sender)
            socket.to(roomId).emit("typing:start", {
                roomId,
                userId,
                userName
            });
        });

        socket.on("typing:stop", (data) => {
            const { roomId, userId } = data;
            if (!roomId || !userId) return;

            console.log(`User ${userId} stopped typing in room ${roomId}`);

            // Broadcast to all other users in the room (not sender)
            socket.to(roomId).emit("typing:stop", {
                roomId,
                userId
            });
        });

        // Connection request events
        socket.on("connection:request", (data) => {
            const { recipientId, request } = data;
            if (!recipientId) return;

            console.log(`Connection request sent to ${recipientId}`);

            // Emit to recipient's room (using their userId as room)
            io.to(`user:${recipientId}`).emit("connection:request:received", {
                request
            });
        });

        socket.on("connection:accepted", (data) => {
            const { requesterId, connection } = data;
            if (!requesterId) return;

            console.log(`Connection accepted by ${socket.auth?.userId} for ${requesterId}`);

            // Notify the original requester
            io.to(`user:${requesterId}`).emit("connection:accepted", {
                connection
            });
        });

        socket.on("connection:rejected", (data) => {
            const { requesterId, connectionId } = data;
            if (!requesterId) return;

            console.log(`Connection rejected for ${requesterId}`);

            // Notify the original requester
            io.to(`user:${requesterId}`).emit("connection:rejected", {
                connectionId
            });
        });

        socket.on("disconnect", async (reason) => {
            console.log(`Socket disconnected: ${socket.id} - ${reason}`);

            const disconnectedUserId = socket.data?.userId;
            if (!disconnectedUserId) return;

            try {
                // Mark user offline and update last seen
                await User.findByIdAndUpdate(disconnectedUserId, {
                    online: false,
                    lastSeen: new Date(),
                });

                // Notify accepted connections that this user went offline
                const connections = await Connection.find({
                    status: "accepted",
                    $or: [{ requester: disconnectedUserId }, { recipient: disconnectedUserId }],
                }).lean();

                connections.forEach((conn) => {
                    const otherUserId =
                        conn.requester.toString() === disconnectedUserId.toString()
                            ? conn.recipient.toString()
                            : conn.requester.toString();

                    io.to(`user:${otherUserId}`).emit("user:offline", {
                        userId: disconnectedUserId,
                        online: false,
                    });
                });
            } catch (err) {
                console.error("Error updating user online status on disconnect:", err);
            }
        });
    });

    return io;
};

module.exports = initializeSocket;

