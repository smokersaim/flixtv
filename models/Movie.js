const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
    imdb_id: { type: String, required: true },
    tmdb_id: { type: String, required: true },
    title: { type: String, required: true },
    type: { type: String, required: true },

    backdrops: [{
        height: { type: Number },
        width: { type: Number },
        aspect_ratio: { type: Number },
        vote_count: { type: Number },
        vote_average: { type: Number },
        poster_path: { type: String }
    }],

    budget: { type: Number },

    cast: [{
        name: { type: String },
        character: { type: String }
    }],

    collection: [{
        id: { type: Number },
        name: { type: String },
        poster_path: { type: String },
        backdrop_path: { type: String }
    }],

    country: [{ type: String }],

    crew: [{
        name: { type: String },
        role: { type: String }
    }],

    genres: [{ type: String }],

    homepage: { type: String },

    keywords: [{ type: String }],

    languages: [{ type: String }],

    overview: { type: String },

    popularity: { type: Number },

    posters: [{
        height: { type: Number },
        width: { type: Number },
        aspect_ratio: { type: Number },
        vote_count: { type: Number },
        vote_average: { type: Number },
        poster_path: { type: String }
    }],

    production_companies: [{
        company_country: { type: String },
        company_name: { type: String },
        company_logo: { type: String }
    }],

    production_countries: [{ type: String }],

    release: { type: String },

    release_dates: [{
        iso: { type: String },
        note: { type: String },
        release_date: { type: Date }
    }],

    revenue: { type: Number },

    reviews: [{
        author: { type: String },
        rating: { type: Number },
        updated_at: { type: Date }
    }],

    runtime: { type: Number },

    tagline: { type: String },

    vote_average: { type: Number },

    vote_count: { type: Number }
});

movieSchema.methods.toClient = function () {
    return {
        id: this._id,
        imdb_id: this.imdb_id,
        tmdb_id: this.tmdb_id,
        title: this.title,
        type: this.type,
        backdrops: this.backdrops,
        budget: this.budget,
        cast: this.cast,
        collection: this.collection,
        country: this.country,
        crew: this.crew,
        genres: this.genres,
        homepage: this.homepage,
        keywords: this.keywords,
        languages: this.languages,
        overview: this.overview,
        popularity: this.popularity,
        posters: this.posters,
        production_companies: this.production_companies,
        production_countries: this.production_countries,
        release_date: this.release,
        release_dates: this.release_dates,
        revenue: this.revenue,
        reviews: this.reviews,
        runtime: this.runtime,
        tagline: this.tagline,
        vote_average: this.vote_average,
        vote_count: this.vote_count
    };
};

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
