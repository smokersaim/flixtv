const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

app.use(cors());

app.use(express.json());

const homeRoute = require('./routes/home');
const movieRoute = require('./routes/movies');
const seriesRoute = require('./routes/series');
const searchRoute = require('./routes/search');

app.use('/home', homeRoute);
app.use('/movies', movieRoute);
app.use('/series', seriesRoute);
app.use('/search', searchRoute);

mongoose.connect(process.env.MongoURI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('MongoDB connected successfully');
    })
    .catch(err => {
        console.error('MongoDB connection error:', err);
    });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
