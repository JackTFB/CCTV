import React from 'react';
import { View, Text, Pressable, Switch, StyleSheet } from 'react-native';

export default function MobileSettings() {

    return (
        <View style={styles.container}>
            <View style={styles.banner}>
                <Text style={styles.bannerText}>Settings</Text>
            </View>

            <View style={styles.settings}>
                <Text style={styles.settingsText}>Light/Dark Mode</Text>
                <Switch/>
                <Pressable
                    style={styles.settingsButton}
                >
                    <Text style={styles.settingsButtonText}>Log out of Google</Text>
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#292929',
    },
    banner: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerText: {
        color: '#FFFFFF',
        marginTop: 10,
        fontSize: 50,
        fontFamily: 'sans-serif'
    },
    settings: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    settingsText: {
        color: '#FFFFFF',
        marginTop: 2,
        fontSize: 20,
        fontFamily: 'sans-serif',
    },
    settingsButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
        minWidth: 200,
    },
    settingsButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'sans-serif'
    }
})