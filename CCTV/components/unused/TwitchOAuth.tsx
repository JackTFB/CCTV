import { Button, View, Text, Platform, StyleSheet } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import React, {useEffect, useState} from "react";

WebBrowser.maybeCompleteAuthSession();

const discovery = {
    authorizationEndpoint: 'https://id.twitch.tv/oauth2/authorize',
    tokenEndpoint: 'https://id.twitch.tv/oauth2/token',
    revocationEndpoint: 'https://id.twitch.tv/oauth2/revoke',
};

const WEB_CLIENT_ID = '0mrgt8smkus1i4c20qkbeno5iecvto';
const WEB_CLIENT_SECRET = 'ys4xab04opil5jkh1tepjo1oaqlzk2';


export default function TwitchOAuth() {
    const [accessToken, setAccessToken] = useState<string | null>(null);

    const clientId = Platform.select({
        default: WEB_CLIENT_ID
    })

    const clientSecret = Platform.select({
        web: WEB_CLIENT_SECRET,
        default: ''
    })

    const redirectUri = Platform.select({
        web: window.location.origin,
        default: AuthSession.makeRedirectUri({ useProxy: true }),
    })
    console.log(redirectUri)

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: clientId,
            redirectUri: redirectUri,
            scopes: [
                'user:read:email',
                'channel:read:subscriptions',
            ],
            responseType: AuthSession.ResponseType.Code,
            codeChallengeMethod: AuthSession.CodeChallengeMethod.S256,
        },
        discovery
    );

    useEffect(() => {
        async function fetchToken() {
            if (response?.type === 'success' && response.params.code) {
                const code = response.params.code;

                try {
                    const tokenResponse = await fetch(discovery.tokenEndpoint, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        body: new URLSearchParams({
                            client_id: clientId,
                            client_secret: clientSecret,
                            code,
                            grant_type: 'authorization_code',
                            redirect_uri: redirectUri,
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
            }
        }
        fetchToken();
    }, [response]);

    const handleWebSignIn = React.useCallback(() => {
        if (promptAsync) {
            promptAsync({ useProxy: true, useWebBrowser: false });
        }
    }, [promptAsync]);

    return(
        <View
        style={styles.container}>
            {Platform.OS === 'web' && <Button
                title="Sign in with Twitch"
                onPress={handleWebSignIn}
                disabled={!request}
            />}
            <Button 
                title="Sign in with Twitch"
                onPress={handleWebSignIn}
                />

            {accessToken && (
                <Text style={styles.tokenText}>Access Token: {accessToken}</Text>
            )}

        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    tokenText: {
        marginTop: 20,
        paddingHorizontal: 10,
        textAlign: 'center',
    }
});