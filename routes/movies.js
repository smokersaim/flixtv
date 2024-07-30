const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');

const ITEMS_PER_PAGE = 24;

const getPaginationData = async (filter) => {
    const totalItems = await Movie.aggregate([
        { $match: filter },
        { $count: "total" }
    ]);

    const total = totalItems[0]?.total || 0;
    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

    return { total, totalPages };
};

const buildResponse = (page, totalPages, items) => ({
    status: 200,
    result: {
        current_page: page,
        total_pages: totalPages,
        items
    }
});

const getMovies = async (filter, sort, page) => {
    return await Movie.aggregate([
        { $match: filter },
        { $sort: sort },
        { $skip: (page - 1) * ITEMS_PER_PAGE },
        { $limit: ITEMS_PER_PAGE },
        {
            $project: {
                imdb_id: 1,
                type: { $concat: [{ $toUpper: { $substr: ['$type', 0, 1] } }, { $substr: ['$type', 1, { $strLenCP: '$type' }] }] },
                title: 1,
                genre: { $arrayElemAt: ['$genres', 0] },
                release: { $substr: ['$release', 0, 4] },
                rating: { $ifNull: [{ $round: ['$vote_average', 1] }, 0.0] },
                poster_path: { $arrayElemAt: ['$posters.poster_path', 0] },
                backdrop_path: { $arrayElemAt: ['$backdrops.backdrop_path', 0] }
            }
        }
    ]).exec();
};

const getUpcomingMovies = async (filter, sort, page) => {
    return await Movie.aggregate([
        { $match: filter },
        { $sort: sort },
        { $skip: (page - 1) * ITEMS_PER_PAGE },
        { $limit: ITEMS_PER_PAGE },
        {
            $project: {
                imdb_id: 1,
                type: { $concat: [{ $toUpper: { $substr: ['$type', 0, 1] } }, { $substr: ['$type', 1, { $strLenCP: '$type' }] }] },
                title: 1,
                genre: { $arrayElemAt: ['$genres', 0] },
                release: 1,
                rating: { $ifNull: [{ $round: ['$vote_average', 1] }, 0.0] },
                poster_path: { $arrayElemAt: ['$posters.poster_path', 0] },
                backdrop_path: { $arrayElemAt: ['$backdrops.backdrop_path', 0] },
                company: { $arrayElemAt: ['$production_companies.company_name', 0] }
            }
        }
    ]).exec();
};

router.get('/popular/:page?', async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const filter = { release: { $lte: new Date().toISOString().split('T')[0] } };
    const sort = { popularity: -1 };

    try {
        const { totalPages } = await getPaginationData(filter);
        const movies = await getMovies(filter, sort, page);
        res.json(buildResponse(page, totalPages, movies));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch popular movies' });
    }
});

router.get('/latest/:page?', async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const filter = { release: { $lte: new Date().toISOString().split('T')[0] } };
    const sort = { release: -1 };

    try {
        const { totalPages } = await getPaginationData(filter);
        const movies = await getMovies(filter, sort, page);
        res.json(buildResponse(page, totalPages, movies));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest movies' });
    }
});

router.get('/top/:page?', async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const filter = { release: { $lte: new Date().toISOString().split('T')[0] } };
    const sort = { vote_average: -1 };

    try {
        const { totalPages } = await getPaginationData(filter);
        const movies = await getMovies(filter, sort, page);
        res.json(buildResponse(page, totalPages, movies));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch top rated movies' });
    }
});

router.get('/upcoming/:page?', async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const filter = { release: { $gt: new Date().toISOString().split('T')[0] } };
    const sort = { release: 1 };

    try {
        const { totalPages } = await getPaginationData(filter);
        const movies = await getUpcomingMovies(filter, sort, page);
        res.json(buildResponse(page, totalPages, movies));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch upcoming movies' });
    }
});

router.get('/details/:imdb_id', async (req, res) => {
    const imdbId = req.params.imdb_id;
    try {
        const movieDetails = await Movie.findOne({ imdb_id: imdbId }).exec();
        if (!movieDetails) {
            return res.status(404).json({ error: 'Movie not found' });
        }

        const currentDate = new Date().toISOString().split('T')[0];

        if (movieDetails.release <= currentDate) {
            res.json({
                status: 200,
                result: movieDetails
            });
        } else {
            res.json({
                status: 200,
                message: 'Movie is not released yet'
            });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch movie details' });
    }
});

module.exports = router;
