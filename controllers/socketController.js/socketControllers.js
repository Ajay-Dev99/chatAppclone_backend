const Room = require("../../model/roomModel");
const Message = require("../../model/messageModel");
const mongoose = require("mongoose");

const handleJoinRoom = async (data) => {

    try {
        const { userId, chatUserId } = data;

        console.log("userId", userId);
        console.log("chatUserId", chatUserId);

        if (!userId || !chatUserId) {
            return { success: false, message: "User ID and Chat User ID are required" };
        }

        const room = await Room.findOne({
            type: "direct",
            participants: { $all: [userId, chatUserId] },
        });
        console.log("room found", room);

        if (!room) {
            const newRoom = new Room({
                type: "direct",
                participants: [userId, chatUserId],
                createdBy: userId,
            })

            await newRoom.save();
            return { success: true, message: "Room created", room: newRoom };
        }

        return { success: true, message: "Room found", room };
    } catch (error) {
        console.log(error);
        return { success: false, message: "Internal server error" };
    }


}

const handleSendMessage = async (data) => {
    try {
        const { roomId, content, senderId, receiverId, tempId, type = "text" } = data;

        // Validation
        if (!roomId || !content || !senderId) {
            return {
                success: false,
                message: "Room ID, content, and sender ID are required",
                tempId
            };
        }

        // Validate ObjectIds
        if (!mongoose.Types.ObjectId.isValid(roomId) || !mongoose.Types.ObjectId.isValid(senderId)) {
            return {
                success: false,
                message: "Invalid room or sender ID",
                tempId
            };
        }

        // Check if room exists
        const room = await Room.findById(roomId);
        if (!room) {
            return {
                success: false,
                message: "Room not found",
                tempId
            };
        }

        // Verify sender is a participant
        const isParticipant = room.participants.some(
            participantId => participantId.toString() === senderId.toString()
        );

        if (!isParticipant) {
            return {
                success: false,
                message: "Sender is not a participant in this room",
                tempId
            };
        }

        // Determine receiver (for direct chats)
        let messageReceiverId = null;
        if (room.type === "direct") {
            messageReceiverId = room.participants.find(
                p => p.toString() !== senderId.toString()
            );
        } else if (receiverId && mongoose.Types.ObjectId.isValid(receiverId)) {
            messageReceiverId = receiverId;
        }

        // Create message
        const newMessage = new Message({
            room: roomId,
            sender: senderId,
            receiver: messageReceiverId,
            content: content.trim(),
            type: type,
            status: "sent",
            readBy: [senderId]
        });

        await newMessage.save();

        // Update room's last message timestamp
        room.lastMessageAt = new Date();
        await room.save();

        // Populate sender and receiver info
        await newMessage.populate("sender", "name email profilePicture");
        if (messageReceiverId) {
            await newMessage.populate("receiver", "name email profilePicture");
        }

        return {
            success: true,
            message: "Message sent successfully",
            data: newMessage,
            tempId
        };

    } catch (error) {
        console.error("Error in handleSendMessage:", error);
        return {
            success: false,
            message: "Failed to send message",
            error: error.message,
            tempId: data.tempId
        };
    }
};

module.exports = {
    handleJoinRoom,
    handleSendMessage
}