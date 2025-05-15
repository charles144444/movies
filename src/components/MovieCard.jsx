const MovieCard = ({ movie, isFavorite, onAddToFavorites }) => {
  return (
    <div className="movie-card">
      <img
        src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
        alt={movie.title}
        className="movie-poster"
      />
      <div className="movie-info">
        <h3>{movie.title}</h3>
        <p>{movie.release_date}</p>
        <button
          onClick={onAddToFavorites}
          disabled={isFavorite}
          className={isFavorite ? 'button-disabled' : 'button'}
        >
          {isFavorite ? 'Added' : 'Add to Favorites'}
        </button>
      </div>
    </div>
  );
};

export default MovieCard;