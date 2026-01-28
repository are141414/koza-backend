import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getData, CACHE_KEYS } from '../utils/cache';
import { saveKickSession, logWater } from '../api/tools';

export default function ToolsScreen() {
    const [userId, setUserId] = useState(null);
    const [kickCount, setKickCount] = useState(0);
    const [kickStartTime, setKickStartTime] = useState(null);
    const [weight, setWeight] = useState('');
    const [waterIntake, setWaterIntake] = useState(0);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const loadUser = async () => {
            const profile = await getData(CACHE_KEYS.USER_PROFILE);
            if (profile && profile.user_id) {
                setUserId(profile.user_id);
            }
        };
        loadUser();
    }, []);

    const addKick = () => {
        if (kickCount === 0) {
            setKickStartTime(new Date());
        }
        setKickCount(kickCount + 1);
    };

    const resetKicks = () => {
        Alert.alert(
            "Sıfırla", 
            "Tekme sayacını sıfırlamak istiyor musunuz? İsterseniz kaydedebilirsiniz.",
            [
                { text: "İptal", style: "cancel" },
                { text: "Sıfırla", onPress: () => {
                    setKickCount(0);
                    setKickStartTime(null);
                }},
                { text: "Kaydet ve Sıfırla", onPress: saveAndResetKicks }
            ]
        );
    };

    const saveAndResetKicks = async () => {
        if (!userId) {
            Alert.alert("Hata", "Kullanıcı bulunamadı.");
            return;
        }
        try {
            setLoading(true);
            const endTime = new Date();
            const start = kickStartTime || endTime; // fallback if single kick
            await saveKickSession(userId, kickCount, start.toISOString(), endTime.toISOString());
            Alert.alert("Başarılı", "Tekme seansı kaydedildi.");
            setKickCount(0);
            setKickStartTime(null);
        } catch (error) {
            Alert.alert("Hata", "Kaydedilemedi.");
        } finally {
            setLoading(false);
        }
    };

    const addWater = async () => {
        const newAmount = waterIntake + 250;
        setWaterIntake(newAmount);
        
        if (userId) {
            try {
                // Log single glass (250ml)
                await logWater(userId, 250);
            } catch (error) {
                console.error("Failed to log water");
            }
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.title}>Araçlar</Text>
                    <Text style={styles.subtitle}>Hamileliğini takip et</Text>
                    {loading && <ActivityIndicator size="small" color="#FF9A9E" />}
                </View>

                {/* Kick Counter */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>👶 Tekme Sayar</Text>
                    <Text style={styles.kickCount}>{kickCount}</Text>
                    <Text style={styles.kickLabel}>tekme</Text>
                    {kickStartTime && (
                        <Text style={styles.timerText}>
                            Başlangıç: {kickStartTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Text>
                    )}

                    <View style={styles.buttonGroup}>
                        <TouchableOpacity style={styles.button} onPress={addKick}>
                            <Text style={styles.buttonText}>Tekme Ekle</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.buttonSecondary]}
                            onPress={resetKicks}
                        >
                            <Text style={styles.buttonSecondaryText}>Sıfırla</Text>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Weight Tracker */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>⚖️ Kilo Takibi</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="Kilonuzu girin (kg)"
                        placeholderTextColor="#999"
                        keyboardType="decimal-pad"
                        value={weight}
                        onChangeText={setWeight}
                    />
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Kaydet</Text>
                    </TouchableOpacity>
                </View>

                {/* Water Intake */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>💧 Su İçme Takibi</Text>
                    <Text style={styles.waterCount}>{waterIntake} ml</Text>
                    <Text style={styles.waterLabel}>Günlük hedef: 2000 ml</Text>

                    <TouchableOpacity style={styles.button} onPress={addWater}>
                        <Text style={styles.buttonText}>250ml Su Ekle</Text>
                    </TouchableOpacity>
                </View>

                {/* Hospital Bag */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>🏥 Hastane Çantası</Text>
                    <Text style={styles.toolDescription}>
                        Hastaneye götürecekleri listesi hazırla
                    </Text>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Listeyi Görüntüle</Text>
                    </TouchableOpacity>
                </View>

                {/* Baby Names */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>👼 Bebek Isimleri</Text>
                    <Text style={styles.toolDescription}>
                        Hoşlandığın isimleri kaydet
                    </Text>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>İsimler</Text>
                    </TouchableOpacity>
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
    header: {
        paddingHorizontal: 20,
        paddingTop: 15,
        paddingBottom: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FF9A9E',
    },
    subtitle: {
        fontSize: 13,
        color: '#999',
        marginTop: 4,
    },
    card: {
        backgroundColor: '#FFF',
        marginHorizontal: 15,
        marginVertical: 10,
        padding: 15,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 12,
    },
    kickCount: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FF9A9E',
        textAlign: 'center',
    },
    kickLabel: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginBottom: 15,
    },
    waterCount: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#4DB8FF',
        textAlign: 'center',
    },
    waterLabel: {
        fontSize: 12,
        color: '#999',
        textAlign: 'center',
        marginBottom: 15,
    },
    toolDescription: {
        fontSize: 13,
        color: '#666',
        marginBottom: 12,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        marginBottom: 12,
        color: '#333',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 10,
    },
    button: {
        flex: 1,
        backgroundColor: '#FF9A9E',
        paddingVertical: 12,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonSecondary: {
        backgroundColor: '#F0F0F0',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: '600',
        fontSize: 13,
    },
    buttonSecondaryText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 13,
    },
});
