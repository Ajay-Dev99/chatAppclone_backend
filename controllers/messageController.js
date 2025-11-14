const Message = require("../model/messageModel");
const Room = require("../model/roomModel");
const mongoose = require("mongoose");

const getMessages = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { roomId } = req.params;
        const { cursor, limit = 20 } = req.query;
        const userId = req.user._id;

        // Validate roomId
        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID"
            });
        }


        let messageLimit = parseInt(limit);
        if (isNaN(messageLimit) || messageLimit < 1) {
            messageLimit = 20;
        }
        if (messageLimit > 50) {
            messageLimit = 50;
        }

        if (cursor && !mongoose.Types.ObjectId.isValid(cursor)) {
            return res.status(400).json({
                success: false,
                message: "Invalid cursor"
            });
        }

        const room = await Room.findById(roomId)
            .select("participants type")
            .lean();

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }


        const isParticipant = room.participants.some(
            participantId => participantId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not a participant in this room"
            });
        }


        const query = { room: roomId };

        if (cursor) {
            query._id = { $lt: cursor };
        }


        const messages = await Message.find(query)
            .select("-__v") // Exclude version key
            .sort({ createdAt: -1, _id: -1 }) // Sort by newest first, _id as tiebreaker
            .limit(messageLimit + 1) // Fetch one extra to determine if there are more
            .populate("sender", "name email profilePicture") // Populate sender info
            .populate("receiver", "name email profilePicture") // Populate receiver if exists
            .lean(); // Convert to plain JS objects for better performance

        // Check if there are more messages
        const hasMore = messages.length > messageLimit;

        // Remove the extra message if it exists
        if (hasMore) {
            messages.pop();
        }

        // Get the cursor for the next page (last message's ID)
        const nextCursor = messages.length > 0
            ? messages[messages.length - 1]._id.toString()
            : null;

        // Reverse messages to show oldest first in the response
        // (Frontend can decide to reverse again if needed)
        const orderedMessages = messages.reverse();

        return res.status(200).json({
            success: true,
            data: {
                messages: orderedMessages,
                pagination: {
                    hasMore,
                    nextCursor,
                    limit: messageLimit,
                    count: orderedMessages.length
                }
            }
        });

    } catch (error) {
        console.error("Error fetching messages:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch messages",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

/**
 * Get unread message count for a room
 * @route GET /api/v1/messages/:roomId/unread-count
 */
const getUnreadCount = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { roomId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID"
            });
        }

        // Verify user is in the room
        const room = await Room.findById(roomId).select("participants").lean();

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        const isParticipant = room.participants.some(
            participantId => participantId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not a participant in this room"
            });
        }

        // Count unread messages (messages not in readBy array for this user)
        const unreadCount = await Message.countDocuments({
            room: roomId,
            sender: { $ne: userId }, // Not sent by current user
            readBy: { $ne: userId } // Not in readBy array
        });

        return res.status(200).json({
            success: true,
            data: {
                roomId,
                unreadCount
            }
        });

    } catch (error) {
        console.error("Error fetching unread count:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch unread count",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

/**
 * Mark messages as read
 * @route PATCH /api/v1/messages/:roomId/mark-read
 */
const markMessagesAsRead = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized"
            });
        }

        const { roomId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(roomId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid room ID"
            });
        }

        // Verify user is in the room
        const room = await Room.findById(roomId).select("participants").lean();

        if (!room) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        const isParticipant = room.participants.some(
            participantId => participantId.toString() === userId.toString()
        );

        if (!isParticipant) {
            return res.status(403).json({
                success: false,
                message: "You are not a participant in this room"
            });
        }

        // Update all unread messages in this room
        const result = await Message.updateMany(
            {
                room: roomId,
                sender: { $ne: userId },
                readBy: { $ne: userId }
            },
            {
                $addToSet: { readBy: userId },
                $set: { status: "read" }
            }
        );

        return res.status(200).json({
            success: true,
            data: {
                roomId,
                messagesMarkedAsRead: result.modifiedCount
            }
        });

    } catch (error) {
        console.error("Error marking messages as read:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to mark messages as read",
            error: process.env.NODE_ENV === "development" ? error.message : undefined
        });
    }
};

module.exports = {
    getMessages,
    getUnreadCount,
    markMessagesAsRead
};

