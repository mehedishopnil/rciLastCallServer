const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient, ServerApiVersion } = require('mongodb');
const path = require('path');

const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

console.log(process.env.DB_USER);
console.log(process.env.DB_PASS);

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.5eoqrw2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

async function run() {
  const client = new MongoClient(uri, {
    serverApi: {
      version: ServerApiVersion.v1,
      strict: true,
      deprecationErrors: true,
    }
  });

  try {
    await client.connect();

    const resortDataCollection = client.db("rciLastCallsDB").collection("resorts");

    // Get all resorts Data from MongoDB Database
    app.get('/resorts', async (req, res) => {
      try {
        const result = await resortDataCollection.find().toArray();
        res.send(result);
      } catch (error) {
        console.error('Error fetching hotel data:', error);
        res.status(500).send('Internal Server Error');
      }
    });
    
    // Posting resort data to MongoDB database
    app.post('/resorts', async (req, res) => {
      try {
        const resort = req.body;
        console.log(resort);
        const result = await resortDataCollection.insertOne(resort);
        res.send(result);
      } catch (error) {
        console.error('Error adding resort data:', error);
        res.status(500).send('Internal Server Error');
      }
    });

    // Serve static files
    app.use(express.static(path.join(__dirname, 'client/build')));

    // Serve main HTML file for all other routes
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
    });

    // Start the server after setting up routes and connecting to MongoDB
    app.listen(port, () => {
      console.log(`RCI Last Call is running on Port ${port}`);
    });
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
  }
}

run().catch(console.dir);
