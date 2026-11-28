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

// Allow frontend to access backend
app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
        return res.sendStatus(200);
    }

    next();
});

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

// SEARCH lessons by any field
app.get("/search", async (req, res) => {
    try {
        const db = getDB();

        const searchTerm = req.query.query;

        if (!searchTerm) {
            return res.status(400).send("Please enter a search term");
        }

        const searchNumber = Number(searchTerm);

        const searchConditions = [
            { topic: { $regex: searchTerm, $options: "i" } },
            { location: { $regex: searchTerm, $options: "i" } },
            { image: { $regex: searchTerm, $options: "i" } },
            { icon: { $regex: searchTerm, $options: "i" } }
        ];

        if (!isNaN(searchNumber)) {
            searchConditions.push(
                { price: searchNumber },
                { space: searchNumber },
                { rating: searchNumber }
            );
        }

        const lessons = await db.collection("lesson")
            .find({ $or: searchConditions })
            .toArray();

        res.json(lessons);

    } catch (error) {
        console.error("Search error:", error);
        res.status(500).send("Error searching lessons");
    }
});

// GET list of all teachers
app.get("/teachers", async (req, res) => {
    try {
        const db = getDB();

        const teachers = await db.collection("lesson").aggregate([
            {
                $group: {
                    _id: {
                        firstName: "$teacherFirstname",
                        lastName: "$teacherLastname"
                    }
                }
            },
            {
                $project: {
                    _id: 0,
                    firstName: "$_id.firstName",
                    lastName: "$_id.lastName"
                }
            }
        ]).toArray();

        res.json(teachers);

    } catch (error) {
        console.error("Error retrieving teachers:", error);
        res.status(500).send("Error retrieving teachers");
    }
});

// GET lessons taught by a specific teacher
app.get("/teachers/:firstname/:lastname", async (req, res) => {
    try {
        const db = getDB();

        const firstName = req.params.firstname;
        const lastName = req.params.lastname;

        const lessons = await db.collection("lesson").find({
            teacherFirstname: firstName,
            teacherLastname: lastName
        }).toArray();

        res.json(lessons);

    } catch (error) {
        console.error("Teacher search error:", error);
        res.status(500).send("Error retrieving teacher lessons");
    }
});

// GET number of spaces already purchased for a lesson
app.get("/enrolment/:lessonid", async (req, res) => {
    try {
        const db = getDB();

        const lessonID = req.params.lessonid;

        const orders = await db.collection("order").find({
            lessonIDs: lessonID
        }).toArray();

        let totalEnrolled = 0;

        orders.forEach(order => {
            const index = order.lessonIDs.indexOf(lessonID);

            if (index !== -1) {
                totalEnrolled += Number(
                    order.numberOfSpaces[index]
                ) || 0;
            }
        });

        res.json({
            lessonID: lessonID,
            enrolledSpaces: totalEnrolled
        });

    } catch (error) {
        console.error("Enrolment error:", error);
        res.status(500).send("Error retrieving enrolment information");
    }
});

// POST new order to MongoDB
app.post("/orders", async (req, res) => {
    try {
        const db = getDB();

        const order = {
            name: req.body.name,
            phone: req.body.phone,
            lessonIDs: req.body.lessonIDs,
            numberOfSpaces: req.body.numberOfSpaces
        };

        if (
            !order.name ||
            !order.phone ||
            !Array.isArray(order.lessonIDs) ||
            !Array.isArray(order.numberOfSpaces) ||
            order.lessonIDs.length === 0 ||
            order.lessonIDs.length !== order.numberOfSpaces.length
        ) {
            return res.status(400).send("Invalid order information");
        }

        const result = await db.collection("order").insertOne(order);

        res.status(201).json({
            message: "Order saved successfully",
            orderID: result.insertedId
        });

    } catch (error) {
        console.error("Error saving order:", error);
        res.status(500).send("Error saving order");
    }
});

// PUT update lesson information
app.put("/lessons/:id", async (req, res) => {
    try {
        const db = getDB();

        const { ObjectId } = require("mongodb");

        const result = await db.collection("lesson").updateOne(
            { _id: new ObjectId(req.params.id) },
            { $set: req.body }
        );

        if (result.matchedCount === 0) {
            return res.status(404).send("Lesson not found");
        }

        res.json({ message: "Lesson updated successfully" });

    } catch (error) {
        console.error("Error updating lesson:", error);
        res.status(400).send("Invalid lesson ID or update information");
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
