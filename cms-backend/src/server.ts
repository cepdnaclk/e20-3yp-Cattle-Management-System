const express = require('express');
import mongoose from 'mongoose';
import { cattleRouter } from './routes/api/cattleRoutes';
import { sensorDataRouter } from './routes/api/sensorDataRoutes';
import authRouter from './routes/api/authRoutes';
import { mqttClient } from './services/mqttClient';
const cors = require('cors');
require('dotenv').config();
import verifyJWT from './middlewear/verifyJWT';
import { geoFenceRouter } from './routes/api/geoFenceRoutes';
import { mapRouter } from './routes/api/mapRoutes';
const cookieParser = require('cookie-parser');
const PORT = process.env.PORT || 5000;
const DB_CONNECTION = process.env.DB_CONNECTION || '';

// Initilize server
const app = express();

// CORS options to allow only specific domains
const corsOptions = {
  origin: 'http://localhost:5173', // Replace with the allowed domain(s)
  methods: ['GET', 'POST', 'PUT', 'DELETE'], // Optional: specify which HTTP methods are allowed
  allowedHeaders: ['Content-Type', 'Authorization'], // Optional: specify which headers are allowed
  credentials: true,
};

// Use the custom CORS options
app.use(cors(corsOptions));

// Middleware to parse JSON
app.use(express.json());

// Middleware for cookie parsing
app.use(cookieParser());

app.get('/', (req: any, res: any) => {
  res.send('Hello world');
});

// Register the routes

app.use(authRouter);
// app.use(verifyJWT); // Apply JWT verification middleware to all routes below this line
app.use('/geo-fence', geoFenceRouter);
app.use('/map', mapRouter);
app.use('/api/cattle', cattleRouter);
app.use('/api/sensor', sensorDataRouter);
app.use('/api/auth', authRouter); // Mount auth routes under /api/auth

mongoose
  .connect(DB_CONNECTION)
  .then(() => {
    console.log('Database Connection successful');

    // Running the server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });

    //TO-DO: latestupdate dictionary initialization
  })
  .catch((err: any) => {
    console.log('Connection failed ', err);
  });
mqttClient.subscribe('zone/1/+/data');
// const jsonString = '{"message": "Hello from Node.js!"}';
// const jsonObject = JSON.parse(jsonString);
//mqttClient.publish('iot/cattle', JSON.stringify(jsonObject));
// mqttClient.subscribe('iot/cattle');
//mqttClient.subscribe('iot/cattle');
