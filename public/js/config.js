const API_URL = window.location.port === '5500'
    ? 'http://localhost:3000'
    : '';

export default API_URL;