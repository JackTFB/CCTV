import React, { useEffect, useState } from 'react';
import { Button, Text, View, StyleSheet, Platform } from "react-native";
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import { GoogleSignin, GoogleSigninButton, statusCodes } from "@react-native-google-signin/google-signin";
import {signIn} from "@/components/signin";




WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

const WEB_CLIENT_ID = '649292654926-nv98k0l5gpcv20t1d1nloqol1n9tdr40.apps.googleusercontent.com';
const MOBILE_CLIENT_ID = '649292654926-f9k24e2rff73ilnv7m4as0eq8psgp8vt.apps.googleusercontent.com';
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


export default function Index() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const clientId = Platform.select({
    web: WEB_CLIENT_ID,
    default: MOBILE_CLIENT_ID,
  })

  const clientSecret = Platform.select({
    web: WEB_CLIENT_SECRET,
    default: ''
  })

  const redirectUri = Platform.select({
    web: window.location.origin,
    default: AuthSession.makeRedirectUri({
    }),
  })
  console.log(redirectUri)


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
              grant_type: 'authorization_code',
              code,
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
      }
    }

    fetchToken();
  }, [response]);

  return (
    <View
      style={styles.container}>
      <Text>Hello World</Text>
      {Platform.OS === 'web' && <Button
          title="Sign in with Google"
          onPress={Index}
          disabled={!request}
      />}
      <GoogleSigninButton
        size={GoogleSigninButton.Size.Wide}
        color={GoogleSigninButton.Color.Dark}
        onPress={signIn}
      />
      {accessToken && (
        <Text style={styles.tokenText}>Access Token: {accessToken}</Text>
      )}
    </View>
  );
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
