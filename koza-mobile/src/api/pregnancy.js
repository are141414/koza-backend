import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 60000,
});

export const calculatePregnancy = async (lmpDate) => {
    try {
        const response = await api.post(ENDPOINTS.CALCULATE_PREGNANCY, { lmp_date: lmpDate });
        return response.data;
    } catch (error) {
        console.error("Error calculating pregnancy:", error);
        throw error;
    }
};

export const getWeeklyDevelopment = async (week) => {
    try {
        const response = await api.get(ENDPOINTS.WEEKLY_DEVELOPMENT(week));
        return response.data;
    } catch (error) {
        console.error("Error fetching weekly development:", error);
        throw error;
    }
};
