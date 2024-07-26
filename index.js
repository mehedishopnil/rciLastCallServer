const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion } = require("mongodb");

app.use(cors());
app.use(express.json());

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
    const usersCollection = client.db("rciLastCallsDB").collection("users");
    const bookingsCollection = client.db("rciLastCallsDB").collection("bookings");
    const paymentInfoCollection = client.db("rciLastCallsDB").collection("paymentInfo");

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

    // Get all resort data without pagination
    app.get('/all-resorts', async (req, res) => {
      try {
        const resorts = await resortDataCollection.find().toArray();
        res.send(resorts);
      } catch (error) {
        console.error("Error fetching all resort data:", error);
        res.status(500).send("Internal Server Error");
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

    // Posting Users data to MongoDB database
    app.post("/users", async (req, res) => {
      try {
        const user = req.body;
        console.log(user); // Logs posted user data for debugging (optional)
        const result = await usersCollection.insertOne(user);
        res.send(result);
      } catch (error) {
        console.error("Error adding user data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // GET endpoint to fetch user data by email
    app.get('/users', async (req, res) => {
      const { email } = req.query;

      try {
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
          return res.status(404).json({ error: 'User not found' });
        }
        res.json(user);
      } catch (error) {
        console.error('Error fetching user data:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    // Bookings
    // Posting Bookings data to MongoDB database
    app.post("/bookings", async (req, res) => {
      try {
        const booking = req.body;
        console.log(booking); // Logs posted booking data for debugging (optional)
        const result = await bookingsCollection.insertOne(booking);
        res.send(result);
      } catch (error) {
        console.error("Error adding booking data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // GET endpoint to fetch booking data by email
    app.get('/bookings', async (req, res) => {
      const { email } = req.query;

      try {
        const booking = await bookingsCollection.findOne({ email: email });
        if (!booking) {
          return res.status(404).json({ error: 'Booking not found' });
        }
        res.json(booking);
      } catch (error) {
        console.error('Error fetching booking data:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    // Payment Info
    // Posting Payment Information to MongoDB database
    app.post("/payment-info", async (req, res) => {
      try {
        const paymentInfo = req.body;
        console.log(paymentInfo); // Logs posted payment info data for debugging (optional)
        const result = await paymentInfoCollection.insertOne(paymentInfo);
        res.send(result);
      } catch (error) {
        console.error("Error adding payment info:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // GET endpoint to fetch payment info data by email
    app.get('/payment-info', async (req, res) => {
      const { email } = req.query;

      try {
        const paymentInfo = await paymentInfoCollection.find({ email: email }).toArray();
        if (!paymentInfo.length) {
          return res.status(404).json({ error: 'No payment information found for this user' });
        }
        res.json(paymentInfo);
      } catch (error) {
        console.error('Error fetching payment info data:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    // Ping the database
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");

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
