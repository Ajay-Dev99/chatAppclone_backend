const Connection = require("../model/connectionModel");
const User = require("../model/userModel");
const mongoose = require("mongoose");

/**
 * Send a connection request to another user
 * @route POST /api/v1/connections/request
 */
const sendRequest = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { recipientId, message } = req.body;
        const requesterId = req.user._id;

        // Validate recipient ID
        if (!recipientId || !mongoose.Types.ObjectId.isValid(recipientId)) {
            return res.status(400).json({ success: false, message: "Invalid recipient ID" });
        }

        // Can't send request to yourself
        if (requesterId.toString() === recipientId.toString()) {
            return res.status(400).json({ success: false, message: "Cannot send request to yourself" });
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if a connection already exists
        const existingConnection = await Connection.getConnection(requesterId, recipientId);

        if (existingConnection) {
            if (existingConnection.status === "accepted") {
                return res.status(400).json({ success: false, message: "Already connected with this user" });
            }
            if (existingConnection.status === "pending") {
                // If recipient has a pending request from current user
                if (existingConnection.requester.toString() === requesterId.toString()) {
                    return res.status(400).json({ success: false, message: "Request already sent" });
                }
                // If current user has a pending request from recipient, auto-accept
                existingConnection.status = "accepted";
                existingConnection.respondedAt = new Date();
                await existingConnection.save();

                return res.status(200).json({
                    success: true,
                    message: "Connection accepted! They had already sent you a request.",
                    data: existingConnection,
                });
            }
            if (existingConnection.status === "rejected") {
                // Allow re-requesting after rejection
                existingConnection.status = "pending";
                existingConnection.requester = requesterId;
                existingConnection.recipient = recipientId;
                existingConnection.message = message;
                existingConnection.respondedAt = null;
                await existingConnection.save();

                return res.status(200).json({
                    success: true,
                    message: "Connection request sent",
                    data: existingConnection,
                });
            }
            if (existingConnection.status === "blocked") {
                return res.status(403).json({ success: false, message: "Cannot send request to this user" });
            }
        }

        // Create new connection request
        const connection = new Connection({
            requester: requesterId,
            recipient: recipientId,
            message: message || "",
            status: "pending",
        });

        await connection.save();

        // Populate requester info for response
        await connection.populate("requester", "name email profilePicture");
        await connection.populate("recipient", "name email profilePicture");

        return res.status(201).json({
            success: true,
            message: "Connection request sent",
            data: connection,
        });
    } catch (error) {
        console.error("Error sending connection request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to send connection request",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Accept a connection request
 * @route PATCH /api/v1/connections/:connectionId/accept
 */
const acceptRequest = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { connectionId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            return res.status(400).json({ success: false, message: "Invalid connection ID" });
        }

        const connection = await Connection.findById(connectionId);

        if (!connection) {
            return res.status(404).json({ success: false, message: "Connection request not found" });
        }

        // Only recipient can accept
        if (connection.recipient.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "You can only accept requests sent to you" });
        }

        if (connection.status !== "pending") {
            return res.status(400).json({ success: false, message: `Request already ${connection.status}` });
        }

        connection.status = "accepted";
        connection.respondedAt = new Date();
        await connection.save();

        await connection.populate("requester", "name email profilePicture");
        await connection.populate("recipient", "name email profilePicture");

        return res.status(200).json({
            success: true,
            message: "Connection request accepted",
            data: connection,
        });
    } catch (error) {
        console.error("Error accepting connection request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to accept connection request",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Reject a connection request
 * @route PATCH /api/v1/connections/:connectionId/reject
 */
const rejectRequest = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { connectionId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            return res.status(400).json({ success: false, message: "Invalid connection ID" });
        }

        const connection = await Connection.findById(connectionId);

        if (!connection) {
            return res.status(404).json({ success: false, message: "Connection request not found" });
        }

        // Only recipient can reject
        if (connection.recipient.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "You can only reject requests sent to you" });
        }

        if (connection.status !== "pending") {
            return res.status(400).json({ success: false, message: `Request already ${connection.status}` });
        }

        connection.status = "rejected";
        connection.respondedAt = new Date();
        await connection.save();

        return res.status(200).json({
            success: true,
            message: "Connection request rejected",
            data: { connectionId },
        });
    } catch (error) {
        console.error("Error rejecting connection request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to reject connection request",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Cancel a sent connection request
 * @route DELETE /api/v1/connections/:connectionId/cancel
 */
const cancelRequest = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { connectionId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            return res.status(400).json({ success: false, message: "Invalid connection ID" });
        }

        const connection = await Connection.findById(connectionId);

        if (!connection) {
            return res.status(404).json({ success: false, message: "Connection request not found" });
        }

        // Only requester can cancel
        if (connection.requester.toString() !== userId.toString()) {
            return res.status(403).json({ success: false, message: "You can only cancel your own requests" });
        }

        if (connection.status !== "pending") {
            return res.status(400).json({ success: false, message: "Can only cancel pending requests" });
        }

        await connection.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Connection request cancelled",
            data: { connectionId },
        });
    } catch (error) {
        console.error("Error cancelling connection request:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to cancel connection request",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Remove a connection (unfriend)
 * @route DELETE /api/v1/connections/:connectionId
 */
const removeConnection = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { connectionId } = req.params;
        const userId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(connectionId)) {
            return res.status(400).json({ success: false, message: "Invalid connection ID" });
        }

        const connection = await Connection.findById(connectionId);

        if (!connection) {
            return res.status(404).json({ success: false, message: "Connection not found" });
        }

        // Either party can remove the connection
        if (
            connection.requester.toString() !== userId.toString() &&
            connection.recipient.toString() !== userId.toString()
        ) {
            return res.status(403).json({ success: false, message: "Not authorized to remove this connection" });
        }

        await connection.deleteOne();

        return res.status(200).json({
            success: true,
            message: "Connection removed",
            data: { connectionId },
        });
    } catch (error) {
        console.error("Error removing connection:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to remove connection",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Get pending requests received by user
 * @route GET /api/v1/connections/requests/received
 */
const getReceivedRequests = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const userId = req.user._id;

        const requests = await Connection.find({
            recipient: userId,
            status: "pending",
        })
            .populate("requester", "name email profilePicture online")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: requests,
            count: requests.length,
        });
    } catch (error) {
        console.error("Error fetching received requests:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch received requests",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Get pending requests sent by user
 * @route GET /api/v1/connections/requests/sent
 */
const getSentRequests = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const userId = req.user._id;

        const requests = await Connection.find({
            requester: userId,
            status: "pending",
        })
            .populate("recipient", "name email profilePicture online")
            .sort({ createdAt: -1 })
            .lean();

        return res.status(200).json({
            success: true,
            data: requests,
            count: requests.length,
        });
    } catch (error) {
        console.error("Error fetching sent requests:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch sent requests",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Get all connected users (friends)
 * @route GET /api/v1/connections
 */
const getConnections = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const userId = req.user._id;
        const connectedUsers = await Connection.getConnectedUsers(userId);

        return res.status(200).json({
            success: true,
            data: connectedUsers,
            count: connectedUsers.length,
        });
    } catch (error) {
        console.error("Error fetching connections:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch connections",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Get connection status with a specific user
 * @route GET /api/v1/connections/status/:userId
 */
const getConnectionStatus = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const { userId } = req.params;
        const currentUserId = req.user._id;

        if (!mongoose.Types.ObjectId.isValid(userId)) {
            return res.status(400).json({ success: false, message: "Invalid user ID" });
        }

        const connection = await Connection.getConnection(currentUserId, userId);

        if (!connection) {
            return res.status(200).json({
                success: true,
                data: {
                    status: "none",
                    connection: null,
                },
            });
        }

        // Determine the relationship direction
        const isRequester = connection.requester.toString() === currentUserId.toString();

        return res.status(200).json({
            success: true,
            data: {
                status: connection.status,
                connection: connection,
                direction: isRequester ? "sent" : "received",
            },
        });
    } catch (error) {
        console.error("Error fetching connection status:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch connection status",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

/**
 * Get all users (for discovery) with connection status
 * @route GET /api/v1/connections/discover
 */
const discoverUsers = async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ success: false, message: "Unauthorized" });
        }

        const userId = req.user._id;
        let { limit = 20, page = 1, search = "" } = req.query;

        limit = Math.min(Math.max(parseInt(limit) || 20, 1), 50);
        page = Math.max(parseInt(page) || 1, 1);
        const skip = (page - 1) * limit;

        // Build search query
        const searchQuery = {
            _id: { $ne: userId },
        };

        if (search) {
            searchQuery.$or = [
                { name: { $regex: search, $options: "i" } },
                { email: { $regex: search, $options: "i" } },
            ];
        }

        // Get users
        const users = await User.find(searchQuery)
            .select("name email profilePicture online createdAt")
            .skip(skip)
            .limit(limit)
            .lean();

        // Get total count
        const total = await User.countDocuments(searchQuery);

        // Get all connections for current user
        const connections = await Connection.find({
            $or: [{ requester: userId }, { recipient: userId }],
        }).lean();

        // Map connection status to each user
        const usersWithStatus = users.map((user) => {
            const connection = connections.find(
                (conn) =>
                    conn.requester.toString() === user._id.toString() ||
                    conn.recipient.toString() === user._id.toString()
            );

            if (!connection) {
                return { ...user, connectionStatus: "none", connection: null };
            }

            const isRequester = connection.requester.toString() === userId.toString();

            return {
                ...user,
                connectionStatus: connection.status,
                connectionDirection: isRequester ? "sent" : "received",
                connection: connection,
            };
        });

        return res.status(200).json({
            success: true,
            data: usersWithStatus,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasMore: page * limit < total,
            },
        });
    } catch (error) {
        console.error("Error discovering users:", error);
        return res.status(500).json({
            success: false,
            message: "Failed to discover users",
            error: process.env.NODE_ENV === "development" ? error.message : undefined,
        });
    }
};

module.exports = {
    sendRequest,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    removeConnection,
    getReceivedRequests,
    getSentRequests,
    getConnections,
    getConnectionStatus,
    discoverUsers,
};

