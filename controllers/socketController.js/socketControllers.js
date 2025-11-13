const Room = require("../../model/roomModel");

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

module.exports = {
    handleJoinRoom,
}