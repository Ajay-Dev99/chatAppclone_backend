const express = require("express");
const authMiddleware = require("../../middleware/authMiddleware");
const {
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
} = require("../../controllers/connectionController");

const connectionRoutes = express.Router();

// Apply authentication middleware to all routes
connectionRoutes.use(authMiddleware);

// Get all connected users (friends)
connectionRoutes.get("/", getConnections);

// Discover users (for sending requests)
connectionRoutes.get("/discover", discoverUsers);

// Get pending requests received
connectionRoutes.get("/requests/received", getReceivedRequests);

// Get pending requests sent
connectionRoutes.get("/requests/sent", getSentRequests);

// Get connection status with a specific user
connectionRoutes.get("/status/:userId", getConnectionStatus);

// Send a connection request
connectionRoutes.post("/request", sendRequest);

// Accept a connection request
connectionRoutes.patch("/:connectionId/accept", acceptRequest);

// Reject a connection request
connectionRoutes.patch("/:connectionId/reject", rejectRequest);

// Cancel a sent request
connectionRoutes.delete("/:connectionId/cancel", cancelRequest);

// Remove a connection (unfriend)
connectionRoutes.delete("/:connectionId", removeConnection);

module.exports = connectionRoutes;

