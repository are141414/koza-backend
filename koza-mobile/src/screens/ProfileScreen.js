import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ProfileScreen() {
    const [editMode, setEditMode] = useState(false);
    const [email, setEmail] = useState('anne@example.com');
    const [name, setName] = useState('Ayşe');
    const [lastPeriod, setLastPeriod] = useState('2024-10-03');

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView>
                <View style={styles.header}>
                    <Text style={styles.title}>Profil</Text>
                </View>

                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>👩‍🦰</Text>
                    </View>
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
                            style={[styles.input, !editMode && styles.inputDisabled]}
                            value={email}
                            onChangeText={setEmail}
                            editable={editMode}
                            placeholder="E-posta"
                        />
                    </View>

                    <View style={styles.fieldContainer}>
                        <Text style={styles.label}>Son Menstrüasyon Tarihi</Text>
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
                                onPress={() => setEditMode(false)}
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
