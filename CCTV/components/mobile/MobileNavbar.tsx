import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

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
    
    // Theme
    const { theme } = useTheme();

    const handleMenuItemPress = (pageName: string) => {
        onMobilePageChange(pageName);
        setActiveTab(pageName);
    }

    const styles = createStyles(theme);

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.container}>
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.name;
                    return (
                        <Pressable
                            key={tab.name}
                            style={[
                                styles.tab,
                                isActive && styles.activeTab
                            ]}
                            onPress={() => handleMenuItemPress(tab.name)}
                        >
                            <Ionicons
                                name={tab.icon}
                                size={24}
                                color={isActive ? theme.colors.accent : theme.colors.text}
                            />
                            <Text style={[
                                styles.tabLabel,
                                { color: isActive ? theme.colors.accent : theme.colors.textSecondary }
                            ]}>
                                {tab.name}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>
        </SafeAreaView>
    );
};

const createStyles = (theme: any) => StyleSheet.create({
    safeArea: {
        backgroundColor: theme.colors.surface,
        // Add a top shadow for a professional look
        shadowColor: theme.colors.text,
        shadowOffset: {
            width: 0,
            height: -2, // Shadow on the top side
        },
        shadowOpacity: 0.1,
        shadowRadius: 3.84,
        elevation: 8, // for Android
        borderTopWidth: 1,
        borderTopColor: theme.colors.border,
    },
    container: {
        backgroundColor: theme.colors.surface,
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
        paddingVertical: 4,
        borderRadius: 8,
        marginHorizontal: 2,
    },
    activeTab: {
        backgroundColor: theme.colors.background,
        borderWidth: 1,
        borderColor: theme.colors.accent,
    },
    tabIcon: {
        fontSize: 24,
        marginBottom: 4,
    },
    tabLabel: {
        fontSize: 11,
        fontWeight: '500',
        marginTop: 2,
    },
});
