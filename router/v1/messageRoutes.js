const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const {
    getMessages,
    getUnreadCount,
    markMessagesAsRead
} = require("../../controllers/messageController");

const messageRoutes = express.Router();


messageRoutes.use(authMiddleware);

messageRoutes.get("/:roomId", getMessages);
messageRoutes.get("/:roomId/unread-count", getUnreadCount);
messageRoutes.patch("/:roomId/mark-read", markMessagesAsRead);

module.exports = messageRoutes;

