import { API_BASE_URL } from '../config';

export const registerUser = async (name, deviceId = null) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, device_id: deviceId }),
        });

        if (!response.ok) {
            throw new Error('Registration failed');
        }

        return await response.json();
    } catch (error) {
        console.error('Registration error:', error);
        throw error;
    }
};
