const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser')
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middlewares
app.use(cors({
  origin: ['https://assignment-12-server-eta-five.vercel.app'], 
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// verify token 
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.status(401).send({ message: 'unauthorized access' })
  }
  jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
    }
    req.user = decoded
    next()
  })
}


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
    // await client.connect();

    const memberCollection = client.db("weddyHub").collection("members");
    const contactCollection = client.db("weddyHub").collection("contactRequests");
    const favoritesCollection = client.db("weddyHub").collection("favoritesBiodata");
    const userCollection = client.db("weddyHub").collection("users");
    const premiumCollection = client.db("weddyHub").collection("premiumBioData");
    const successCollection = client.db("weddyHub").collection("successStory");

     // role verification
    // for admins
    const verifyAdmin = async (req, res, next) => {
      const user = req.user;
      const query = { email: user?.email }
      const result = await userCollection.findOne(query)
      if (!result || result?.role !== 'admin')
        return res.status(401).send({ message: 'unauthorized access' })
      next()
    }
    // for random users 
    const verifyRandomUser = async (req, res, next) => {
      const user = req.user;
      const query = { email: user?.email }
      const result = await userCollection.findOne(query);
      if (!result || result?.role !== 'randomUser')
        return res.status(401).send({ message: 'unauthorized access' })
      next()
    }

    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.TOKEN_SECRET, { expiresIn: '24h' })
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send(token);
    })
    // logout 
    app.post('/logout', async (req, res) => {
      res.clearCookie('token', { maxAge: 0 }).send({ success: true })
  })

    // create or update user 
    app.put('/users/:email', async (req, res) => {
      const email = req.params.email
      const user = req.body
      const query = { email: email };
      const options = { upsert: true }
      const isExist = await userCollection.findOne(query)
      if (isExist) {
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
    app.get('/members',  async (req, res) => {
      const page = parseInt(req.query.page);
      const size = parseInt(req.query.size);
      const result = await memberCollection.find()
        .skip(page * size)
        .limit(size)
        .toArray();
      res.send(result);
    });
    app.get('/membersCount', async (req, res) => {
      const count = await memberCollection.estimatedDocumentCount();
      res.send({ count });
    });
    app.get('/members/:id', verifyToken, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await memberCollection.findOne(query);
      res.send(result);
    });
    app.get('/contactRequests', async (req, res) => {
      const result = await contactCollection.find().toArray();
      res.send(result);
    });
    app.get('/favoritesBiodata', verifyToken, async (req, res) => {
      const result = await favoritesCollection.find().toArray();
      res.send(result);
    });
    app.get('/favoritesBiodata/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      if (req.user?.loggedUser !== email) {
        return res.status(403).send({ message: 'forbidden access' })
    }
      const result = await favoritesCollection.find({ userEmail: email }).toArray();
      res.send(result);
    });

    app.get('/users', verifyToken, async (req, res) => {
      const result = await userCollection.find().toArray();
      res.send(result);
    });
    app.get('/premiumBioData', async (req, res) => {
      const result = await premiumCollection.find().toArray();
      res.send(result);
    });
    app.get('/contactRequests', async (req, res) => {
      const result = await contactCollection.find().toArray();
      res.send(result);
    });
    app.get('/users/:email', verifyToken, async (req, res) => {
      const email = req.params.email;
      const result = await userCollection.findOne({ email });
      res.send(result);
    });
    app.get('/contactRequests/:selfEmail',verifyToken, async (req, res) => {
      const email = req.params.selfEmail;
      const result = await contactCollection.find({ selfEmail: email }).toArray();
      res.send(result);
    });

    // post data

    app.post('/members', async (req, res) => {
      const data = req.body;
      const result = await memberCollection.insertOne(data);
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
    app.post('/successStory', async (req, res) => {
      const data = req.body;
      const result = await successCollection.insertOne(data);
      res.send(result);
    });
    app.get('/successStory', async (req, res) => {
      const result = await successCollection.find().toArray();
      res.send(result);
    });
    app.get('/successStory/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await successCollection.findOne(query);
      res.send(result);
    });
    app.post('/premiumBioData', async (req, res) => {
      const data = req.body;
      const result = await premiumCollection.insertOne(data);
      res.send(result);
    });
    app.get('/premiumBioData', async (req, res) => {
      const result = await premiumCollection.find().toArray();
      res.send(result);
    });
    // update data 
    app.put('/members/:id', async (req, res) => {
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
    // await client.db("admin").command({ ping: 1 });
    // console.log("Pinged your deployment. You successfully connected to MongoDB!");
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