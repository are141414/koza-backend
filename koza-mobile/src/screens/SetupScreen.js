import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { storeData, CACHE_KEYS } from '../utils/cache';

export default function SetupScreen({ navigation }) {
    const [name, setName] = useState('');
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');

    const handleSave = async () => {
        if (!name.trim()) {
            Alert.alert('Hata', 'Lütfen isminizi giriniz.');
            return;
        }

        if (!day || !month || !year) {
            Alert.alert('Hata', 'Lütfen son adet tarihinizi tam giriniz.');
            return;
        }

        const dateString = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const date = new Date(dateString);

        if (isNaN(date.getTime())) {
             Alert.alert('Hata', 'Geçersiz tarih.');
             return;
        }

        const profileData = {
            name: name,
            lmp: dateString,
        };

        await storeData(CACHE_KEYS.USER_PROFILE, profileData);
        
        // Reset navigation to Main
        navigation.reset({
            index: 0,
            routes: [{ name: 'Main' }],
        });
    };

    return (
        <SafeAreaView style={styles.container}>
             <View style={styles.content}>
                <Text style={styles.title}>Hoşgeldin Anne Adayı! 🤰</Text>
                <Text style={styles.subtitle}>Seni ve bebeğini daha iyi tanımamız için birkaç bilgiye ihtiyacımız var.</Text>
                
                <View style={styles.inputContainer}>
                    <Text style={styles.label}>İsminiz</Text>
                    <TextInput 
                        style={styles.input} 
                        placeholder="Adınız" 
                        value={name}
                        onChangeText={setName}
                    />
                </View>

                <View style={styles.inputContainer}>
                    <Text style={styles.label}>Son Adet Tarihi (SAT)</Text>
                    <View style={styles.dateRow}>
                         <TextInput 
                            style={[styles.input, styles.dateInput]} 
                            placeholder="GÜN" 
                            keyboardType="numeric"
                            maxLength={2}
                            value={day}
                            onChangeText={setDay}
                        />
                        <TextInput 
                            style={[styles.input, styles.dateInput]} 
                            placeholder="AY" 
                            keyboardType="numeric"
                            maxLength={2}
                            value={month}
                            onChangeText={setMonth}
                        />
                        <TextInput 
                            style={[styles.input, styles.dateInput]} 
                            placeholder="YIL" 
                            keyboardType="numeric"
                            maxLength={4}
                            value={year}
                            onChangeText={setYear}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.button} onPress={handleSave}>
                    <Text style={styles.buttonText}>Başla</Text>
                </TouchableOpacity>
             </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FCFCFC',
    },
    content: {
        padding: 20,
        justifyContent: 'center',
        flex: 1,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FF9A9E',
        marginBottom: 10,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 22,
    },
    inputContainer: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
        fontWeight: '600',
    },
    input: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#EEE',
        borderRadius: 12,
        padding: 15,
        fontSize: 16,
    },
    dateRow: {
        flexDirection: 'row',
        gap: 10,
    },
    dateInput: {
        flex: 1,
        textAlign: 'center',
    },
    button: {
        backgroundColor: '#FF9A9E',
        padding: 18,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 20,
        shadowColor: '#FF9A9E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    buttonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
