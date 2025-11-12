import React, { useState, useEffect } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import { initDatabase } from '../services/database';
import { ThemeProvider } from '../context/ThemeContext';

// Web Components
import WebNavbar from "../components/web/WebNavbar";
import WebHome from "../components/web/WebHome";
import WebFeed from "../components/web/WebFeed";
import WebVOD from "../components/web/WebVOD";
import WebSettings from "../components/web/WebSettings";
import WebProfile from "../components/web/WebProfile";

// Mobile Components
import MobileNavbar from "../components/mobile/MobileNavbar";
import MobileHome from "../components/mobile/MobileHome";
import MobileFeed from "../components/mobile/MobileFeed";
import MobileVOD from "../components/mobile/MobileVOD";
import MobileSettings from "../components/mobile/MobileSettings";
import MobileProfile from "../components/mobile/MobileProfile";

const webComponents: { [key: string]: React.ComponentType } = {
    Home: WebHome,
    Feed: WebFeed,
    VOD: WebVOD,
    Settings: WebSettings,
    Profile: WebProfile,
}

const mobileComponents: { [key: string]: React.ComponentType } = {
    Home: MobileHome,
    Feed: MobileFeed,
    VOD: MobileVOD,
    Settings: MobileSettings,
    Profile: MobileProfile,
}

function AppContent() {
    const [activeWebPage, setActiveWebPage] = useState('Home');
    const [activeMobilePage, setActiveMobilePage] = useState('Home');
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const init = async () => {
            try {
                await initDatabase();
                setIsInitialized(true);
            } catch (error) {
                console.error('Failed to initialize database:', error);
                setIsInitialized(true); // Continue even if database fails
            }
        };
        init();
    }, []);

    const ActiveWebComponent = webComponents[activeWebPage];
    const ActiveMobileComponent = mobileComponents[activeMobilePage];

    const handleWebPageChange = (pageName: string) => {
        setActiveWebPage(pageName);
    };

    const handleMobilePageChange = (pageName: string) => {
        setActiveMobilePage(pageName);
    }

    if (!isInitialized) {
        return (
            <View style={styles.container}>
                <Text style={styles.loading}>Initializing database...</Text>
            </View>
        );
    }

    if (Platform.OS === 'web') {
        return (
            <View style={styles.container}>
                <ActiveWebComponent />
                <WebNavbar
                    activeWebPage={activeWebPage}
                    onWebPageChange={handleWebPageChange}
                />
            </View>
        );
    }

    return(
        <View style={styles.container}>
            <ActiveMobileComponent />
            <MobileNavbar
                activeMobilePage={activeMobilePage}
                onMobilePageChange={handleMobilePageChange}
            />
        </View>
    )
}

export default function Index() {
    return (
        <ThemeProvider> 
            <AppContent />
        </ThemeProvider>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#292929',
    },
    loading: {
        flex: 1,
        textAlign: 'center',
        textAlignVertical: 'center',
        fontSize: 18,
        color: '#FFFFFF',
    },
});