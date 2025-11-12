import { Platform } from 'react-native';

// Import platform-specific implementations
let dbImplementation: any;

if (Platform.OS === 'web') {
  dbImplementation = require('./database.web');
} else {
  dbImplementation = require('./database.native');
}

// Re-export all functions from the platform-specific implementation
export const {
  initDatabase,
  getCreators,
  addCreator,
  removeCreator,
  getVideos,
  addVideos,
  getVideosByCreatorId,
  clearAllData,
  getCreatorById,
  getVideoCount,
  getCreatorCount,
  updateCreatorSubscriberCount,
} = dbImplementation;

export type { Creator, Video } from './database.types';