const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        room: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Room",
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: function () {
                return this.type !== "system";
            },
            index: true,
        },
        content: {
            type: String,
            trim: true,
            required: true,
        },
        attachments: [
            {
                url: String,
                type: String,
                metadata: {
                    type: Map,
                    of: String,
                },
            },
        ],
        type: {
            type: String,
            enum: ["text", "image", "video", "file", "audio", "system"],
            default: "text",
        },
        status: {
            type: String,
            enum: ["sent", "delivered", "read"],
            default: "sent",
        },
        readBy: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
    },
    {
        timestamps: true,
    }
);

messageSchema.index({ room: 1, createdAt: -1 });
messageSchema.index({ sender: 1, receiver: 1, room: 1 });

const Message = mongoose.model("Message", messageSchema);

module.exports = Message;

