const express = require('express');
const router = express.Router();
const Movie = require('../models/Movie');
const Series = require('../models/Series');

const ITEMS_PER_PAGE = 24;

const updateGenreCounts = (genresMap, genreStr, countField, countValue) => {
    const genres = genreStr.split('&').map(g => g.trim());
    genres.forEach((genre) => {
        if (genresMap.has(genre)) {
            genresMap.get(genre)[countField] += countValue;
        } else {
            genresMap.set(genre, { name: genre, movies_count: 0, series_count: 0 });
            genresMap.get(genre)[countField] = countValue;
        }
    });
};

const getPaginationData = async (filter) => {
    const totalMovies = await Movie.countDocuments(filter);
    const totalSeries = await Series.countDocuments(filter);
    const total = totalMovies + totalSeries;
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

router.get('/categories', async (req, res) => {
    const currentDate = new Date();

    const genreMapping = {
        'Sci-Fi': 'Science Fiction',
    };

    try {
        const movieGenres = await Movie.aggregate([
            { $match: { release: { $lte: currentDate.toISOString() } } },
            { $unwind: { path: '$genres', preserveNullAndEmptyArrays: true } },
            { $project: { genre: { $split: ['$genres', ' & '] }, backdrop_path: { $arrayElemAt: ['$backdrops.backdrop_path', 0] } } },
            { $unwind: '$genre' },
            { $group: { _id: '$genre', movies_count: { $sum: 1 }, backdrops: { $addToSet: '$backdrop_path' } } },
            { $project: { _id: 0, name: '$_id', movies_count: 1, backdrops: { $first: '$backdrops' } } }
        ]);

        const seriesGenres = await Series.aggregate([
            { $match: { first_air_date: { $lte: currentDate.toISOString() } } },
            { $unwind: { path: '$genres', preserveNullAndEmptyArrays: true } },
            { $project: { genre: { $split: ['$genres', ' & '] } } },
            { $unwind: '$genre' },
            { $group: { _id: '$genre', series_count: { $sum: 1 } } },
            { $project: { _id: 0, name: '$_id', series_count: 1 } }
        ]);

        const genresMap = new Map();

        movieGenres.forEach((genre) => {
            const mappedName = genreMapping[genre.name] || genre.name;
            if (!genresMap.has(mappedName)) {
                genresMap.set(mappedName, {
                    name: mappedName,
                    movies_count: genre.movies_count,
                    series_count: 0,
                    total: genre.movies_count,
                    backdrop_path: genre.backdrops || null
                });
            }
        });

        seriesGenres.forEach((genre) => {
            const mappedName = genreMapping[genre.name] || genre.name;
            const genreData = genresMap.get(mappedName) || {
                name: mappedName,
                movies_count: 0,
                series_count: 0,
                total: 0,
                backdrop_path: null
            };
            genreData.series_count = genre.series_count;
            genreData.total = genreData.movies_count + genreData.series_count;
            genresMap.set(mappedName, genreData);
        });

        const categories = Array.from(genresMap.values());
        categories.sort((a, b) => a.name.localeCompare(b.name));

        res.json(categories);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

router.get('/', async (req, res) => {
    const title = req.query.keywords;
    const genre = req.query.genre;
    const page = parseInt(req.query.page) || 1;
    const currentDate = new Date();

    if (!title && !genre) {
        return res.status(400).json({ error: 'Either keywords or genre parameter is required' });
    }

    try {
        const titleRegex = title ? new RegExp(title, 'i') : null;
        const genreRegex = genre ? new RegExp(`(^|\\s)&?${genre}&?($|\\s)`, 'i') : null;

        const movieFilter = {
            ...(title && { title: { $regex: titleRegex } }),
            ...(genre && { genres: { $regex: genreRegex } }),
            release: { $lte: currentDate.toISOString() }
        };

        const seriesFilter = {
            ...(title && { title: { $regex: titleRegex } }),
            ...(genre && { genres: { $regex: genreRegex } }),
            first_air_date: { $lte: currentDate.toISOString() }
        };

        const { total, totalPages } = await getPaginationData({ $or: [movieFilter, seriesFilter] });

        const movieResults = await Movie.aggregate([
            { $match: movieFilter },
            {
                $project: {
                    imdb_id: 1,
                    type: { $literal: 'Movie' },
                    title: 1,
                    genre: { $arrayElemAt: ['$genres', 0] },
                    release: { $year: { $dateFromString: { dateString: '$release' } } },
                    rating: { $ifNull: [{ $round: ['$vote_average', 1] }, 0.0] },
                    poster_path: { $arrayElemAt: ['$posters.poster_path', 0] },
                    backdrop_path: { $arrayElemAt: ['$backdrops.backdrop_path', 0] }
                }
            },
            { $sort: { release_date: -1 } },
            { $skip: (page - 1) * ITEMS_PER_PAGE },
            { $limit: ITEMS_PER_PAGE }
        ]);

        const seriesResults = await Series.aggregate([
            { $match: seriesFilter },
            {
                $project: {
                    imdb_id: 1,
                    type: { $literal: 'TV' },
                    title: 1,
                    genre: { $arrayElemAt: ['$genres', 0] },
                    release: { $year: { $dateFromString: { dateString: '$first_air_date' } } },
                    rating: { $ifNull: [{ $round: ['$vote_average', 1] }, 0.0] },
                    poster_path: { $arrayElemAt: ['$posters.poster_path', 0] },
                    backdrop_path: { $arrayElemAt: ['$backdrops.backdrop_path', 0] }
                }
            },
            { $sort: { release_date: -1 } },
            { $skip: (page - 1) * ITEMS_PER_PAGE },
            { $limit: ITEMS_PER_PAGE }
        ]);

        const results = [...movieResults, ...seriesResults].sort((a, b) => new Date(b.release) - new Date(a.release));

        if (genre) {
            results.forEach(item => {
                item.genre = genre;
            });
        }

        res.json(buildResponse(page, totalPages, results));
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch search results' });
    }
});

module.exports = router;
