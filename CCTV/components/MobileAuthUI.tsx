import React from 'react';
import {
    GoogleSignin,
    GoogleSigninButton,
    isErrorWithCode,
    statusCodes
} from "@react-native-google-signin/google-signin";

interface MobileAuthUIProps {
    onSignInSuccess: (accessToken: string) => void;
    onSignInError: (error: any) => void;
}

export const MobileAuthUI: React.FC<MobileAuthUIProps> = ({ onSignInSuccess,  onSignInError }) => {
    const handleMobileSignIn = async () => {
        try {
            await GoogleSignin.hasPlayServices();
            await GoogleSignin.signIn();
            const tokens = await GoogleSignin.getTokens();
            onSignInSuccess(tokens.accessToken);
        } catch (error: any) {
            if (isErrorWithCode(error)) {
                switch (error.code) {
                    case statusCodes.SIGN_IN_CANCELLED:
                        console.log('User cancelled the login flow.');
                        break;
                    default:
                        onSignInError(error);
                }
            } else {
                onSignInError(error);
            }
        }
    };

    return (
        <GoogleSigninButton
            size={GoogleSigninButton.Size.Wide}
            color={GoogleSigninButton.Color.Dark}
            onPress={handleMobileSignIn}
        />
    );
}