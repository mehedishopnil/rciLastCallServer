const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER); // Logs DB username for debugging (optional)
console.log(process.env.DB_PASS); // Logs DB password for debugging (optional)

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5eoqrw2.mongodb.net/?retryWrites=true&w=majority`;

async function run() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    },
  });

  try {
    await client.connect();

    const resortDataCollection = client.db("rciLastCallsDB").collection("resorts");

    // Get paginated and filtered resorts data from MongoDB Database
    app.get("/resorts", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        const resorts = await resortDataCollection.find().skip(skip).limit(limit).toArray();
        const count = await resortDataCollection.countDocuments();

        res.send({
          resorts,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalResorts: count // Include the total count of resorts
        });
      } catch (error) {
        console.error("Error fetching resort data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Search resorts by location, resort_ID, or place_name
    app.get('/resorts/search', async (req, res) => {
      const searchTerm = req.query.key;
      try {
        const searchResults = await resortDataCollection.find({
          $or: [
            { location: { $regex: searchTerm, $options: 'i' } },
            { resort_ID: { $regex: searchTerm, $options: 'i' } },
            { place_name: { $regex: searchTerm, $options: 'i' } }
          ]
        }).toArray();
        res.send(searchResults);
      } catch (error) {
        console.error('Error fetching search results:', error);
        res.status(404).send('Search Not Found');
      }
    });

    // Posting resort data to MongoDB database
    app.post("/resorts", async (req, res) => {
      try {
        const resort = req.body;
        console.log(resort); // Logs posted resort data for debugging (optional)
        const result = await resortDataCollection.insertOne(resort);
        res.send(result);
      } catch (error) {
        console.error("Error adding resort data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Ping the database
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // Start the server
    app.listen(port, () => {
      console.log(`RCI Last Call server listening on port ${port}`);
    });
  } catch (error) {
    console.error("Failed to connect to MongoDB:", error);
    await client.close();
  }
}

// Properly close the MongoDB connection on application shutdown
process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB client disconnected");
  process.exit(0);
});

// Start the run function
run().catch(console.dir);

// Serve main HTML file for all other routes
app.get("/", (req, res) => {
  res.send("RCI Last Call server is running");
});
