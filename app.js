const express = require("express");
const app = express();
require('dotenv').config()
const connectDB = require("./config/Dbconnection");
const router = require("./router");




connectDB();

app.use(express.json());

app.use("/api", router);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});


// byYYAwPTweRMvA3x

// ajaydevkomath_db_user




