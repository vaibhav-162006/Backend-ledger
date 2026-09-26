const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const mongoose = require("mongoose");

function connectToDb() {
    mongoose
        .connect(process.env.MONGO_URI)
        .then(() => {
            console.log("Server is connected to DB");
        })
        .catch((err) => {
            console.error("MongoDB connection failed:");
            console.error(err.message);
            process.exit(1);
        });
}

module.exports = connectToDb;