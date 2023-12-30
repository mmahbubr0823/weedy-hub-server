const express = require('express');
const cors = require('cors');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.scdnbhm.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const memberCollection = client.db("weddyHub").collection("members");
    const contactCollection = client.db("weddyHub").collection("contactRequests");
    const favoritesCollection = client.db("weddyHub").collection("favoritesBiodata");
    const userCollection = client.db("weddyHub").collection("users");

    // create or update user 
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const query = { email: email }
      const options = { upsert: true }
      const isExist = await userCollection.findOne(query)
      if (isExist) {
        // if (user?.status === 'Requested') {
        //   const result = await usersCollection.updateOne(
        //     query,
        //     {
        //       $set: user,
        //     },
        //     options
        //   )
        //   return res.send(result)
        // } else {
          // }

            return res.send(isExist)
      }
      const result = await userCollection.updateOne(
        query,
        {
          $set: { ...user, timestamp: Date.now() },
        },
        options
      )
      res.send(result)
    })
    // getting data 
    app.get('/members', async (req, res) => {
      const result = await memberCollection.find().toArray();
      res.send(result);
    });
    app.get('/members/:id', async (req, res) => {
      const id = req.params.id;
      const query = {_id: new ObjectId(id)}
      const result = await memberCollection.findOne(query);
      res.send(result);
    });
    app.get('/contactRequests', async (req, res) => {
      const result = await contactCollection.find().toArray();
      res.send(result);
    });
    app.get('/favoritesBiodata', async (req, res) => {
      const result = await favoritesCollection.find().toArray();
      res.send(result);
    });
    app.get('/favoritesBiodata/:email', async (req, res) => {
      const email = req.params.email;
      console.log(email);
      const result = await favoritesCollection.find({userEmail: email}).toArray();
      res.send(result);
    });
    app.get('/members/:BiodataType', async (req, res) => {
      const BiodataType = req.params.BiodataType;
      const result = await memberCollection.find({BiodataType:BiodataType}).toArray();
      res.send(result);
    });
    app.get('/users', async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get('/users/:email', async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({email});
      res.send(result);
    });
    app.get('/contactRequests/:selfEmail', async (req, res) => {
      const email = req.params.selfEmail;
      const result = await contactCollection.find({selfEmail:email}).toArray();
      res.send(result);
    });
    
    // post data

    app.post('/members', async (req, res) => {
      const data = req.body;
      const result = await memberCollection.insertOne(data);
      res.send(result);
    });
    app.get('/members/:email', async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const result = await memberCollection.findOne({email});
      res.send(result);
    });
    app.post('/contactRequests', async (req, res) => {
      const data = req.body;
      const result = await contactCollection.insertOne(data);
      res.send(result);
    });
    app.post('/favoritesBiodata', async (req, res) => {
      const data = req.body;
      const result = await favoritesCollection.insertOne(data);
      res.send(result);
    });
    // update data 
    app.put('/members/:id', async(req, res)=>{
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const options = { upsert: true };
      const data = req.body;
      const updatedDoc = {
        $set: {
            ...data
        }
    }
    const result = await memberCollection.updateOne(filter, updatedDoc, options);
    res.send(result);
    })

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  }
  catch (error) {
    console.log(error);
  }
  finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }

}
run().catch(console.dir);




app.get('/', (req, res) => {
  res.send('final effort will be given')
})
app.listen(port, () => {
  console.log(`final effort will be given: ${port}`);
})