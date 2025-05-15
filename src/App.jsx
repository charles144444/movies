import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import MovieCard from './components/MovieCard.jsx';
import Login from './components/Login.jsx';
import Signup from './components/Signup.jsx';

const App = () => {
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(() => {
    // Restore user from localStorage on initial render
    const token = localStorage.getItem('token');
    if (token) {
      try {
        return jwtDecode(token);
      } catch (error) {
        console.error('Invalid token:', error);
        localStorage.removeItem('token');
        return null;
      }
    }
    return null;
  });
  const navigate = useNavigate();
  const TMDB_API_KEY = '1fe39a410c7711deebac58b390ca37bd'; // Replace with your TMDB API key

  useEffect(() => {
    if (user) {
      // Fetch popular movies from TMDB
      axios
        .get(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`)
        .then((response) => setMovies(response.data.results))
        .catch((error) => console.error('Error fetching movies:', error));

      // Fetch user's favorite movies from backend
      axios
        .get('http://localhost:5000/api/favorites', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        })
        .then((response) => setFavorites(response.data))
        .catch((error) => console.error('Error fetching favorites:', error));
    }
  }, [user]);

  const addToFavorites = async (movie) => {
    try {
      const response = await axios.post(
        'http://localhost:5000/api/favorites',
        {
          tmdb_id: movie.id,
          title: movie.title,
          poster_path: movie.poster_path,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }
      );
      setFavorites([...favorites, response.data]);
    } catch (error) {
      console.error('Error adding to favorites:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setFavorites([]);
    navigate('/login');
  };

  const ProtectedRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <div className="app-container">
      <header className="header">
        <h1>MovieFlix</h1>
        {user && (
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        )}
      </header>
      <Routes>
        <Route path="/login" element={<Login setUser={setUser} />} />
        <Route path="/signup" element={<Signup setUser={setUser} />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <main className="main">
                <h2>Popular Movies</h2>
                <div className="movie-grid">
                  {movies.map((movie) => (
                    <MovieCard
                      key={movie.id}
                      movie={movie}
                      isFavorite={favorites.some((fav) => fav.tmdb_id === movie.id)}
                      onAddToFavorites={() => addToFavorites(movie)}
                    />
                  ))}
                </div>
              </main>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </div>
  );
};

export default App;