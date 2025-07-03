import React from 'react';
import { Button } from 'react-native';

interface WebAuthUIProps {
    onSignIn: () => void;
    disabled: boolean;
}

export const WebAuthUI: React.FC<WebAuthUIProps> = ({ onSignIn, disabled }) => {
    return (
        <Button
            title='Sign in with Google'
            onPress={onSignIn}
            disabled={disabled}
        />
    );
}