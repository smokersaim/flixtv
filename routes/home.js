const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Series = require('../models/Series');

const ITEMS_PER_PAGE = 10;

function buildResponse(results) {
    return {
        results
    };
}

async function getMovies(filter, sort) {
    return await Movie.aggregate([
        { $match: filter },
        {
            $project: {
                imdb_id: 1,
                type: 'Movie',
                title: 1,
                genre: { $arrayElemAt: ['$genres', 0] },
                release: { $substr: ['$release', 0, 4] },
                rating: { $ifNull: [{ $round: ['$vote_average', 1] }, 0.0] },
                poster_path: { $arrayElemAt: ['$posters.poster_path', 0] },
                backdrop_path: { $arrayElemAt: ['$backdrops.backdrop_path', 0] }
            }
        },
        { $sort: sort },
        { $limit: ITEMS_PER_PAGE }
    ]).exec();
}

async function getSeries(filter, sort) {
    return await Series.aggregate([
        { $match: filter },
        {
            $project: {
                imdb_id: 1,
                type: 'TV',
                title: 1,
                genre: { $arrayElemAt: ['$genres', 0] },
                release: { $year: { $dateFromString: { dateString: '$first_air_date' } } },
                rating: { $ifNull: [{ $round: ['$vote_average', 1] }, 0.0] },
                poster_path: { $arrayElemAt: ['$posters.poster_path', 0] },
                backdrop_path: { $arrayElemAt: ['$backdrops.backdrop_path', 0] }
            }
        },
        { $sort: sort },
        { $limit: ITEMS_PER_PAGE }
    ]).exec();
}

router.get('/movies/popular', async (req, res) => {
    try {
        const filter = { release: { $lte: new Date().toISOString().split('T')[0] } };
        const sort = { popularity: -1 };
        const movies = await getMovies(filter, sort);
        res.json(buildResponse(movies));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch popular movies' });
    }
});

router.get('/movies/latest', async (req, res) => {
    try {
        const filter = { release: { $lte: new Date().toISOString().split('T')[0] } };
        const sort = { release: -1 };
        const movies = await getMovies(filter, sort);
        res.json(buildResponse(movies));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest movies' });
    }
});

router.get('/movies/top', async (req, res) => {
    try {
        const filter = { release: { $lte: new Date().toISOString().split('T')[0] } };
        const sort = { vote_average: -1 };
        const movies = await getMovies(filter, sort);
        res.json(buildResponse(movies));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch top movies' });
    }
});

router.get('/series/popular', async (req, res) => {
    try {
        const filter = { first_air_date: { $lte: new Date().toISOString().split('T')[0] } };
        const sort = { popularity: -1 };
        const series = await getSeries(filter, sort);
        res.json(buildResponse(series));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch popular series' });
    }
});

router.get('/series/latest', async (req, res) => {
    try {
        const filter = { first_air_date: { $lte: new Date().toISOString().split('T')[0] } };
        const sort = { first_air_date: -1 };
        const series = await getSeries(filter, sort);
        res.json(buildResponse(series));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest series' });
    }
});

router.get('/series/top', async (req, res) => {
    try {
        const filter = { first_air_date: { $lte: new Date().toISOString().split('T')[0] } };
        const sort = { vote_average: -1 };
        const series = await getSeries(filter, sort);
        res.json(buildResponse(series));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch top series' });
    }
});

module.exports = router;
