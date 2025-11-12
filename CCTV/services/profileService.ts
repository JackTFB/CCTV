import { Platform } from 'react-native';
import { webProfileStorage } from './storage/webProfileStorage';
import { mobileProfileStorage } from './storage/mobileProfileStorage';

export interface UserProfile {
  username: string;
  profileImageUri: string | null;
}

const DEFAULT_PROFILE: UserProfile = {
  username: 'Jack TFB',
  profileImageUri: null
};

class ProfileService {
  private currentProfile: UserProfile | null = null;

  /**
   * Load profile (handles both sync and async based on platform)
   */
  async loadProfile(): Promise<UserProfile> {
    try {
      let storedProfile: UserProfile | null = null;
      
      if (Platform.OS === 'web') {
        // Web: synchronous localStorage
        storedProfile = webProfileStorage.loadProfile();
      } else {
        // Mobile: asynchronous AsyncStorage
        storedProfile = await mobileProfileStorage.loadProfile();
      }
      
      if (storedProfile) {
        this.currentProfile = storedProfile;
        return storedProfile;
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
    
    // Return default profile if nothing stored or error occurred
    this.currentProfile = { ...DEFAULT_PROFILE };
    return this.currentProfile;
  }

  /**
   * Save profile (handles both sync and async based on platform)
   */
  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        // Web: synchronous localStorage
        webProfileStorage.saveProfile(profile);
      } else {
        // Mobile: asynchronous AsyncStorage
        await mobileProfileStorage.saveProfile(profile);
      }
      
      this.currentProfile = profile;
      console.log('✅ Profile saved successfully:', profile);
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      throw error;
    }
  }

  /**
   * Update username
   */
  async updateUsername(username: string): Promise<void> {
    const currentProfile = await this.loadProfile();
    const updatedProfile = { ...currentProfile, username };
    await this.saveProfile(updatedProfile);
  }

  /**
   * Update profile image
   */
  async updateProfileImage(imageUri: string): Promise<void> {
    const currentProfile = await this.loadProfile();
    const updatedProfile = { ...currentProfile, profileImageUri: imageUri };
    await this.saveProfile(updatedProfile);
  }

  /**
   * Get current profile (loads if not cached)
   */
  async getProfile(): Promise<UserProfile> {
    if (!this.currentProfile) {
      return await this.loadProfile();
    }
    return this.currentProfile;
  }

  /**
   * Reset profile to default
   */
  async resetProfile(): Promise<void> {
    await this.saveProfile({ ...DEFAULT_PROFILE });
  }

  /**
   * Clear all profile data
   */
  async clearProfile(): Promise<void> {
    try {
      if (Platform.OS === 'web') {
        webProfileStorage.clearProfile();
      } else {
        await mobileProfileStorage.clearProfile();
      }
      
      this.currentProfile = null;
      console.log('✅ Profile cleared successfully');
    } catch (error) {
      console.error('❌ Error clearing profile:', error);
      throw error;
    }
  }

  /**
   * Synchronous method for web compatibility (deprecated - use getProfile instead)
   * Only works on web, returns cached profile or default on mobile
   */
  getProfileSync(): UserProfile {
    if (Platform.OS === 'web') {
      try {
        const storedProfile = webProfileStorage.loadProfile();
        if (storedProfile) {
          this.currentProfile = storedProfile;
          return storedProfile;
        }
      } catch (error) {
        console.error('Error loading profile sync:', error);
      }
    }
    
    // Return cached profile or default
    return this.currentProfile || { ...DEFAULT_PROFILE };
  }
}

export const profileService = new ProfileService();