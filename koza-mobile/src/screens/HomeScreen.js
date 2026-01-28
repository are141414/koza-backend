import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { calculatePregnancyStatus, getWeeklyDevelopment } from '../utils/pregnancy';
import { getData, storeData, CACHE_KEYS } from '../utils/cache';

const DEFAULT_LMP = new Date();
DEFAULT_LMP.setDate(DEFAULT_LMP.getDate() - 28); // 4 weeks ago fallback

export default function HomeScreen() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [pregnancyData, setPregnancyData] = useState(null);
    const [developmentData, setDevelopmentData] = useState(null);
    const [userName, setUserName] = useState('');

    const loadData = async (isRefresh = false) => {
        // 1. Get User Profile
        let lmpString = DEFAULT_LMP.toISOString().split('T')[0];
        try {
            const userProfile = await getData(CACHE_KEYS.USER_PROFILE);
            if (userProfile && userProfile.lmp) {
                lmpString = userProfile.lmp;
                if (userProfile.name) setUserName(userProfile.name);
            }
        } catch (e) {
            console.error("Error loading user profile", e);
        }

        // 2. Try to load from cache first if not refreshing explicitly
        if (!isRefresh) {
            const cachedPregnancy = await getData(CACHE_KEYS.PREGNANCY_STATUS);
            const cachedDevelopment = await getData(CACHE_KEYS.WEEKLY_DEVELOPMENT);

            if (cachedPregnancy && cachedDevelopment) {
                setPregnancyData(cachedPregnancy);
                setDevelopmentData(cachedDevelopment);
                setLoading(false); // Show cached content immediately
            }
        }

        try {
            // 3. Fetch fresh data using user's LMP
            const status = await calculatePregnancyStatus(lmpString);
            if (status && status.weeks) {
                setPregnancyData(status);
                storeData(CACHE_KEYS.PREGNANCY_STATUS, status); // Update cache

                const dev = await getWeeklyDevelopment(status.weeks);
                setDevelopmentData(dev);
                storeData(CACHE_KEYS.WEEKLY_DEVELOPMENT, dev); // Update cache
            } else if (!pregnancyData) {
                // Mock data fallback
                const mockData = {
                    weeks: 22,
                    days: 4,
                    due_date: "2026-06-10",
                    trimester: 2,
                    current_week: 22,
                    days_remaining: 135
                };
                setPregnancyData(mockData);
                setDevelopmentData({
                    week: 22,
                    baby_size_comparison: "Muz kadar",
                    development: "Bebeğin tüm organları oluştu"
                });
            }
        } catch (error) {
            console.error('Error loading pregnancy data:', error);
            if (!pregnancyData) {
                 // Fallback to mock data on error if no data shown
                const mockData = {
                    weeks: 22,
                    days: 4,
                    due_date: "2026-06-10",
                    trimester: 2,
                    current_week: 22,
                    days_remaining: 135
                };
                setPregnancyData(mockData);
                setDevelopmentData({
                    week: 22,
                    baby_size_comparison: "Muz kadar",
                    development: "Bebeğin tüm organları oluştu"
                });
            }
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        loadData(true);
    };

    if (loading && !refreshing) {
        return (
            <View style={styles.center}>
                <ActivityIndicator size="large" color="#FF9A9E" />
            </View>
        );
    }

    const week = pregnancyData?.current_week || 13;
    const trimester = pregnancyData?.trimester || 2;
    const daysRemaining = pregnancyData?.days_remaining || 195;
    const progressPercent = Math.min((week / 40) * 100, 100);

    const emojiMap = {
        'Lemon': '🍋',
        'Avocado': '🥑',
        'Lime': '🍈',
        'Lentil': '🥚'
    };
    const randomFruits = ['🥝', '🍇', '🍑', '🥭'];
    const emoji = emojiMap[developmentData?.baby_size_comparison] ||
        randomFruits[week % randomFruits.length] || '👶';

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            >
                <View style={styles.header}>
                    <Text style={styles.greeting}>{userName ? `Merhaba ${userName}! 👋` : 'Hamileliğin Takibi'}</Text>
                    <Text style={styles.weekDisplay}>{week}. Hafta • {trimester}. Trimester</Text>
                </View>

                {/* Progress Card */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>İlerleme</Text>
                    <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
                    </View>
                    <Text style={styles.progressText}>%{Math.floor(progressPercent)} • {daysRemaining} gün kaldı</Text>
                </View>

                {/* Baby Size Card */}
                <View style={styles.card}>
                    <View style={styles.babyContainer}>
                        <Text style={styles.babyEmoji}>{emoji}</Text>
                        <View style={styles.babyInfo}>
                            <Text style={styles.babySize}>
                                Bebeğin {developmentData?.baby_size_comparison || 'bir mango'} kadar!
                            </Text>
                            <Text style={styles.babyStats}>
                                {developmentData?.baby_weight_grams ? Math.floor(developmentData.baby_weight_grams) : '25'}g • {developmentData?.baby_length_mm ? Math.floor(developmentData.baby_length_mm / 10) : '8.7'}cm
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Development Description */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Bu Haftada</Text>
                    <Text style={styles.descriptionText}>
                        {developmentData?.description || 'Bebeğiniz hızla gelişiyor. Parmak izleri oluşuyor!'}
                    </Text>
                </View>

                {/* Tips */}
                <View style={[styles.card, styles.tipCard]}>
                    <Text style={styles.tipTitle}>💡 Anne İçin İpucu</Text>
                    <Text style={styles.tipText}>
                        {developmentData?.mother_advice || 'Bol su içmeyi, düzenli egzersiz yapmayı ve doktorunuzu düzenli ziyaret etmeyi unutmayın!'}
                    </Text>
                </View>

                <View style={{ height: 30 }} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
    },
    greeting: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF9A9E',
    },
    weekDisplay: {
        fontSize: 14,
        color: '#999',
        marginTop: 5,
    },
    card: {
        backgroundColor: '#FFF',
        marginHorizontal: 15,
        marginVertical: 10,
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.08,
        shadowRadius: 3,
        elevation: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FF9A9E',
        marginBottom: 12,
    },
    progressBar: {
        height: 8,
        backgroundColor: '#E8E8E8',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 8,
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#FF9A9E',
    },
    progressText: {
        fontSize: 12,
        color: '#666',
    },
    babyContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    babyEmoji: {
        fontSize: 48,
        marginRight: 15,
    },
    babyInfo: {
        flex: 1,
    },
    babySize: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    babyStats: {
        fontSize: 13,
        color: '#999',
    },
    descriptionText: {
        fontSize: 14,
        color: '#555',
        lineHeight: 20,
    },
    tipCard: {
        backgroundColor: '#FFF3E0',
    },
    tipTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#E65100',
        marginBottom: 8,
    },
    tipText: {
        fontSize: 13,
        color: '#5D4037',
        lineHeight: 18,
    },
});
