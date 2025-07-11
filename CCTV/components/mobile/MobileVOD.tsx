import React from 'react';
import { View, Text, Image, TouchableOpacity, FlatList, StyleSheet } from 'react-native';

export default function MobileVOD() {
    return(
        <View style={styles.container}>
            <View style={styles.banner}>
                <Image
                    source={require('../../assets/images/JackTFB.png')}
                    resizeMode='contain'
                    style={styles.bannerImage}
                />
                <Text style={styles.bannerText}>Creator</Text>
            </View>

            <View style={styles.content}>
                <View style={styles.contentButtons}>
                    <TouchableOpacity>
                        <Text style={styles.contentButtonText}>Videos</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Text style={styles.contentButtonText}>Shorts</Text>
                    </TouchableOpacity>
                    <TouchableOpacity>
                        <Text style={styles.contentButtonText}>VODs</Text>
                    </TouchableOpacity>
                </View>
                {/* Connect Google OAuth code to the FlatList for it to render properly. :)*/}
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
    },
    content: {
        flex: 1,
        alignItems: 'center',
        padding: 20,
    },
    contentButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 30,
        padding: 20
    },
    contentButtonText: {
        color: '#FFFFFF',
        fontSize: 25,
        fontFamily: 'sans-serif',
    },
    contentList: {
        width: '100%',
    },
    contentListHeader: {
        fontSize: 25,
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        textAlign: 'center',
        marginVertical: 10,
        color: '#FFFFFF'
    },
    videoItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'white',
        padding: 10,
        marginVertical: 5,
        marginHorizontal: 10,
        borderRadius: 5,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    thumbnail: {
        width: 120,
        height: 68,
        borderRadius: 4,
        marginRight: 10,
    },
    videoTitle: {
        flex: 1,
        fontSize: 14,
    },

})