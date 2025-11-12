import {Alert, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import * as Linking from 'expo-linking';
import {Account, Client, ID, Models, OAuthProvider} from 'react-native-appwrite';
import React, {useEffect, useState} from 'react';
import {openAuthSessionAsync} from "expo-web-browser";

// --- Client Initialization ---
// This is configured correctly for cross-platform use.
const client = new Client()
    .setEndpoint('https://nyc.cloud.appwrite.io/v1')
    .setProject('6863f92a0013126eaceb')
    .setPlatform('com.jacktfb.cctv');

const account = new Account(client);

export default function AppWrite() {
    const [loggedInUser, setLoggedInUser] = useState<Models.User<Models.Preferences> | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');

    useEffect(() => {
        const checkSession = async () => {
            try {
                const user = await account.get();
                setLoggedInUser(user);
            } catch (error) {
                // This is an expected error when the user is not logged in.
                // We can safely ignore it.
            }
        };
        checkSession();
    }, []);

    async function login(email: string, password: string) {
        try {
            await account.createEmailPasswordSession(email, password);
            setLoggedInUser(await account.get());
        } catch (error) {
            Alert.alert('Login Failed', (error as Error).message);
        }
    }

    async function register(email: string, password: string, name: string) {
        try {
            await account.create(ID.unique(), email, password, name);
            await login(email, password);
        } catch (error) {
            Alert.alert('Registration Failed', (error as Error).message);
        }
    }

    async function logout() {
        try {
            await account.deleteSession('current');
            setLoggedInUser(null);
        } catch (error) {
            Alert.alert('Logout Failed', (error as Error).message);
        }
    }

    // This function is not async because the web path is synchronous (full page redirect).
    async function loginWithGoogle() {

        try {
            const redirectUri = Linking.createURL("/");

            console.log("Platform:", Platform.OS);
            console.log("Redirect URI:", redirectUri);

            if (Platform.OS === 'web') {
                const response = account.createOAuth2Session(
                    OAuthProvider.Google,
                    redirectUri,
                    redirectUri
                );

                if (!response) throw new Error("Failed to create OAuth2 session");

                const browserResult = await openAuthSessionAsync(
                    response.toString(),
                    redirectUri
                );

                if(browserResult.type !== "success") {
                    throw new Error("OAuth authentication was cancelled or failed");
                }

                const currentSession = await account.getSession('current');
                if (!currentSession) {
                    throw new Error("No session found after OAuth authentication");
                }
                return currentSession;
            } else {
                const response = account.createOAuth2Token(
                    OAuthProvider.Google,
                    redirectUri,
                    redirectUri
                );

                if (!response) throw new Error("Create OAuth2 token failed");

                const browserResult = await openAuthSessionAsync(
                    response.toString(),
                    redirectUri
                );

                if (browserResult.type !== "success")
                    throw new Error("Create OAuth2 toekn failed");

                console.log("Browser Result: ", browserResult);

                const url = new URL(browserResult.url);
                const secret = url.searchParams.get("secret")?.toString();
                const userId = url.searchParams.get("userId")?.toString();
                if (!secret || !userId) throw new Error("Create OAuth2 token failed");

                await account.createSession(userId, secret);

                const currentSession = await account.getSession('current');
                if (!currentSession) {
                    throw new Error("Failed to create session after OAuth authentication");
                }
                return currentSession;
            }
        } catch (error) {
            console.error("Login error:", error);
            return null;
        }
    }

    // If a user is logged in, show a simplified view
    if (loggedInUser) {
        return (
            <View style={styles.root}>
                <Text style={styles.title}>Welcome, {loggedInUser.name}!</Text>
                <Text>You are logged in with email: {loggedInUser.email}</Text>
                <TouchableOpacity
                    style={styles.button}
                    onPress={logout}
                >
                    <Text style={styles.buttonText}>Logout</Text>
                </TouchableOpacity>

            </View>
        );
    }

    // If no user is logged in, show the login/register form
    return (
        <View style={styles.root}>
            {/* Simplified this title since this view only shows when logged out */}
            <Text style={styles.title}>Please Sign In</Text>
            <View>
                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                />
                <TextInput
                    style={styles.input}
                    placeholder="Password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
                <TextInput
                    style={styles.input}
                    placeholder="Name (for registration)"
                    value={name}
                    onChangeText={setName}
                />

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => login(email, password)}
                >
                    <Text style={styles.buttonText}>Login</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => register(email, password, name)}
                >
                    <Text style={styles.buttonText}>Register</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.button, styles.googleButton]}
                    // --- THE FIX ---
                    // Pass the function directly to be executed on press.
                    onPress={loginWithGoogle}
                >
                    <Text style={styles.buttonText}>Sign In with Google</Text>
                </TouchableOpacity>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        justifyContent: 'center',
        padding: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        textAlign: 'center',
    },
    input: {
        height: 45,
        borderColor: 'gray',
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 15,
        paddingHorizontal: 10,
        fontSize: 16,
    },
    button: {
        backgroundColor: '#007BFF',
        padding: 12,
        borderRadius: 5,
        marginBottom: 10,
        alignItems: 'center',
    },
    googleButton: {
        backgroundColor: '#DB4437',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    }
});