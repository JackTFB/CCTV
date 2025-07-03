import React, {useCallback, useEffect, useState} from "react";
import {Image, Text, View, StyleSheet, Platform, TouchableOpacity, FlatList, Alert, TextInput, Modal, Dimensions } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import {
    GoogleSignin
} from "@react-native-google-signin/google-signin";

import { fetchYouTubeVideos, searchForChannels, YouTubeVideo, YouTubeChannel } from "../services/youtubeService";
import { MobileAuthUI } from "./MobileAuthUI";
import { WebAuthUI} from "./WebAuthUI";

import YoutubeIframe from "react-native-youtube-iframe";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
    authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenEndpoint: 'https://oauth2.googleapis.com/token',
    revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};


const WEB_CLIENT_ID = '649292654926-nv98k0l5gpcv20t1d1nloqol1n9tdr40.apps.googleusercontent.com';
const MOBILE_CLIENT_ID = '649292654926-vnfcrtg80nuie63tuohcevk1ll61pk4a.apps.googleusercontent.com';
const YOUTUBE_API_KEY = 'AIzaSyB9re5DOg4S4bOBsGJV1ZsXj-zlWcSXFOs';
const WEB_CLIENT_SECRET = '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';


GoogleSignin.configure({
    webClientId: WEB_CLIENT_ID,
    scopes: [
        'openid',
        'profile',
        'email',
        'https://www.googleapis.com/auth/youtube.readonly'
    ],
    offlineAccess: true,
    forceCodeForRefreshToken: true,
});

function useDebounce(value: string, delay: number) {
    const [debouncedValue, setDebouncedValue] = useState(value);
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedValue(value);
        }, delay);
        return () => {
            clearTimeout(handler);
        };
    }, [value, delay]);
    return debouncedValue;
}


export default function GoogleOAuth() {
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [videos, setVideos] = useState<YouTubeVideo[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<YouTubeChannel[]>([]);
    const [selectedChannel, setSelectedChannel] = useState<YouTubeChannel | null>(null);
    const debouncedSearchQuery = useDebounce(searchQuery, 500);

    const [playingVideoId, setPlayingVideoId] = useState<YouTubeVideo | null>(null);

    const clientId = Platform.select({
        web: WEB_CLIENT_ID,
        default: MOBILE_CLIENT_ID,
    });

    const clientSecret = Platform.select({
        web: WEB_CLIENT_SECRET,
        default: ''
    })

    const redirectUri = AuthSession.makeRedirectUri({
        native: 'cctv://',
    });
    console.log(redirectUri);


    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: clientId,
            redirectUri: redirectUri,
            scopes: [
                'openid',
                'profile',
                'email',
                'https://www.googleapis.com/auth/youtube.readonly',
            ],
            responseType: AuthSession.ResponseType.Code,
            codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        },
        discovery
    );

    useEffect(() => {
        if (response?.type === 'success' && response.params.code) {
            const exchangeCodeForToken = async () => {
                try {
                    const tokenResponse = await fetch(discovery.tokenEndpoint, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                        body: new URLSearchParams({
                            client_id: clientId,
                            client_secret: clientSecret,
                            grant_type: 'authorization_code',
                            code: response.params.code,
                            redirect_uri: redirectUri,
                            code_verifier: request?.codeVerifier || '',
                        }).toString(),
                    });
                    const tokenResult = await tokenResponse.json();
                    if (tokenResult.access_token) {
                        setAccessToken(tokenResult.access_token);
                    } else {
                        console.error('Failed to get access token', tokenResult);
                    }
                } catch (error) {
                    console.error('Token exchange error', error);
                }
            };
            exchangeCodeForToken();
        }
    }, [response, request]);

    useEffect(() => {
        if (debouncedSearchQuery && accessToken) {
            const search  = async () => {
                try {
                    const results = await searchForChannels(accessToken, debouncedSearchQuery, YOUTUBE_API_KEY);
                    setSearchResults(results);
                } catch (error) {
                    Alert.alert('Search Error', (error as Error).message);
                }
            };
            search();
        } else {
            setSearchResults([]);
        }
    }, [debouncedSearchQuery, accessToken]);

    const handleFetchVideos = async (videoType: 'videos' | 'shorts' | 'vods') => {
        if (!accessToken || !selectedChannel) {
            Alert.alert("Error", "Please select a channel first.");
            return;
        }
        setIsLoading(true);
        setVideos([]);
        try {
            let fetchedVideos: YouTubeVideo[] = [];
            let playlist = selectedChannel.id;
            switch (videoType) {
                case 'videos':
                    playlist = playlist.replace(/^UC/, 'UULF');
                    fetchedVideos = await fetchYouTubeVideos(accessToken, playlist);
                    break;
                case 'shorts':
                    playlist = playlist.replace(/^UC/, 'UUSH');
                    fetchedVideos = await fetchYouTubeVideos(accessToken, playlist);
                    break;
                case 'vods':
                    playlist = playlist.replace(/^UC/, 'UULV');
                    fetchedVideos = await fetchYouTubeVideos(accessToken, playlist);
            }
            const videosWithType = fetchedVideos.map(v => ({ ...v, type: videoType }));
            setVideos(fetchedVideos);
        } catch (error) {
            Alert.alert('Failed to fetch videos', (error as Error).message);
        } finally {
            setIsLoading(false)
        }
    };

    const handleSelectChannel = (channel: YouTubeChannel) => {
        setSelectedChannel(channel);
        setSearchQuery('');
        setSearchResults([]);
        setVideos([]);
    };

    const onPlayerStateChange = useCallback((state: string) => {
        if (state === 'ended') {
            setPlayingVideoId(null);
        }
    }, []);

    const screenWidth = Dimensions.get('window').width;


    return (
        <View style={styles.container}>
            <Modal
                visible={!!playingVideoId}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setPlayingVideoId(null)}
                >
                <View style={styles.modalContainer}>
                    <View style={styles.videoPlayerContainer}>
                        {playingVideoId && (
                            <YoutubeIframe
                                height={
                                    (screenWidth * 0.95) / (playingVideoId.videoType === 'shorts' ? 9 / 16 : 16 / 9)
                                }
                                play={true}
                                videoId={playingVideoId.id}
                                onChangeState={onPlayerStateChange}
                            />
                        )}
                        <TouchableOpacity
                            style={styles.closeButton}
                            onPress={() => setPlayingVideoId(null)}
                            >
                            <Text style={styles.closeButtonText}>Close</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
            {!accessToken ? (
                <>
                    <Text style={styles.header}>Sign in to Continue</Text>
                    {Platform.OS === 'web' ? (
                        <WebAuthUI onSignIn={() => promptAsync()} disabled={!request} />
                    ) : (
                        <MobileAuthUI
                            onSignInSuccess={setAccessToken}
                            onSignInError={(error) => Alert.alert('Sign-in Error', error.message)}
                            />
                    )}
                </>
            ) : (
                <View style={styles.loggedInContainer}>
                    <Text style={styles.header}>Search for a Channel</Text>
                    <TextInput
                        style={styles.searchBar}
                        placeholder="e.g., Marques Brownlee"
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                    />

                    {searchResults.length > 0 && (
                        <FlatList
                            style={styles.searchResultsList}
                            data={searchResults}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity style={styles.channelItem} onPress={() => handleSelectChannel(item)}>
                                    <Image source={{ uri: item.thumbnailUrl }} style={styles.channelThumbnail} />
                                    <Text style={styles.channelTitle}>{item.title}</Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}

                    {selectedChannel && (
                        <View style={styles.selectionContainer}>
                            <Text style={styles.selectionText}>Selected: {selectedChannel.title}</Text>
                            <View style={styles.buttonGroup}>
                                <TouchableOpacity style={styles.button} onPress={() => handleFetchVideos('videos')} disabled={isLoading}>
                                    <Text style={styles.buttonText}>Videos</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={() => handleFetchVideos('shorts')} disabled={isLoading}>
                                    <Text style={styles.buttonText}>Shorts</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.button} onPress={() => handleFetchVideos('vods')} disabled={isLoading}>
                                    <Text style={styles.buttonText}>Vods</Text>
                                </TouchableOpacity>
                            </View>
                            {isLoading && <Text style={styles.loadingText}>Fetching...</Text>}
                        </View>
                    )}

                    {videos.length > 0 && (
                        <FlatList
                            style={styles.list}
                            data={videos}
                            keyExtractor={(item) => item.id}
                            renderItem={({ item }) => (
                                <TouchableOpacity onPress={() => setPlayingVideoId(item)}>
                                    <View style={styles.videoItem}>
                                        <Image source={{ uri: item.thumbnailUrl }} style={styles.thumbnail} />
                                        <Text style={styles.videoTitle}>{item.title}</Text>
                                    </View>
                                </TouchableOpacity>
                            )}
                            ListHeaderComponent={<Text style={styles.listHeader}>Latest Videos</Text>}
                        />
                    )}
                </View>

            )}
        </View>
    )
}

    const styles = StyleSheet.create({
        container: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f5f5f5',
            paddingTop: 50,
        },
        loggedInContainer: {
            flex: 1,
            alignItems: 'center',
            width: '100%',
            paddingTop: 20,
        },
        header: {
            fontSize: 22,
            fontWeight: 'bold',
            margin: 20,
        },
        searchBar: {
            height: 40,
            width: '90%',
            borderColor: 'gray',
            borderWidth: 1,
            borderRadius: 5,
            paddingHorizontal: 10,
            backgroundColor: 'white',
            marginBottom: 10,
        },
        searchResultsList: {
            width: '90%',
            maxHeight: 200,
        },
        channelItem: {
            flexDirection: 'row',
            alignItems: 'center',
            padding: 10,
            backgroundColor: 'white',
            borderBottomWidth: 1,
            borderBottomColor: '#eee',
        },
        channelThumbnail: {
            width: 40,
            height: 40,
            borderRadius: 20,
            marginRight: 10,
        },
        channelTitle: {
            fontSize: 16,
        },
        selectionContainer: {
            alignItems: 'center',
            marginVertical: 10,
            width: '100%',
        },
        selectionText: {
            fontSize: 16,
            fontWeight: '500',
            marginBottom: 15,
        },
        buttonGroup: {
            flexDirection: 'row',
            justifyContent: 'space-around',
            width: '90%',
        },
        button: {
            backgroundColor: '#007BFF',
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 5,
        },
        buttonText: {
            color: 'white',
            fontSize: 14,
            fontWeight: 'bold',
        },
        loadingText: {
            marginTop: 15,
            fontSize: 16,
            color: '#555',
        },
        list: {
            width: '100%',
        },
        listHeader: {
            fontSize: 18,
            fontWeight: 'bold',
            textAlign: 'center',
            marginVertical: 10,
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
        // --- New Styles ---
        modalContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(0, 0, 0, 0.7)', // Semi-transparent background
        },
        videoPlayerContainer: {
            width: '95%',
            backgroundColor: 'black',
            borderRadius: 10,
            padding: 5,
        },
        closeButton: {
            backgroundColor: '#FF0000',
            padding: 10,
            borderRadius: 5,
            alignItems: 'center',
            marginTop: 10,
        },
        closeButtonText: {
            color: 'white',
            fontWeight: 'bold',
        },
    });