import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Modal, SafeAreaView, Alert } from 'react-native';
import { getMultipleCreatorsData, CreatorData, YouTubeVideo } from '../../services/youtubeService';
import { getCreators, Creator, removeCreator } from '../../services/database';
import { feedService } from '../../services/feedService';
import { useTheme } from '../../context/ThemeContext';
import YoutubeIframe from "react-native-youtube-iframe";

export default function MobileFeed() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [creatorsData, setCreatorsData] = useState<CreatorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [removingCreatorId, setRemovingCreatorId] = useState<string | null>(null);
  
  // Modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [creatorToRemove, setCreatorToRemove] = useState<{id: string, name: string} | null>(null);

  // Video player state
  const [playingCreator, setPlayingCreator] = useState<CreatorData | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoQueue, setVideoQueue] = useState<YouTubeVideo[]>([]);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Refs for better control
  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Theme
  const { theme } = useTheme();

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    if (creators.length > 0) {
      loadCreatorsData();
    } else {
      setCreatorsData([]);
    }
  }, [creators]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  const loadCreators = async () => {
    try {
      console.log('🔄 MobileFeed loadCreators: Starting...');
      const savedCreators = await getCreators();
      console.log('🔄 MobileFeed loadCreators: Retrieved creators from DB:', savedCreators.length);
      setCreators(savedCreators);
    } catch (error) {
      console.error('❌ MobileFeed loadCreators error:', error);
    }
  };

  const loadCreatorsData = async () => {
    console.log('🎬 MobileFeed loadCreatorsData: Starting with creators:', creators.length);
    setIsLoading(true);
    try {
      const channelIds = creators.map(creator => creator.id);
      const data = await getMultipleCreatorsData(channelIds);
      
      // Initialize feeds for each creator
      data.forEach(creatorData => {
        feedService.getCreatorFeed(creatorData);
      });
      
      setCreatorsData(data);
    } catch (error) {
      console.error('❌ MobileFeed loadCreatorsData error:', error);
      Alert.alert('Error', 'Failed to load creators data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveCreator = (creatorId: string, creatorName: string) => {
    setCreatorToRemove({id: creatorId, name: creatorName});
    setShowConfirmModal(true);
  };

  const confirmRemoveCreator = async () => {
    if (!creatorToRemove) return;
    
    setRemovingCreatorId(creatorToRemove.id);
    setShowConfirmModal(false);
    
    try {
      await removeCreator(creatorToRemove.id);
      feedService.removeCreatorFeed(creatorToRemove.id);
      await loadCreators();
      Alert.alert('Success', `${creatorToRemove.name} has been removed from your list.`);
    } catch (error) {
      console.error('❌ Error removing creator:', error);
      Alert.alert('Error', 'Failed to remove creator. Please try again.');
    } finally {
      setRemovingCreatorId(null);
      setCreatorToRemove(null);
    }
  };

  const cancelRemoval = () => {
    setShowConfirmModal(false);
    setCreatorToRemove(null);
  };

  // Refresh the queue preview after consuming a video
  const refreshQueueDisplay = useCallback(() => {
    if (!playingCreator) return;
    
    const updatedQueue = feedService.getQueuePreview(playingCreator.channel.id);
    setVideoQueue(updatedQueue);
    setCurrentVideoIndex(0); // Always play the first video in the updated queue
  }, [playingCreator]);

  // Advance to next video in queue
  const advanceToNextVideo = useCallback(async () => {
    console.log('🎬 Mobile: Advancing to next video...');
    
    // Clear any existing timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (!playingCreator) return;

    // Consume current video from feed service
    const consumedVideo = feedService.consumeNextVideo(playingCreator.channel.id);
    
    if (consumedVideo) {
      console.log(`🎬 Mobile: Consumed video: ${consumedVideo.title}`);
    }

    // Refresh the queue display
    refreshQueueDisplay();

    if (videoQueue.length > 0) {
      setIsPlaying(true);
      
      // Set new timeout for next video (shorter for mobile - 5 minutes)
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        advanceToNextVideo();
      }, 5 * 60 * 1000); // 5 minutes for mobile
    } else {
      // No more videos available, close player
      console.log('❌ Mobile: No more videos in queue, closing player');
      closeVideoPlayer();
    }
  }, [playingCreator, refreshQueueDisplay, videoQueue.length]);

  // Handle creator card click to start video playback
  const handleCreatorCardClick = (creatorData: CreatorData) => {
    console.log(`🎬 Mobile: Starting playback for ${creatorData.channel.title}`);
    
    // Get feed from service
    const feed = feedService.getCreatorFeed(creatorData);
    const queue = feedService.getQueuePreview(creatorData.channel.id);
    
    if (queue.length > 0) {
      setVideoQueue(queue);
      setCurrentVideoIndex(0);
      setPlayingCreator(creatorData);
      setIsPlaying(true);
      
      // Set timeout for auto-advance (5 minutes for mobile)
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        advanceToNextVideo();
      }, 5 * 60 * 1000); // 5 minutes for mobile
      
      console.log(`🎬 Mobile: Started playback with ${queue.length} videos in queue`);
    } else {
      console.log('❌ Mobile: No videos available for playback');
      Alert.alert('No Videos', 'No videos available for this creator');
    }
  };

  const closeVideoPlayer = () => {
    console.log('🎬 Mobile: Closing video player');
    
    // Clear timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    
    setPlayingCreator(null);
    setVideoQueue([]);
    setCurrentVideoIndex(0);
    setIsPlaying(false);
  };

  const skipToNext = () => {
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }
    advanceToNextVideo();
  };

  const skipToPrevious = () => {
    // For simplicity, just restart current video
    setCurrentVideoIndex(0);
    setIsPlaying(true);
    
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
    }
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      advanceToNextVideo();
    }, 5 * 60 * 1000);
  };

  const onPlayerStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      // Auto-advance to next video when current video ends
      skipToNext();
    }
  }, [skipToNext]);

  // Format time until next video
  const formatTimeUntilVideo = (videoIndex: number): string => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const minutesUntilVideo = videoIndex * 5; // 5 minutes for mobile
    const futureTime = new Date(now.getTime() + minutesUntilVideo * 60000);
    const futureTimeString = futureTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (videoIndex === 0) {
      return `Now - ${currentTime}`;
    }
    
    return `${futureTimeString} (in ${minutesUntilVideo}m)`;
  };

  const renderVideoQueueSlot = (video: YouTubeVideo | undefined, index: number) => {
    const styles = createStyles(theme);
    
    if (!video) {
      return <View style={styles.emptyQueueSlot} key={`empty-${index}`} />;
    }

    return (
      <View style={[styles.queueSlot, currentVideoIndex === index && styles.activeQueueSlot]} key={video.id}>
        <Image source={{ uri: video.thumbnailUrl }} style={styles.queueThumbnail} />
        <Text style={styles.queueVideoTitle} numberOfLines={2}>
          {video.title}
        </Text>
        <Text style={styles.queueVideoTime}>
          {formatTimeUntilVideo(index)}
        </Text>
        <Text style={styles.queueVideoType}>
          {video.videoType?.toUpperCase() || 'VIDEO'}
        </Text>
      </View>
    );
  };

  const renderCreatorCard = ({ item }: { item: CreatorData }) => {
    const styles = createStyles(theme);
    
    // Get queue preview from feed service
    const queueVideos = feedService.getQueuePreview(item.channel.id);
    const queueLength = feedService.getQueueLength(item.channel.id);
    
    return (
      <TouchableOpacity 
        style={styles.creatorCard}
        onPress={() => handleCreatorCardClick(item)}
        activeOpacity={0.8}
      >
        <View style={styles.creatorMainContent}>
          {/* Creator info */}
          <View style={styles.creatorInfo}>
            <Image source={{ uri: item.channel.thumbnailUrl }} style={styles.creatorImage} />
            <Text style={styles.creatorText}>{item.channel.title}</Text>
            <Text style={styles.queueLengthText}>
              {queueLength} videos queued
            </Text>
          </View>
          
          {/* Video queue preview */}
          <View style={styles.videoQueueContainer}>
            {[0, 1].map(index => 
              queueVideos[index] ? (
                <Image
                  key={index}
                  source={{ uri: queueVideos[index].thumbnailUrl }}
                  style={styles.videoThumbnail}
                />
              ) : (
                <View key={`empty-${index}`} style={styles.emptyVideoSlot} />
              )
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.removeButton,
            removingCreatorId === item.channel.id && styles.removeButtonDisabled
          ]}
          onPress={(e) => {
            e.stopPropagation(); // Prevent creator card click
            handleRemoveCreator(item.channel.id, item.channel.title);
          }}
          disabled={removingCreatorId === item.channel.id}
        >
          <Text style={styles.removeButtonText}>
            {removingCreatorId === item.channel.id ? '...' : '×'}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const styles = createStyles(theme);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Confirmation Modal */}
      <Modal
        visible={showConfirmModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelRemoval}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Remove Creator</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to remove {creatorToRemove?.name} from your list? 
              This will also remove all their videos.
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelRemoval}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.removeButtonModal]}
                onPress={confirmRemoveCreator}
              >
                <Text style={styles.removeButtonModalText}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Video Player Modal */}
      <Modal
        visible={!!playingCreator}
        transparent={true}
        animationType='fade'
        onRequestClose={closeVideoPlayer}
      >
        <View style={styles.videoModalOverlay}>
          <View style={styles.videoPlayerContainer}>
            <View style={styles.videoPlayerHeader}>
              <Text style={styles.videoPlayerTitle}>
                {playingCreator?.channel.title} - Playing from Feed Queue
              </Text>
              <TouchableOpacity
                style={styles.closeVideoButton}
                onPress={closeVideoPlayer}
              >
                <Text style={styles.closeVideoButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {playingCreator && videoQueue[currentVideoIndex] && (
              <YoutubeIframe
                height={200}
                play={isPlaying}
                videoId={videoQueue[currentVideoIndex].id}
                onChangeState={onPlayerStateChange}
              />
            )}
            
            {/* Mobile Video Controls */}
            <View style={styles.videoControlsContainer}>
              <TouchableOpacity
                style={styles.controlButton}
                onPress={skipToPrevious}
              >
                <Text style={styles.controlButtonText}>⏮ Restart</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.controlButton, styles.skipButton]}
                onPress={skipToNext}
              >
                <Text style={styles.controlButtonText}>Skip to Next ⏭</Text>
              </TouchableOpacity>
            </View>
            
            {/* Current Video Info */}
            <View style={styles.videoQueueInfo}>
              <Text style={styles.currentVideoTitle}>
                Now Playing: {videoQueue[currentVideoIndex]?.title}
              </Text>
              <Text style={styles.currentVideoType}>
                Type: {videoQueue[currentVideoIndex]?.videoType?.toUpperCase() || 'VIDEO'}
              </Text>
              {videoQueue.length > 1 && (
                <Text style={styles.nextVideoText}>
                  Up Next: {videoQueue[1]?.title}
                </Text>
              )}
              <Text style={styles.queueInfoText}>
                Queue: {videoQueue.length} videos remaining
              </Text>
            </View>
            
            {/* Queue Display */}
            <View style={styles.mobileQueueContainer}>
              <Text style={styles.queueTitle}>Queue Preview:</Text>
              <View style={styles.mobileQueueList}>
                {videoQueue.slice(0, 4).map((video, index) => 
                  renderVideoQueueSlot(video, index)
                )}
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.container}>
        <View style={styles.banner}>
          <Image
            style={styles.bannerImage}
            resizeMode='contain'
            source={require("../../assets/images/react-logo.png")}
          />
          <Text style={styles.bannerText}>CCTV</Text>
        </View>

        <View style={styles.content}>
          {isLoading ? (
            <Text style={styles.loadingText}>Loading creators...</Text>
          ) : creatorsData.length > 0 ? (
            <FlatList
              data={creatorsData}
              renderItem={renderCreatorCard}
              keyExtractor={(item) => item.channel.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.noCreatorsText}>
              No creators found. Add some in the Home section!
            </Text>
          )}
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
    paddingHorizontal: 16,
  },
  banner: {
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    borderRadius: 10,
    marginHorizontal: 10,
    marginTop: 10,
  },
  bannerImage: {
    height: 60,
    width: 60,
  },
  bannerText: {
    color: theme.colors.text,
    marginTop: 8,
    fontSize: 32,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingTop: 10,
  },
  loadingText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 18,
    marginTop: 50,
  },
  noCreatorsText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
  },
  creatorCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  creatorMainContent: {
    paddingRight: 40,
  },
  creatorInfo: {
    alignItems: 'center',
    marginBottom: 10,
  },
  creatorImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  creatorText: {
    color: theme.colors.text,
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  queueLengthText: {
    color: theme.colors.accent,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    fontWeight: 'bold',
  },
  videoQueueContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  videoThumbnail: {
    width: 80,
    height: 45,
    borderRadius: 5,
  },
  emptyVideoSlot: {
    width: 80,
    height: 45,
    borderRadius: 5,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeButtonDisabled: {
    backgroundColor: '#666666',
  },
  removeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 20,
    width: '80%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 10,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#666666',
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButtonModal: {
    backgroundColor: theme.colors.error,
  },
  removeButtonModalText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Video player modal styles
  videoModalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerContainer: {
    width: '95%',
    maxWidth: 500,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  videoPlayerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  videoPlayerTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  closeVideoButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: theme.colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeVideoButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
  // Video info styles
  videoQueueInfo: {
    marginTop: 10,
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currentVideoTitle: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  currentVideoType: {
    color: theme.colors.accent,
    fontSize: 10,
    marginBottom: 5,
  },
  nextVideoText: {
    color: theme.colors.accent,
    fontSize: 10,
    marginBottom: 5,
  },
  queueInfoText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
  },
  
  // Video controls styles
  videoControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingHorizontal: 5,
  },
  controlButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    flex: 1,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  controlButtonDisabled: {
    backgroundColor: '#666666',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: '#FF6B35',
  },
  
  // Mobile queue display styles
  mobileQueueContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  queueTitle: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  mobileQueueList: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
  },
  queueSlot: {
    width: '22%',
    backgroundColor: theme.colors.card,
    borderRadius: 6,
    padding: 4,
    minHeight: 60,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  activeQueueSlot: {
    backgroundColor: theme.colors.accent,
  },
  emptyQueueSlot: {
    width: '22%',
    backgroundColor: theme.colors.surface,
    borderRadius: 6,
    minHeight: 60,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  queueThumbnail: {
    width: '100%',
    height: 20,
    borderRadius: 3,
    marginBottom: 2,
  },
  queueVideoTitle: {
    color: theme.colors.text,
    fontSize: 6,
    lineHeight: 8,
    marginBottom: 2,
  },
  queueVideoTime: {
    color: theme.colors.background,
    fontSize: 5,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 1,
  },
  queueVideoType: {
    color: theme.colors.accent,
    fontSize: 4,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});