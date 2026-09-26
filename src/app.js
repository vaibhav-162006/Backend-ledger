const express = require("express");
const cookie = require("cookie-parser");

const app = express();

const authRouter = require("./routes/auth.routes");
const accountRouter = require("./routes/account.routes");
const transictionRoutes = require("./routes/transiction.routes")

app.use(express.json());
app.use(cookie());
app.get("/health", (req, res) => res.status(200).json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/account", accountRouter);
app.use("/api/accounts", accountRouter);
app.use("/api/transiction" , transictionRoutes);
app.use("/api/transactions", transictionRoutes);
app.use((err, req, res, next) => {
    if (res.headersSent) return next(err);
    if (err?.status === 400 || err?.status === 413) {
        return res.status(err.status).json({ message: err.status === 413 ? "Request body is too large" : "Invalid JSON request body" });
    }
    if (err?.code === 11000) {
        return res.status(409).json({ message: "A record with this value already exists" });
    }
    if (err?.name === "ValidationError" || err?.name === "CastError") {
        return res.status(400).json({ message: err.message });
    }
    console.error(err);
    return res.status(500).json({ message: "Internal server error" });
});
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
module.exports = app;
