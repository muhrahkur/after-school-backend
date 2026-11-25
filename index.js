require("dotenv").config();

const express = require("express");
const { connectDB, getDB } = require("./db");

const app = express();

const port = process.env.PORT || 3000;

// Logger middleware
const logger = (req, res, next) => {
    console.log(
        `${req.method} ${req.url} - ${new Date().toLocaleString()}`
    );

    next();
};

// Register middleware
app.use(logger);
app.use(express.json());

// Static file middleware for lesson images
app.use("/images", express.static("images"));

// Test route
app.get("/", (req, res) => {
    res.send("After School Backend Server is running!");
});

// GET all lessons from MongoDB
app.get("/lessons", async (req, res) => {
    try {
        const db = getDB();

        const lessons = await db.collection("lesson").find({}).toArray();

        res.json(lessons);

    } catch (error) {
        console.error("Error retrieving lessons:", error);
        res.status(500).send("Error retrieving lessons");
    }
});

// Start server after connecting to MongoDB
async function startServer() {
    try {
        await connectDB();

        app.listen(port, () => {
            console.log(`Server running on port ${port}`);
        });

    } catch (error) {
        console.error("Unable to start server.");
        process.exit(1);
    }
}

startServer();

