import AsyncStorage from '@react-native-async-storage/async-storage';

export const CACHE_KEYS = {
    USER_PROFILE: 'user_profile',
    PREGNANCY_STATUS: 'cache_pregnancy_status',
    WEEKLY_DEVELOPMENT: 'cache_weekly_development',
    FORUM_POSTS: 'cache_forum_posts',
};

export const storeData = async (key, value) => {
    try {
        const jsonValue = JSON.stringify(value);
        await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
        console.error('Error storing cached data:', e);
    }
};

export const getData = async (key) => {
    try {
        const jsonValue = await AsyncStorage.getItem(key);
        return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
        console.error('Error reading cached data:', e);
        return null;
    }
};

export const removeData = async (key) => {
    try {
        await AsyncStorage.removeItem(key);
    } catch (e) {
        console.error('Error removing cached data:', e);
    }
};
