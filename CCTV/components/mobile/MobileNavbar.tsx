import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const TABS = [
    { name: 'Home', icon: 'home-outline' as const},
    { name: 'Feed', icon: 'logo-rss' as const},
    { name: 'VOD', icon: 'play-circle-outline' as const},
    { name: 'Settings', icon: 'settings-outline' as const},
    { name: 'Profile', icon: 'person-outline' as const}
];

interface MobileNavbarProps {
    activeMobilePage: string;
    onMobilePageChange: (pageName: string) => void;
}

export default function MobileNavbar({ activeMobilePage, onMobilePageChange }: MobileNavbarProps) {
    const [activeTab, setActiveTab] = useState('Home');

    const handleMenuItemPress = (pageName: string) => {
        onMobilePageChange(pageName);
        setActiveTab(pageName);
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {TABS.map((tab) => (
                    <Pressable
                        key={tab.name}
                        style={styles.tab}
                        onPress={() => handleMenuItemPress(tab.name)}
                    >
                        <Ionicons
                        name={tab.icon}
                        size={24}
                        color='#FFFFFF' />
                        <Text style={
                            [styles.tabLabel,
                            { color: activeTab === tab.name ? '#007AFF' : '#8e8e93' }
                        ]}>
                            {tab.name}
                        </Text>
                    </Pressable>
                ))}
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    safeArea: {
        backgroundColor: '#ffffff',
        // Add a top shadow for a professional look
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: -2, // Shadow on the top side
        },
        shadowOpacity: 0.05,
        shadowRadius: 3.84,
        elevation: 8, // for Android
    },
    container: {
        backgroundColor: '#292929',
        flexDirection: 'row',
        justifyContent: 'space-around',
        height: 60,
        paddingBottom: 5,
        paddingTop: 5,
    },
    tab: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tabIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '500',
    },
});
