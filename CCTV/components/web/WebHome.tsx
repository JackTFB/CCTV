import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';

export default function WebHome() {

    const [isHovered, setIsHovered] = useState(false);

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
            {/*
                Autofilled list of top creators the user watches and their current latest videos from platforms
            */}
            <View style={styles.content}>
                <View
                    style={[
                        styles.creatorList,
                        isHovered && styles.creatorListHovered
                    ]}
                    onPointerEnter={() => setIsHovered(true)}
                    onPointerLeave={() => setIsHovered(false)}
                >
                    <View style={styles.creatorInfo}>
                        <Text style={styles.creatorText}>Creator Test</Text>
                        <Image
                            source={require("../../assets/images/JackTFB.png")}
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
    content: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
    },
    creatorList: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 30,
        padding: 20,
        borderWidth: 1,
        borderColor: '#c69225',
        borderRadius: 80,
        width: '90%',
        maxWidth: 900,
        backgroundColor: '#152a3e',
        transitionDuration: '0.3s',
    },
    creatorListHovered: {
        borderColor: '#FFFFFF',
        padding: 30,
        maxWidth: 950,
    },

    creatorInfo: {
        flex: 1,
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
    },
    creatorText: {
      color: '#FFFFFF',
        fontSize: 25,
        fontFamily: 'sans-serif',
    },
    creatorImage: {
        height: 100,
        width: 100,
    },
    creatorThumbnails: {
        flex: 3,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    }

})