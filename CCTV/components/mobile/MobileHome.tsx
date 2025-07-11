import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function MobileHome() {


    return(
        <View style={styles.container}>
            <View style={styles.banner}>
                <Image
                    style={styles.bannerImage}
                    resizeMode='contain'
                    source={require("../../assets/images/react-logo.png")}
                    />
                <Text style={styles.bannerText}>CCTV</Text>
            </View>


            <View style={styles.content}>
                <View
                    style={styles.creatorList}
                >
                    <View style={styles.creatorInfo}>
                        <Text style={styles.creatorText}>Creator Test</Text>
                        <Image
                            source={require('../../assets/images/JackTFB.png')}
                            resizeMode='contain'
                            style={styles.creatorImage}
                        />
                    </View>
                    <View style={styles.creatorThumbnails}>
                        <Image
                            source={require('../../assets/images/KeqingRender.png')}
                            resizeMode='contain'
                            style={styles.creatorImage}
                        />
                    </View>
                </View>
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
        paddingTop: 40, // Add more padding at the top for the status bar
        paddingBottom: 20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bannerImage: {
        height: 80, // Slightly smaller for mobile screens
        width: 80,
    },
    bannerText: {
        color: '#FFFFFF',
        marginTop: 10,
        fontSize: 40, // Reduced font size for better fit
        fontFamily: 'sans-serif',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 16, // Use horizontal padding for consistent spacing
    },
    creatorList: {
        // Key change: Stack content vertically for mobile
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20, // Reduced gap for a tighter mobile layout
        padding: 20, // Reduced padding
        borderWidth: 1,
        borderColor: '#c69225',
        borderRadius: 25, // A smaller, more subtle border radius
        width: '100%', // Use 100% width to fill the padded content area
        backgroundColor: '#152a3e',
        marginBottom: 20, // Add margin to separate multiple creator lists
    },
    // The 'creatorListHovered' style was removed as hover is not a mobile concept.

    creatorInfo: {
        // No longer needs flex sizing, will size to its content
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
    },
    creatorText: {
        color: '#FFFFFF',
        fontSize: 22, // Larger font size for the creator name to make it a clear title
        fontFamily: 'sans-serif',
    },
    creatorImage: {
        height: 85, // Slightly larger creator image
        width: 85,
    },
    creatorThumbnails: {
        // This will now be a horizontal row of thumbnails below the creator info
        flexDirection: 'row',
        justifyContent: 'center', // Center the thumbnails within the container
        flexWrap: 'wrap', // Allow thumbnails to wrap to the next line if they overflow
        gap: 10,
    },
});