const express = require("express");

const app = express();

const port = process.env.PORT || 3000;

// Middleware to read JSON requests
app.use(express.json());

// Test route
app.get("/", (req, res) => {
    res.send("After School Backend Server is running!");
});

// Start the server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
