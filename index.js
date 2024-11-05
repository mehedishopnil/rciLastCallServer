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

    const resortDataCollection = client
      .db("rciLastCallsDB")
      .collection("resorts");
    const usersCollection = client.db("rciLastCallsDB").collection("users");
    const bookingsCollection = client
      .db("rciLastCallsDB")
      .collection("bookings");
    const paymentInfoCollection = client
      .db("rciLastCallsDB")
      .collection("paymentInfo");

    // Get paginated and filtered resorts data from MongoDB Database
    app.get("/resorts", async (req, res) => {
      try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 15;
        const skip = (page - 1) * limit;

        const resorts = await resortDataCollection
          .find()
          .skip(skip)
          .limit(limit)
          .toArray();
        const count = await resortDataCollection.countDocuments();

        res.send({
          resorts,
          totalPages: Math.ceil(count / limit),
          currentPage: page,
          totalResorts: count, // Include the total count of resorts
        });
      } catch (error) {
        console.error("Error fetching resort data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Get all resort data without pagination
    app.get("/all-resorts", async (req, res) => {
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

    

    // Update resort data by resortId
    app.patch("/resorts/:resortId", async (req, res) => {
      const { resortId } = req.params;
      const updatedData = req.body;

      try {
        const result = await resortDataCollection.updateOne(
          { _id: new MongoClient.ObjectId(resortId) },
          { $set: updatedData }
        );

        if (result.modifiedCount === 0) {
          return res.status(404).send("Resort not found or data not updated");
        }

        res.send({
          success: true,
          message: "Resort data updated successfully",
        });
      } catch (error) {
        console.error("Error updating resort data:", error);
        res.status(500).send("Internal Server Error");
      }
    });



    // Posting Users data to MongoDB database
    app.post("/users", async (req, res) => {
      try {
        const { name, email } = req.body;
        if (!name || !email) {
          return res.status(400).send("Name and email are required");
        }
        console.log(req.body); // Logs posted user data for debugging (optional)
        const result = await usersCollection.insertOne(req.body);
        res.send(result);
      } catch (error) {
        console.error("Error adding user data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // GET endpoint to fetch user data by email
    app.get("/users", async (req, res) => {
      const { email } = req.query;

      try {
        const user = await usersCollection.findOne({ email: email });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Get all user data without pagination
    app.get("/all-users", async (req, res) => {
      try {
        const users = await usersCollection.find().toArray();
        res.send(users);
      } catch (error) {
        console.error("Error fetching all user data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Update user role to admin
    app.patch("/update-user", async (req, res) => {
      const { email, isAdmin } = req.body;

      try {
        // Ensure that email and isAdmin are provided
        if (!email || typeof isAdmin !== "boolean") {
          console.error(
            "Validation failed: Email or isAdmin status is missing"
          );
          return res.status(400).send("Email and isAdmin status are required");
        }

        // Debugging: Log the email and isAdmin
        console.log(`Updating user: ${email}, isAdmin: ${isAdmin}`);

        // Update user role
        const result = await usersCollection.updateOne(
          { email: email },
          { $set: { isAdmin: isAdmin } }
        );

        // Debugging: Log the result of the update operation
        console.log(`Update result: ${JSON.stringify(result)}`);

        if (result.modifiedCount === 0) {
          console.error("User not found or role not updated");
          return res.status(404).send("User not found or role not updated");
        }

        res.send({ success: true, message: "User role updated successfully" });
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Update or add user info (any incoming data)
    app.patch("/update-user-info", async (req, res) => {
      const { email, age, securityDeposit, idNumber } = req.body;

      try {
        const result = await usersCollection.updateOne(
          { email: email },
          { $set: { age, securityDeposit, idNumber } }
        );

        if (result.modifiedCount === 0) {
          return res
            .status(404)
            .json({
              success: false,
              message: "User not found or information not updated.",
            });
        }

        res.json({
          success: true,
          message: "User information updated successfully.",
        });
      } catch (error) {
        console.error("Error updating user info:", error);
        res
          .status(500)
          .json({ success: false, message: "Internal Server Error" });
      }
    });

    //Bookings

    // Posting Bookings data to MongoDB database
    app.post("/bookings", async (req, res) => {
      try {
        const resort = req.body;
        console.log(resort); // Logs posted resort data for debugging (optional)
        const result = await bookingsCollection.insertOne(resort);
        res.send(result);
      } catch (error) {
        console.error("Error adding resort data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    //Payment Info code will be here

    // GET endpoint to fetch user data by email
    app.get("/bookings", async (req, res) => {
      const { email } = req.query;

      try {
        const user = await bookingsCollection.findOne({ email: email });
        if (!user) {
          return res.status(404).json({ error: "User not found" });
        }
        res.json(user);
      } catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).send("Internal Server Error");
      }
    });

    // Get all booking data without pagination
    app.get("/all-bookings", async (req, res) => {
      try {
        const bookings = await bookingsCollection.find().toArray();
        res.send(bookings);
      } catch (error) {
        console.error("Error fetching all booking data:", error);
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
