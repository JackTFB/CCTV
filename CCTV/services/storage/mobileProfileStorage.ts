import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserProfile } from '../profileService';

const PROFILE_STORAGE_KEY = 'cctv_user_profile';

export const mobileProfileStorage = {
  /**
   * Load profile from AsyncStorage (asynchronous)
   */
  async loadProfile(): Promise<UserProfile | null> {
    try {
      const storedProfile = await AsyncStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        return JSON.parse(storedProfile);
      }
      return null;
    } catch (error) {
      console.error('❌ Mobile: Error loading profile from AsyncStorage:', error);
      return null;
    }
  },

  /**
   * Save profile to AsyncStorage (asynchronous)
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      console.log('✅ Mobile: Profile saved to AsyncStorage');
    } catch (error) {
      console.error('❌ Mobile: Error saving profile to AsyncStorage:', error);
      throw error;
    }
  },

  /**
   * Clear profile from AsyncStorage
   */
  async clearProfile(): Promise<void> {
    try {
      await AsyncStorage.removeItem(PROFILE_STORAGE_KEY);
      console.log('✅ Mobile: Profile cleared from AsyncStorage');
    } catch (error) {
      console.error('❌ Mobile: Error clearing profile from AsyncStorage:', error);
      throw error;
    }
  }
};