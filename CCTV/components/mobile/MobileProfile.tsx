import React from 'react';
import { View, Text, Image, Pressable, TextInput, StyleSheet } from 'react-native';

export default function MobileProfile() {
    return(
        <View style={styles.container}>
            <View style={styles.banner}>
                <Text style={styles.bannerText}>Profile</Text>
                <Image source={require('../../assets/images/JackTFB.png')}
                       resizeMode='contain'
                       style={styles.bannerImage}
                />
                <Text style={styles.bannerText}>Jack TFB</Text>
            </View>

            <View style={styles.profileSettings}>
                <Text style={styles.profileSettingsText}>Change Profile Name</Text>
                <TextInput
                    placeholder="Name"
                    style={styles.profileSettingsTextInput}
                />
                <Text style={styles.profileSettingsText}>Change Profile Image</Text>
                <Pressable
                    style={styles.profileSettingsButton}
                >
                    <Text style={styles.profileSettingsButtonText}>Upload Image</Text>
                </Pressable>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#292929'
    },
    banner: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerImage: {
        height: 100,
        width: 100
    },
    bannerText: {
        color: '#FFFFFF',
        marginTop: 10,
        fontSize: 50,
        fontFamily: 'sans-serif'
    },
    profileSettings: {
        paddingVertical: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    profileSettingsText: {
        color: '#FFFFFF',
        marginTop: 2,
        fontSize: 20,
        fontFamily: 'sans-serif',
    },
    profileSettingsTextInput: {
        height: 45,
        width: '60%',
        maxWidth: 400,
        borderColor: '#888',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 10,
        color: '#FFFFFF',
        marginVertical: 15,
        fontSize: 16,
    },
    profileSettingsButton: {
        backgroundColor: '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 30,
        borderRadius: 8,
        alignItems: 'center',
        marginVertical: 10,
        minWidth: 200,
    },
    profileSettingsButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        fontFamily: 'sans-serif'
    }
})