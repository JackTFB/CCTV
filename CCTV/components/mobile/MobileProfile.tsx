import React, { useState, useEffect } from 'react';
import { View, Text, Image, Pressable, TextInput, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { profileService, UserProfile } from '../../services/profileService';
import { pickImage } from '../../utils/imagePicker';
import { useTheme } from '../../context/ThemeContext';

export default function MobileProfile() {
  const [profile, setProfile] = useState<UserProfile>({ username: 'Jack TFB', profileImageUri: null });
  const [tempUsername, setTempUsername] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Theme
  const { theme } = useTheme();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const userProfile = await profileService.getProfile();
      setProfile(userProfile);
      setTempUsername(userProfile.username);
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    }
  };

  const handleUsernameChange = async () => {
    if (!tempUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    if (tempUsername === profile.username) {
      return; // No change
    }

    setIsSaving(true);
    try {
      await profileService.updateUsername(tempUsername.trim());
      const updatedProfile = await profileService.getProfile();
      setProfile(updatedProfile);
      Alert.alert('Success', 'Username updated successfully!');
    } catch (error) {
      console.error('Error updating username:', error);
      Alert.alert('Error', 'Failed to update username');
      setTempUsername(profile.username); // Reset on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async () => {
    setIsSaving(true);
    try {
      const result = await pickImage();
      
      if (result.success && result.uri) {
        await profileService.updateProfileImage(result.uri);
        const updatedProfile = await profileService.getProfile();
        setProfile(updatedProfile);
        Alert.alert('Success', 'Profile image updated successfully!');
      } else if (result.error) {
        Alert.alert('Error', result.error);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to update profile image');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetImage = () => {
    Alert.alert(
      'Reset Profile Image',
      'Are you sure you want to reset your profile image to default?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await profileService.updateProfileImage('');
              const updatedProfile = await profileService.getProfile();
              setProfile({ ...updatedProfile, profileImageUri: null });
              Alert.alert('Success', 'Profile image reset to default');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset profile image');
            }
          },
        },
      ]
    );
  };

  const getProfileImageSource = () => {
    if (profile.profileImageUri) {
      return { uri: profile.profileImageUri };
    }
    return require('../../assets/images/JackTFB.png');
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.banner}>
          <Text style={styles.bannerText}>Profile</Text>
          <View style={styles.profileImageContainer}>
            <Image 
              source={getProfileImageSource()}
              resizeMode='cover'
              style={styles.bannerImage}
            />
            {profile.profileImageUri && (
              <View style={styles.customImageIndicator}>
                <Text style={styles.customImageText}>Custom</Text>
              </View>
            )}
          </View>
          <Text style={styles.usernameText}>{profile.username}</Text>
        </View>

        <View style={styles.profileSettings}>
          <Text style={styles.profileSettingsText}>Change Profile Name</Text>
          <View style={styles.usernameContainer}>
            <TextInput
              placeholder="Enter your name"
              placeholderTextColor={theme.colors.textSecondary}
              style={styles.profileSettingsTextInput}
              value={tempUsername}
              onChangeText={setTempUsername}
              onBlur={handleUsernameChange}
              onSubmitEditing={handleUsernameChange}
              editable={!isSaving}
            />
            {tempUsername !== profile.username && (
              <Pressable
                style={styles.saveButton}
                onPress={handleUsernameChange}
                disabled={isSaving}
              >
                <Text style={styles.saveButtonText}>
                  {isSaving ? '...' : 'Save'}
                </Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.profileSettingsText}>Change Profile Image</Text>
          <Pressable
            style={[
              styles.profileSettingsButton,
              isSaving && styles.profileSettingsButtonDisabled
            ]}
            onPress={handleImageUpload}
            disabled={isSaving}
          >
            <Text style={styles.profileSettingsButtonText}>
              {isSaving ? 'Uploading...' : '📷 Upload Image'}
            </Text>
          </Pressable>

          {profile.profileImageUri && (
            <Pressable
              style={styles.resetButton}
              onPress={handleResetImage}
            >
              <Text style={styles.resetButtonText}>🔄 Reset to Default</Text>
            </Pressable>
          )}

          <View style={styles.infoContainer}>
            <Text style={styles.infoTitle}>ℹ️ Image Info</Text>
            <Text style={styles.infoText}>
              • Images stored locally on device
            </Text>
            <Text style={styles.infoText}>
              • Formats: JPG, PNG, GIF
            </Text>
            <Text style={styles.infoText}>
              • Max size: 5MB
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  banner: {
    paddingVertical: 25,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    marginHorizontal: 10,
    marginTop: 10,
    borderRadius: 10,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileImageContainer: {
    position: 'relative',
    marginVertical: 15,
  },
  bannerImage: {
    height: 100,
    width: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: theme.colors.accent,
  },
  customImageIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: theme.colors.accent,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  customImageText: {
    color: theme.colors.buttonText,
    fontSize: 8,
    fontWeight: 'bold',
  },
  bannerText: {
    color: theme.colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  usernameText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 5,
  },
  profileSettings: {
    flex: 1,
    paddingVertical: 25,
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  profileSettingsText: {
    color: theme.colors.text,
    marginTop: 15,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  usernameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    maxWidth: 350,
    marginBottom: 10,
  },
  profileSettingsTextInput: {
    flex: 1,
    height: 45,
    borderColor: theme.colors.border,
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 15,
    color: theme.colors.text,
    backgroundColor: theme.colors.card,
    fontSize: 16,
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: 60,
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  saveButtonText: {
    color: theme.colors.buttonText,
    fontWeight: 'bold',
    fontSize: 12,
  },
  profileSettingsButton: {
    backgroundColor: theme.colors.button,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    alignItems: 'center',
    marginVertical: 15,
    minWidth: 180,
    width: '80%',
    maxWidth: 280,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  profileSettingsButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.7,
  },
  profileSettingsButtonText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  resetButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    marginTop: 10,
    width: '70%',
    maxWidth: 200,
    alignItems: 'center',
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  resetButtonText: {
    color: theme.colors.buttonText,
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoContainer: {
    marginTop: 25,
    padding: 15,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    width: '100%',
    maxWidth: 350,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  infoText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    marginBottom: 4,
    lineHeight: 16,
  },
});