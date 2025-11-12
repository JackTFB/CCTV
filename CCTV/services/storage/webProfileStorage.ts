import { UserProfile } from '../profileService';

const PROFILE_STORAGE_KEY = 'cctv_user_profile';

export const webProfileStorage = {
  /**
   * Load profile from localStorage (synchronous)
   */
  loadProfile(): UserProfile | null {
    try {
      const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (storedProfile) {
        return JSON.parse(storedProfile);
      }
      return null;
    } catch (error) {
      console.error('Error loading profile from localStorage:', error);
      return null;
    }
  },

  /**
   * Save profile to localStorage (synchronous)
   */
  saveProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
      console.log('✅ Web: Profile saved to localStorage');
    } catch (error) {
      console.error('❌ Web: Error saving profile to localStorage:', error);
      throw error;
    }
  },

  /**
   * Clear profile from localStorage
   */
  clearProfile(): void {
    try {
      localStorage.removeItem(PROFILE_STORAGE_KEY);
      console.log('✅ Web: Profile cleared from localStorage');
    } catch (error) {
      console.error('❌ Web: Error clearing profile from localStorage:', error);
      throw error;
    }
  }
};