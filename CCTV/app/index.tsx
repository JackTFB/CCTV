import React, { useState } from 'react';
import { Platform, View, StyleSheet, Text } from 'react-native';
import WebNavbar from "../components/web/WebNavbar";
import MobileNavbar from "../components/mobile/MobileNavbar";
//import GoogleOAuth from "../components/GoogleOAuth";

import WebHome from "..//components/web/WebHome";
import WebFeed from "..//components/web/WebFeed";
import WebVOD from "..//components/web/WebVOD";
import {WebSettings} from "..//components/web/WebSettings";
import WebProfile from "..//components/web/WebProfile";

import MobileHome from "../components/mobile/MobileHome";
import MobileFeed from "../components/mobile/MobileFeed";
import MobileVOD from "../components/mobile/MobileVOD";
import MobileSettings from "../components/mobile/MobileSettings";
import MobileProfile from "../components/mobile/MobileProfile";


const MainContent = () => (
    <View style={styles.content}>
      <Text style={styles.contentText}>Main Content Area</Text>
      <Text>Your app screens would go here.</Text>
    </View>
);

const webComponents: { [key: string]: React.ComponentType } = {
  Home: WebHome,
  Feed: WebFeed,
  VOD: WebVOD,
  Settings: WebSettings,
  Profile: WebProfile,
}

const mobileComponents: { [key: string]: React.ComponentType } = {
  Home: MobileHome,
  Feed: MobileFeed,
  VOD: MobileVOD,
  Settings: MobileSettings,
  Profile: MobileProfile,
}

export default function Index() {

  const [activeWebPage, setActiveWebPage] = useState('Home');
  const ActiveWebComponent = webComponents[activeWebPage];

  const [activeMobilePage, setActiveMobilePage] = useState('Home');
  const ActiveMobileComponent = mobileComponents[activeMobilePage];

  const handleWebPageChange = (pageName: string) => {
    setActiveWebPage(pageName);
  };

  const handleMobilePageChange = (pageName: string) => {
    setActiveMobilePage(pageName);
  }

  if (Platform.OS === 'web') {
    return (
        <View style={styles.container}>
          <ActiveWebComponent />
          <WebNavbar
            activeWebPage={activeWebPage}
            onWebPageChange={handleWebPageChange}
          />
        </View>
    );
  }

  return(
      <View style={styles.container}>
        <ActiveMobileComponent />
        <MobileNavbar
          activeMobilePage={activeMobilePage}
          onMobilePageChange={handleMobilePageChange}
        />
      </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});