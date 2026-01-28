// Replace with your computer's local IP address
// You can find this by running 'ipconfig' (Windows) or 'ifconfig' (Mac/Linux)
export const API_BASE_URL = 'http://192.168.1.104:8000';

export const ENDPOINTS = {
    CALCULATE_PREGNANCY: '/api/pregnancy/calculate',
    WEEKLY_DEVELOPMENT: (week) => `/api/pregnancy/development/${week}`,
};
