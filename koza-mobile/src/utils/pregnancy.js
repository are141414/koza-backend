const TOTAL_PREGNANCY_DAYS = 280;
const API_BASE_URL = 'http://10.43.164.239:9000';

export const calculatePregnancyStatus = async (lmpString) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pregnancy/calculate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lmp_date: lmpString })
        });
        return await response.json();
    } catch (error) {
        console.error('Pregnancy calculation error:', error);
        return null;
    }
};

export const getWeeklyDevelopment = async (week) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/pregnancy/development/${week}`);
        return await response.json();
    } catch (error) {
        console.error('Weekly development error:', error);
        return null;
    }
};

export const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + ' yıl önce';
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + ' ay önce';
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + ' gün önce';
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + ' saat önce';
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + ' dk önce';
    return Math.floor(seconds) + ' sn önce';
};
