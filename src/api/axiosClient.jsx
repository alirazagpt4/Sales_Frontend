import axios from "axios";
console.log("Axios client initialized");

const BASE_URL = 'http://38.242.201.229/api'; 
// const BASE_URL = 'http://localhost:3000/api'; 

const API = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    }
});

API.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;

        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
)

export default API;