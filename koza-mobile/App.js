import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import ForumScreen from './src/screens/ForumScreen';
import ToolsScreen from './src/screens/ToolsScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Tab = createBottomTabNavigator();

export default function App() {
    return (
        <NavigationContainer>
            <Tab.Navigator
                screenOptions={({ route }) => ({
                    tabBarIcon: ({ focused, color, size }) => {
                        let iconName;

                        if (route.name === 'Ana Sayfa') {
                            iconName = focused ? 'home' : 'home-outline';
                        } else if (route.name === 'Forum') {
                            iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                        } else if (route.name === 'Araçlar') {
                            iconName = focused ? 'grid' : 'grid-outline';
                        } else if (route.name === 'Profil') {
                            iconName = focused ? 'person' : 'person-outline';
                        }

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
                <Tab.Screen 
                    name="Ana Sayfa" 
                    component={HomeScreen}
                    options={{ title: 'Ana Sayfa' }}
                />
                <Tab.Screen 
                    name="Forum" 
                    component={ForumScreen}
                    options={{ title: 'Forum' }}
                />
                <Tab.Screen 
                    name="Araçlar" 
                    component={ToolsScreen}
                    options={{ title: 'Araçlar' }}
                />
                <Tab.Screen 
                    name="Profil" 
                    component={ProfileScreen}
                    options={{ title: 'Profil' }}
                />
            </Tab.Navigator>
        </NavigationContainer>
    );
}
