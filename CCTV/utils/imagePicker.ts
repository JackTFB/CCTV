import { Platform } from 'react-native';

// Platform-specific imports
let ImagePicker: any = null;
if (Platform.OS !== 'web') {
  try {
    ImagePicker = require('expo-image-picker');
  } catch (error) {
    console.warn('expo-image-picker not available:', error);
  }
}

export interface ImagePickerResult {
  success: boolean;
  uri?: string;
  error?: string;
}

/**
 * Cross-platform image picker
 */
export const pickImage = (): Promise<ImagePickerResult> => {
  if (Platform.OS === 'web') {
    return pickImageWeb();
  } else {
    return pickImageMobile();
  }
};

/**
 * Web-compatible image picker using HTML file input
 */
const pickImageWeb = (): Promise<ImagePickerResult> => {
  return new Promise((resolve) => {
    // Create file input element
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.style.display = 'none';

    // Handle file selection
    input.onchange = (event: any) => {
      const file = event.target.files?.[0];
      
      if (!file) {
        resolve({ success: false, error: 'No file selected' });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        resolve({ success: false, error: 'Please select an image file' });
        return;
      }

      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        resolve({ success: false, error: 'Image must be smaller than 5MB' });
        return;
      }

      // Create file reader to convert to base64
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        resolve({ success: true, uri: result });
      };
      
      reader.onerror = () => {
        resolve({ success: false, error: 'Failed to read image file' });
      };
      
      reader.readAsDataURL(file);
    };

    // Handle cancellation
    input.oncancel = () => {
      resolve({ success: false, error: 'Image selection cancelled' });
    };

    // Trigger file picker
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
};

/**
 * Mobile image picker using Expo ImagePicker
 */
const pickImageMobile = async (): Promise<ImagePickerResult> => {
  try {
    // Check if ImagePicker is available
    if (!ImagePicker) {
      return {
        success: false,
        error: 'Image picker not available. Please install expo-image-picker.'
      };
    }

    // Request permission to access media library
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (!permissionResult.granted) {
      return {
        success: false,
        error: 'Permission to access media library is required to select images'
      };
    }

    // Launch image picker
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio for profile images
      quality: 0.8, // Compress to reduce file size
      base64: true, // Get base64 representation
    });

    if (result.canceled) {
      return {
        success: false,
        error: 'Image selection cancelled'
      };
    }

    if (result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      
      // Check if we have base64 data
      if (asset.base64) {
        // Create data URL from base64
        const mimeType = asset.mimeType || 'image/jpeg';
        const dataUrl = `data:${mimeType};base64,${asset.base64}`;
        
        return {
          success: true,
          uri: dataUrl
        };
      } else if (asset.uri) {
        // Fallback to file URI (though this won't persist across app restarts)
        return {
          success: true,
          uri: asset.uri
        };
      }
    }

    return {
      success: false,
      error: 'No image data available'
    };
    
  } catch (error) {
    console.error('Mobile image picker error:', error);
    return {
      success: false,
      error: 'Failed to open image picker. Please try again.'
    };
  }
};