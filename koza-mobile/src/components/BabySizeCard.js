import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function BabySizeCard({ data }) {
    if (!data) return null;

    const emojiMap = { "Lemon": "🍋", "Avocado": "🥑", "Lime": "🍈", "Lentil": "🥚" };
    const randomFruits = ["🥝", "🍇", "🍑", "🥭"];
    const emoji = emojiMap[data.baby_size_comparison] || randomFruits[data.current_week % randomFruits.length] || "👶";

    const progressPercent = Math.min((data.current_week / 40) * 100, 100);

    return (
        <View style={styles.card}>
            <View style={styles.content}>
                <View style={styles.visual}>
                    <View style={styles.fruitCircle}>
                        <Text style={styles.fruitIcon}>{emoji}</Text>
                    </View>
                </View>

                <View style={styles.info}>
                    <Text style={styles.title}>Bebeğin bir {data.baby_size_comparison || "Mucize"} kadar!</Text>
                    <Text style={styles.summary} numberOfLines={2}>
                        {data.description || "Bebeğin hızla büyüyor..."}
                    </Text>

                    <View style={styles.statsRow}>
                        <Text style={styles.stat}>{Math.floor(data.baby_weight_grams)}g</Text>
                        <Text style={styles.stat}>•</Text>
                        <Text style={styles.stat}>{Math.floor(data.baby_length_mm / 10)}cm</Text>
                    </View>
                </View>
            </View>

            <View style={styles.footer}>
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBar, { width: `${progressPercent}%` }]} />
                </View>
                <View style={styles.progressLabels}>
                    <Text style={styles.progressText}>{data.current_week}. Hafta</Text>
                    <Text style={styles.progressText}>%{Math.floor(progressPercent)} Tamamlandı</Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#F8BBD0', // Soft Pink
        borderRadius: 20,
        padding: 20,
        margin: 20,
        elevation: 5, // Android shadow
        shadowColor: '#000', // iOS shadow
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    content: {
        flexDirection: 'row',
        marginBottom: 15,
    },
    visual: {
        marginRight: 15,
        justifyContent: 'center',
    },
    fruitCircle: {
        width: 70,
        height: 70,
        borderRadius: 35,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fruitIcon: {
        fontSize: 35,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#880E4F',
        marginBottom: 5,
    },
    summary: {
        fontSize: 14,
        color: '#4A4A4A',
        marginBottom: 5,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stat: {
        fontSize: 12,
        fontWeight: 'bold',
        color: '#666',
        marginRight: 5,
    },
    footer: {},
    progressContainer: {
        height: 8,
        backgroundColor: 'rgba(255,255,255,0.5)',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 5,
    },
    progressBar: {
        height: '100%',
        backgroundColor: '#C2185B',
    },
    progressLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    progressText: {
        fontSize: 12,
        color: '#880E4F',
    }
});
