import {
    GoogleSignin,
    isErrorWithCode,
    statusCodes,
} from "@react-native-google-signin/google-signin";

export const signIn = async () => {
    try {
        await GoogleSignin.hasPlayServices();
        const userInfo = await GoogleSignin.signIn();
        console.log(userInfo.data);
    } catch (error: any) {
        if (isErrorWithCode(error)) {
            switch (error.code) {
                case statusCodes.SIGN_IN_CANCELLED:
                    console.log('User cancelled the login flow.');
                    break;
                case statusCodes.IN_PROGRESS:
                    console.log('Operation is in progress already.');
                    break;
                case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
                    console.log('Play services not available or outdated.');
                    break;
                default:
                    console.log('Error Code:', error.code);
                    console.log('Error Message:', error.message);
                    console.log("Full Error Object:", JSON.stringify(error, null, 2));
            }
        } else {
            console.log('Error Code:', error.code);
            console.log('Error Message:', error.message);
            console.log("Full Error Object:", JSON.stringify(error, null, 2));
        }
    }
};