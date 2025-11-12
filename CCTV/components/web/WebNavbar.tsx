import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';

const menuItems = [
    { name: 'Home', icon: 'home-outline' as const},
    { name: 'Feed', icon: 'logo-rss' as const},
    { name: 'VOD', icon: 'play-circle-outline' as const},
    { name: 'Settings', icon: 'settings-outline' as const},
    { name: 'Profile', icon: 'person-outline' as const}
];

interface WebNavbarProps {
    activeWebPage: string;
    onWebPageChange: (pageName: string) => void;
}

export default function WebNavbar({ activeWebPage, onWebPageChange }: WebNavbarProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    // Theme
    const { theme } = useTheme();

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const handleMenuItemPress = (pageName: string) => {
        onWebPageChange(pageName);
        toggleSidebar();
    }

    const styles = createStyles(theme);

    return(
        <>
            <Pressable style={styles.menuIcon} onPress={toggleSidebar}>
                <Text style={styles.iconText}>☰</Text>
            </Pressable>

            <Modal
                animationType='fade'
                transparent={true}
                visible={isSidebarOpen}
                onRequestClose={toggleSidebar}
            >
                <Pressable style={styles.overlay} onPress={toggleSidebar}>
                    <Pressable style={styles.sidebar} onPress={(e) => e.stopPropagation()}>
                        <View style={styles.sidebarHeader}>
                            <Text style={styles.sidebarTitle}>Menu</Text>
                            <Pressable onPress={toggleSidebar} style={styles.closeButton}>
                                <Text style={styles.closeButtonText}>✕</Text>
                            </Pressable>
                        </View>

                        {menuItems.map((item) => {
                            const isActive = item.name === activeWebPage;
                            return (
                                <Pressable
                                    key={item.name}
                                    onPress={() => handleMenuItemPress(item.name)}
                                    style={[
                                        styles.menuItem, 
                                        isActive && styles.activeMenuItem
                                    ]}
                                >
                                    <Ionicons 
                                        name={item.icon}
                                        size={24}
                                        color={isActive ? theme.colors.accent : theme.colors.text}
                                    />
                                    <Text style={[
                                        styles.menuItemText,
                                        { color: isActive ? theme.colors.accent : theme.colors.text }
                                    ]}>
                                        {item.name}
                                    </Text>
                                </Pressable>
                            );
                        })}
                    </Pressable>
                </Pressable>
            </Modal>
        </>
    )
}

const createStyles = (theme: any) => StyleSheet.create({
    menuIcon: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10, // Ensure it's above other content
        padding: 10,
        backgroundColor: theme.colors.surface,
        borderRadius: 50,
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: theme.colors.text,
        shadowOffset: { 
            width: 0, 
            height: 2 
        },
        shadowOpacity: 0.15,
        shadowRadius: 3.84,
        elevation: 5,
    },
    iconText: {
        fontSize: 28,
        color: theme.colors.text,
        fontWeight: 'bold',
    },
    overlay: {
        flex: 1,
        backgroundColor: theme.colors.modalOverlay,
    },
    sidebar: {
        width: 280,
        height: '100%',
        backgroundColor: theme.colors.surface,
        shadowColor: theme.colors.text,
        shadowOffset: { 
            width: 2, 
            height: 0 
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        borderRightWidth: 1,
        borderRightColor: theme.colors.border,
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.card,
    },
    sidebarTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    closeButton: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: theme.colors.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 18,
        color: theme.colors.buttonText,
        fontWeight: 'bold',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    activeMenuItem: {
        backgroundColor: theme.colors.card,
        borderLeftWidth: 4,
        borderLeftColor: theme.colors.accent,
    },
    menuItemIcon: {
        fontSize: 20,
        marginRight: 15,
        width: 25,
        textAlign: 'center',
    },
    menuItemText: {
        fontSize: 16,
        marginLeft: 15,
        fontWeight: '500',
    },
});
