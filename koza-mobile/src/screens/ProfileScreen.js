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
import { getData, storeData, CACHE_KEYS } from '../utils/cache';
import { updateUserProfile, getUserProfile } from '../api/pregnancy';

export default function ProfileScreen() {
    const [editMode, setEditMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState(null);
    
    // Form States
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [lastPeriod, setLastPeriod] = useState('');
    const [daysPregnant, setDaysPregnant] = useState(0);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        setLoading(true);
        try {
            // 1. Try Cache First
            const cachedProfile = await getData(CACHE_KEYS.USER_PROFILE);
            if (cachedProfile) {
                setUserId(cachedProfile.user_id);
                setName(cachedProfile.name || '');
                setEmail(cachedProfile.email || '');
                setLastPeriod(cachedProfile.lmp || '');
                
                // Calculate simple progress
                if (cachedProfile.lmp) {
                    const lmp = new Date(cachedProfile.lmp);
                    const diff = new Date() - lmp;
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    setDaysPregnant(days);
                }
            }

            // 2. Refresh from Server if possible
            if (cachedProfile?.user_id) {
                try {
                    const serverData = await getUserProfile(cachedProfile.user_id);
                    // Update state if server has newer/more info
                     if (serverData) {
                         // Note: Server currently returns 'name' as email prefix or generated, 
                         // so rely on local if server name is generic default?
                         // For now trust server if it returns valid data.
                         if (serverData.name) setName(serverData.name);
                         if (serverData.last_period_date) setLastPeriod(serverData.last_period_date);
                     }
                } catch (err) {
                    console.log("Server sync failed, using cache");
                }
            }
        } catch (error) {
            console.error("Profile load error", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert("Hata", "İsim boş olamaz");
            return;
        }

        try {
            setLoading(true);
            
            // 1. Update Backend
            if (userId) {
                await updateUserProfile({
                    user_id: userId,
                    full_name: name,
                    last_period_date: lastPeriod // Assuming format YYYY-MM-DD matches
                });
            }

            // 2. Update Local Cache
            const newProfileData = {
                user_id: userId,
                name: name,
                email: email,
                lmp: lastPeriod
            };
            await storeData(CACHE_KEYS.USER_PROFILE, newProfileData);
            
            setEditMode(false);
            Alert.alert("Başarılı", "Profiliniz güncellendi.");
            
            // Recalculate local stats
            if (lastPeriod) {
                const lmp = new Date(lastPeriod);
                const diff = new Date() - lmp;
                setDaysPregnant(Math.floor(diff / (1000 * 60 * 60 * 24)));
            }

        } catch (error) {
            console.error(error);
            Alert.alert("Hata", "Güncelleme yapılamadı.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.title}>Profil</Text>
                    {loading && <ActivityIndicator size="small" color="#FF9A9E" />}
                </View>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>👩‍🦰</Text>
                    </View>
                    <Text style={styles.daysText}>{daysPregnant} Günlük Hamile</Text>
                </View>

                {/* Profile Info */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Kişisel Bilgiler</Text>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Ad Soyad</Text>
                        <TextInput
                            style={[styles.input, !editMode && styles.inputDisabled]}
                            value={name}
                            onChangeText={setName}
                            editable={editMode}
                            placeholder="Adınız"
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>E-posta</Text>
                        <TextInput
                            style={[styles.input, styles.inputDisabled]} // Email not editable for now
                            value={email}
                            editable={false} 
                            placeholder="E-posta"
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Son Adet Tarihi (YYYY-MM-DD)</Text>
                        <TextInput
                            style={[styles.input, !editMode && styles.inputDisabled]}
                            value={lastPeriod}
                            onChangeText={setLastPeriod}
                            editable={editMode}
                            placeholder="YYYY-MM-DD"
                        />
                    </View>

                    {editMode ? (
                        <View style={styles.buttonGroup}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSave}
                            >
                                <Text style={styles.buttonText}>Kaydet</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.button, styles.buttonSecondary]}
                                onPress={() => setEditMode(false)}
                            >
                                <Text style={styles.buttonSecondaryText}>İptal</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            style={styles.button}
                            onPress={() => setEditMode(true)}
                        >
                            <Text style={styles.buttonText}>Düzenle</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Settings */}
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Ayarlar</Text>

                    <TouchableOpacity style={styles.settingItem}>
                        <Text style={styles.settingLabel}>🔔 Bildirimler</Text>
                        <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.settingItem}>
                         <Text style={styles.settingLabel}>🔒 Gizlilik</Text>
                         <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>
                     <TouchableOpacity style={styles.settingItem}>
                         <Text style={styles.settingLabel}>❓ Yardım & Destek</Text>
                         <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F9FA',
    },
    header: {
        padding: 20,
        backgroundColor: '#FFF',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2D3436',
    },
    avatarContainer: {
        alignItems: 'center',
        padding: 20,
    },
    avatar: {
        width: 100,
        height: 100,
        backgroundColor: '#FFE5E6',
        borderRadius: 50,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        borderWidth: 3,
        borderColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 5,
        elevation: 5,
    },
    avatarText: {
        fontSize: 40,
    },
    daysText: {
        fontSize: 16,
        color: '#636E72',
        fontWeight: '600',
    },
    card: {
        margin: 20,
        marginTop: 0,
        padding: 20,
        backgroundColor: '#FFF',
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 5,
        elevation: 3,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#2D3436',
        marginBottom: 15,
    },
    fieldContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        color: '#636E72',
        marginBottom: 5,
    },
    input: {
        backgroundColor: '#F8F9FA',
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#DFE6E9',
        fontSize: 16,
        color: '#2D3436',
    },
    inputDisabled: {
        backgroundColor: '#F1F2F6',
        color: '#636E72',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 10,
    },
    button: {
        flex: 1,
        backgroundColor: '#FF9A9E',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
    },
    buttonSecondary: {
        backgroundColor: '#F1F2F6',
    },
    buttonText: {
        color: '#FFF',
        fontWeight: 'bold',
        fontSize: 16,
    },
    buttonSecondaryText: {
        color: '#636E72',
        fontWeight: 'bold',
        fontSize: 16,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#F1F2F6',
    },
    settingLabel: {
        fontSize: 16,
        color: '#2D3436',
    },
    settingArrow: {
        fontSize: 20,
        color: '#CBD5E0',
    },
});
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <Text style={styles.settingLabel}>🔐 Gizlilik</Text>
                        <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <Text style={styles.settingLabel}>ℹ️ Hakkında</Text>
                        <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.settingItem}>
                        <Text style={styles.settingLabel}>❓ Yardım</Text>
                        <Text style={styles.settingArrow}>›</Text>
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={[styles.button, styles.logoutButton]}>
                    <Text style={styles.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>

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
    avatarContainer: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    avatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#FFE0E6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontSize: 48,
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 15,
    },
    fieldContainer: {
        marginBottom: 15,
    },
    label: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666',
        marginBottom: 6,
    },
    input: {
        borderWidth: 1,
        borderColor: '#DDD',
        borderRadius: 8,
        paddingHorizontal: 12,
        paddingVertical: 10,
        fontSize: 14,
        color: '#333',
    },
    inputDisabled: {
        backgroundColor: '#F5F5F5',
        color: '#999',
    },
    buttonGroup: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 15,
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
        fontSize: 14,
    },
    buttonSecondaryText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 14,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingLabel: {
        fontSize: 14,
        color: '#333',
    },
    settingArrow: {
        fontSize: 20,
        color: '#DDD',
    },
    logoutButton: {
        marginHorizontal: 15,
        marginVertical: 15,
        backgroundColor: '#FFE8EC',
    },
    logoutText: {
        color: '#FF9A9E',
        fontWeight: '600',
        fontSize: 14,
    },
});
