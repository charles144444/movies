import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Box, Button, Typography, CircularProgress, Alert, AppBar, Toolbar, Container, Grid } from '@mui/material';
import MovieCard from './components/MovieCard';
import Login from './components/Login';
import Signup from './components/Signup';
import './App.css';

const App = () => {
  const [movies, setMovies] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [heroMovie, setHeroMovie] = useState(null);
  const [user, setUser] = useState(() => {
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'; // Set to Render URL in .env
  const TMDB_API_KEY = '1fe39a410c7711deebac58b390ca37bd';

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        // Fetch popular movies from TMDB
        const movieResponse = await axios.get(
          `https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}`
        );
        const moviesData = movieResponse.data.results || [];
        setMovies(moviesData);

        if (moviesData.length > 0) {
          const randomIndex = Math.floor(Math.random() * moviesData.length);
          setHeroMovie(moviesData[randomIndex]);
        }

        // Fetch user's favorites from backend
        const token = localStorage.getItem('token');
        if (token) {
          console.log('Fetching favorites from:', `${API_URL}/api/favorites`); // Debug URL
          const favoritesResponse = await axios.get(`${API_URL}/api/favorites`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          setFavorites(favoritesResponse.data || []);
        }
      } catch (err) {
        console.error('Fetch error:', {
          message: err.message,
          status: err.response?.status,
          data: err.response?.data,
          url: err.config?.url,
        });
        setError(err.response?.data?.error || 'Failed to fetch data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, API_URL]);

  const addToFavorites = async (movie) => {
    if (!movie || !movie.id) {
      setError('Invalid movie data');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Please log in to add favorites');
        navigate('/login');
        return;
      }
      console.log('Adding favorite to:', `${API_URL}/api/favorites`); // Debug URL
      const response = await axios.post(
        `${API_URL}/api/favorites`,
        {
          tmdb_id: movie.id,
          title: movie.title || 'Unknown Title',
          poster_path: movie.poster_path || '',
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setFavorites([...favorites, response.data]);
    } catch (err) {
      console.error('Add favorite error:', {
        message: err.message,
        status: err.response?.status,
        data: err.response?.data,
        url: err.config?.url,
      });
      setError(err.response?.data?.error || 'Failed to add to favorites');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setFavorites([]);
    setMovies([]);
    setHeroMovie(null);
    navigate('/login');
  };

  const ProtectedRoute = ({ children }) => {
    return user ? children : <Navigate to="/login" />;
  };

  return (
    <Box className="app-container" sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            MovieFlix
          </Typography>
          {user && (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {error && (
          <Alert severity="error" onClose={() => setError('')} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', my: 2 }} />}
        <Routes>
          <Route path="/login" element={<Login setUser={setUser} />} />
          <Route path="/signup" element={<Signup setUser={setUser} />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Box>
                  {heroMovie && (
                    <Box
                      sx={{
                        backgroundImage: `url(https://image.tmdb.org/t/p/original${heroMovie.backdrop_path || ''})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        color: 'white',
                        p: { xs: 2, md: 4 },
                        borderRadius: 2,
                        mb: 4,
                        position: 'relative',
                        '&:before': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'rgba(0,0,0,0.5)',
                          borderRadius: 2,
                        },
                      }}
                    >
                      <Box sx={{ position: 'relative', maxWidth: 600, p: 3 }}>
                        <Typography variant="h4" gutterBottom>
                          {heroMovie.title || 'No Title'}
                        </Typography>
                        <Typography variant="body1" paragraph>
                          {heroMovie.overview || 'No description available'}
                        </Typography>
                        <Button
                          variant="contained"
                          color="primary"
                          onClick={() => addToFavorites(heroMovie)}
                          disabled={favorites.some((fav) => fav.tmdb_id === heroMovie.id)} // Fixed bug
                        >
                          {favorites.some((fav) => fav.tmdb_id === heroMovie.id)
                            ? 'Added'
                            : 'Add to Favorites'}
                        </Button>
                      </Box>
                    </Box>
                  )}
                  <Typography variant="h5" gutterBottom>
                    Popular Movies
                  </Typography>
                  <Grid container spacing={2}>
                    {movies.length > 0 ? (
                      movies.map((movie) => (
                        <Grid item xs={12} sm={6} md={4} lg={3} key={movie.id || Math.random()}>
                          <MovieCard
                            movie={movie}
                            isFavorite={favorites.some((fav) => fav.tmdb_id === movie.id)}
                            onAddToFavorites={() => addToFavorites(movie)}
                          />
                        </Grid>
                      ))
                    ) : (
                      <Typography>No movies available</Typography>
                    )}
                  </Grid>
                </Box>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </Container>
    </Box>
  );
};

export default App;