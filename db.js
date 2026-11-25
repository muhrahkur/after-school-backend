
const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;

const client = new MongoClient(uri);

let database;

async function connectDB() {
    try {
        await client.connect();

        database = client.db("after-school");

        console.log("Connected to MongoDB Atlas!");

        return database;

    } catch (error) {
        console.error("MongoDB connection failed:", error);
        throw error;
    }
}

function getDB() {
    if (!database) {
        throw new Error("Database is not connected.");
    }

    return database;
}

module.exports = { connectDB, getDB };
