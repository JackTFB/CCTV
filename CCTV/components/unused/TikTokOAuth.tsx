import { Button, View, Text, Platform, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import React, { useEffect, useState } from 'react';

WebBrowser.maybeCompleteAuthSession();

export default function TikTokOAuth() {
    return (
        <View>
            <Button
            title="Sign in with TikTok"/>


        </View>
    )
}