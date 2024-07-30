const express = require('express');
const router = express.Router();
const Series = require('../models/Series');

const ITEMS_PER_PAGE = 24;

const getPaginationData = async (filter) => {
    const totalItems = await Series.aggregate([
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

const getSeries = async (filter, sort, page) => {
    return await Series.aggregate([
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
                release: { $substr: ['$first_air_date', 0, 4] },
                rating: { $ifNull: [{ $round: ['$vote_average', 1] }, 0.0] },
                poster_path: { $arrayElemAt: ['$posters.poster_path', 0] },
                backdrop_path: { $arrayElemAt: ['$backdrops.backdrop_path', 0] }
            }
        }
    ]).exec();
};

const getUpcomingSeries = async (filter, sort, page) => {
    return await Series.aggregate([
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
                release: '$first_air_date',
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
    const filter = { first_air_date: { $lte: new Date().toISOString().split('T')[0] } };
    const sort = { popularity: -1 };

    try {
        const { totalPages } = await getPaginationData(filter);
        const series = await getSeries(filter, sort, page);
        res.json(buildResponse(page, totalPages, series));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch popular series' });
    }
});

router.get('/latest/:page?', async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const filter = { first_air_date: { $lte: new Date().toISOString().split('T')[0] } };
    const sort = { first_air_date: -1 };

    try {
        const { totalPages } = await getPaginationData(filter);
        const series = await getSeries(filter, sort, page);
        res.json(buildResponse(page, totalPages, series));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch latest series' });
    }
});

router.get('/top/:page?', async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const filter = { first_air_date: { $lte: new Date().toISOString().split('T')[0] } };
    const sort = { vote_average: -1 };

    try {
        const { totalPages } = await getPaginationData(filter);
        const series = await getSeries(filter, sort, page);
        res.json(buildResponse(page, totalPages, series));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch top rated series' });
    }
});

router.get('/upcoming/:page?', async (req, res) => {
    const page = parseInt(req.params.page) || 1;
    const filter = { first_air_date: { $gt: new Date().toISOString().split('T')[0] } };
    const sort = { first_air_date: 1 };

    try {
        const { totalPages } = await getPaginationData(filter);
        const series = await getUpcomingSeries(filter, sort, page);
        res.json(buildResponse(page, totalPages, series));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch upcoming series' });
    }
});

router.get('/details/:imdb_id', async (req, res) => {
    const imdbId = req.params.imdb_id;
    try {
        const seriesDetails = await Series.findOne({ imdb_id: imdbId }).exec();
        if (!seriesDetails) {
            return res.status(404).json({ error: 'Series not found' });
        }

        const currentDate = new Date().toISOString().split('T')[0];

        if (seriesDetails.first_air_date <= currentDate) {
            res.json({
                status: 200,
                result: seriesDetails
            });
        } else {
            res.json({
                status: 200,
                message: 'Series is not released yet'
            });
        }
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch series details' });
    }
});

module.exports = router;
