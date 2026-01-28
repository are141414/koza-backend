import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 10000,
});

export const saveKickSession = async (userId, kicks, startTime, endTime, note = null) => {
    try {
        const response = await api.post('/api/tools/kick-counter', {
            user_id: userId,
            start_time: startTime,
            end_time: endTime,
            total_kicks: kicks,
            note: note
        });
        return response.data;
    } catch (error) {
        console.error('Save kick session error:', error);
        throw error;
    }
};

export const logWater = async (userId, amount) => {
    try {
        const response = await api.post('/api/tools/water', {
            user_id: userId,
            amount_ml: amount
        });
        return response.data;
    } catch (error) {
        console.error('Log water error:', error);
        throw error;
    }
};

export const logWeight = async (userId, weight, date = null) => {
    try {
        const response = await api.post('/api/tools/weight', {
            user_id: userId,
            weight_kg: weight,
            date_val: date
        });
        return response.data;
    } catch (error) {
        console.error('Log weight error:', error);
        throw error;
    }
};
