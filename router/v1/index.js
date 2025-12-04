const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const messageRoutes = require("./messageRoutes");
const connectionRoutes = require("./connectionRoutes");

const v1Routes = require("express").Router();

v1Routes.use("/auth", authRoutes);
v1Routes.use("/users", userRoutes);
v1Routes.use("/messages", messageRoutes);
v1Routes.use("/connections", connectionRoutes);


module.exports = v1Routes;