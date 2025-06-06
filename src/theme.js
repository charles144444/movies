import { createTheme } from '@mui/material';

const theme = createTheme({
  palette: {
    primary: {
      main: '#e50914', // Matches MovieCard.css button color
    },
    background: {
      default: '#181818',
    },
  },
});

export default theme;