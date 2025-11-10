import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:8000/api/student/',
  withCredentials: true, // Important if using cookies for login session
});

export default API;

