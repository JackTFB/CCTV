import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';

const menuItems = [
    { name: 'Home', icon: '🏠'},
    { name: 'Feed', icon: '📡'},
    { name: 'VOD', icon: '▶'},
    { name: 'Settings', icon: '⚙️'},
    { name: 'Profile', icon: '👤'}
];

interface WebNavbarProps {
    activeWebPage: string;
    onWebPageChange: (pageName: string) => void;
}

export default function WebNavbar({ activeWebPage, onWebPageChange }: WebNavbarProps) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    const toggleSidebar = () => {
        setSidebarOpen(!isSidebarOpen);
    };

    const handleMenuItemPress = (pageName: string) => {
        onWebPageChange(pageName);
        toggleSidebar();
    }

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

                        {menuItems.map((item) => (
                            <Pressable
                                key={item.name}
                                onPress={() => handleMenuItemPress(item.name)}
                                style={[styles.menuItem, item.name === activeWebPage && styles.activeMenuItem]}
                                >
                                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                                <Text style={styles.menuItemText}>{item.name}</Text>
                            </Pressable>
                        ))}

                    </Pressable>
                </Pressable>
            </Modal>
        </>
    )
}

const styles = StyleSheet.create({
    menuIcon: {
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10, // Ensure it's above other content
        padding: 10,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        borderRadius: 50,
    },
    iconText: {
        fontSize: 28,
    },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    sidebar: {
        width: 280,
        height: '100%',
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 2, height: 0 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    sidebarHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        backgroundColor: '#f8f8f8',
    },
    sidebarTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#555',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    activeMenuItem: {

    },
    menuItemIcon: {
        fontSize: 20,
        marginRight: 15,
        width: 25,
        textAlign: 'center',
    },
    menuItemText: {
        fontSize: 16,
        color: '#333',
    },
});
