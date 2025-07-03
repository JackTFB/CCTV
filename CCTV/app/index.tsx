import React from 'react';
import { Text, StyleSheet } from "react-native";
import GoogleOAuth from "../components/GoogleOAuth";



export default function Index() {
  return(
      <GoogleOAuth />
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
