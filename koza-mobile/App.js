import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import ForumScreen from './src/screens/ForumScreen';
import ToolsScreen from './src/screens/ToolsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SetupScreen from './src/screens/SetupScreen';

import { getData, CACHE_KEYS } from './src/utils/cache';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;
                    if (route.name === 'Ana Sayfa') iconName = focused ? 'home' : 'home-outline';
                    else if (route.name === 'Forum') iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    else if (route.name === 'Araçlar') iconName = focused ? 'grid' : 'grid-outline';
                    else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
                    return <Ionicons name={iconName} size={size} color={color} />;
                },
                tabBarActiveTintColor: '#FF9A9E',
                tabBarInactiveTintColor: '#CCC',
                headerShown: false,
                tabBarStyle: {
                    borderTopWidth: 1,
                    borderTopColor: '#F0F0F0',
                    paddingBottom: 5,
                    height: 55,
                }
            })}
        >
            <Tab.Screen name="Ana Sayfa" component={HomeScreen} options={{ title: 'Ana Sayfa' }} />
            <Tab.Screen name="Forum" component={ForumScreen} options={{ title: 'Forum' }} />
            <Tab.Screen name="Araçlar" component={ToolsScreen} options={{ title: 'Araçlar' }} />
            <Tab.Screen name="Profil" component={ProfileScreen} options={{ title: 'Profil' }} />
        </Tab.Navigator>
    );
}

export default function App() {
    const [isLoading, setIsLoading] = useState(true);
    const [initialRoute, setInitialRoute] = useState('Setup');

    useEffect(() => {
        const checkUser = async () => {
            try {
                const userProfile = await getData(CACHE_KEYS.USER_PROFILE);
                if (userProfile && userProfile.lmp) {
                    setInitialRoute('Main');
                }
            } catch (e) {
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };
        checkUser();
    }, []);

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' }}>
                <ActivityIndicator size="large" color="#FF9A9E" />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
                <Stack.Screen name="Setup" component={SetupScreen} />
                <Stack.Screen name="Main" component={MainTabs} />
            </Stack.Navigator>
        </NavigationContainer>
    );
}
