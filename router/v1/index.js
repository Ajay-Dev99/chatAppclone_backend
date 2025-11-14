const authRoutes = require("./authRoutes");
const userRoutes = require("./userRoutes");
const messageRoutes = require("./messageRoutes");

const v1Routes = require("express").Router();

v1Routes.use("/auth", authRoutes);
v1Routes.use("/users", userRoutes);
v1Routes.use("/messages", messageRoutes);


module.exports = v1Routes;