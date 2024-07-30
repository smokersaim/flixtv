const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema({
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

    cast: [{
        name: { type: String },
        character: { type: String }
    }],

    created_by: [{ type: String }],

    crew: [{
        name: { type: String },
        role: { type: String }
    }],

    episodes_count: { type: Number },

    first_air_date: { type: String },

    genres: [{ type: String }],

    homepage: { type: String },

    in_production: { type: String },

    keywords: [{ type: String }],

    languages: [{ type: String }],

    networks: [{
        network_country: { type: String },
        network_name: { type: String },
        network_logo: { type: String }
    }],

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

    reviews: [{
        author: { type: String },
        rating: { type: Number },
        updated_at: { type: Date }
    }],

    seasons_count: { type: Number },

    seasons_list: [{
        season_id: { type: Number },
        season_name: { type: String },
        season_number: { type: Number },
        episode_count: { type: Number },
        vote_average: { type: Number },
        air_date: { type: String },
        episodes: [{
            episode_id: { type: Number },
            episode_name: { type: String },
            episode_number: { type: Number },
            season_number: { type: Number },
            vote_average: { type: Number },
            vote_count: { type: Number },
            air_date: { type: String },
            runtime: { type: Number },
            still_path: { type: String },
            overview: { type: String }
        }]
    }],

    status: { type: String },

    tagline: { type: String },

    vote_average: { type: Number },

    vote_count: { type: Number }
});

seriesSchema.methods.toClient = function () {
    return {
        id: this._id,
        imdb_id: this.imdb_id,
        tmdb_id: this.tmdb_id,
        title: this.title,
        type: this.type,
        backdrops: this.backdrops,
        cast: this.cast,
        created_by: this.created_by,
        crew: this.crew,
        episode_count: this.episode_count,
        first_air_date: this.first_air_date,
        genres: this.genres,
        homepage: this.homepage,
        in_production: this.in_production,
        keywords: this.keywords,
        languages: this.languages,
        networks: this.networks,
        overview: this.overview,
        popularity: this.popularity,
        posters: this.posters,
        production_companies: this.production_companies,
        production_countries: this.production_countries,
        reviews: this.reviews,
        seasons_count: this.seasons_count,
        seasons_list: this.seasons_list,
        status: this.status,
        tagline: this.tagline,
        vote_average: this.vote_average,
        vote_count: this.vote_count
    };
};

const Series = mongoose.model('Series', seriesSchema);

module.exports = Series;
