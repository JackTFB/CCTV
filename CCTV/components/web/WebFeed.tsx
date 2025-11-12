import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Alert, Modal } from 'react-native';
import { getMultipleCreatorsData, CreatorData, YouTubeVideo } from '../../services/youtubeService';
import { getCreators, Creator, removeCreator } from '../../services/database';
import { feedService } from '../../services/feedService';
import { useTheme } from '../../context/ThemeContext';

export default function WebFeed() {
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
  const iframeRef = useRef<HTMLIFrameElement>(null);
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
      console.log('🔄 loadCreators: Starting...');
      const savedCreators = await getCreators();
      console.log('🔄 loadCreators: Retrieved creators from DB:', savedCreators.length);
      setCreators(savedCreators);
    } catch (error) {
      console.error('❌ loadCreators error:', error);
    }
  };

  const loadCreatorsData = async () => {
    console.log('🎬 loadCreatorsData: Starting with creators:', creators.length);
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
      console.error('❌ loadCreatorsData error:', error);
      alert('Failed to load creators data');
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
      alert(`${creatorToRemove.name} has been removed from your list.`);
    } catch (error) {
      console.error('❌ Error removing creator:', error);
      alert('Failed to remove creator. Please try again.');
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
    console.log('🎬 Advancing to next video...');
    
    // Clear any existing timeout
    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current);
      autoAdvanceTimeoutRef.current = null;
    }

    if (!playingCreator) return;

    // Consume current video from feed service
    const consumedVideo = feedService.consumeNextVideo(playingCreator.channel.id);
    
    if (consumedVideo) {
      console.log(`🎬 Consumed video: ${consumedVideo.title}`);
    }

    // Refresh the queue display
    refreshQueueDisplay();

    if (videoQueue.length > 0) {
      setIsPlaying(true);
      
      // Set new timeout for next video
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        advanceToNextVideo();
      }, 10 * 60 * 1000); // 10 minutes
    } else {
      // No more videos available, close player
      console.log('❌ No more videos in queue, closing player');
      closeVideoPlayer();
    }
  }, [playingCreator, refreshQueueDisplay, videoQueue.length]);

  // Handle creator card click to start video playback
  const handleCreatorCardClick = (creatorData: CreatorData) => {
    console.log(`🎬 Starting playback for ${creatorData.channel.title}`);
    
    // Get feed from service
    const feed = feedService.getCreatorFeed(creatorData);
    const queue = feedService.getQueuePreview(creatorData.channel.id);
    
    if (queue.length > 0) {
      setVideoQueue(queue);
      setCurrentVideoIndex(0);
      setPlayingCreator(creatorData);
      setIsPlaying(true);
      
      // Set timeout for auto-advance
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        advanceToNextVideo();
      }, 10 * 60 * 1000); // 10 minutes
      
      console.log(`🎬 Started playback with ${queue.length} videos in queue`);
    } else {
      console.log('❌ No videos available for playback');
      alert('No videos available for this creator');
    }
  };

  // Close video player
  const closeVideoPlayer = () => {
    console.log('🎬 Closing video player');
    
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

  // Manual controls for video player
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
    }, 10 * 60 * 1000);
  };

  // Format time until next video
  const formatTimeUntilVideo = (videoIndex: number): string => {
    const now = new Date();
    const currentTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    const minutesUntilVideo = videoIndex * 10;
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
      <View style={styles.queueSlot} key={video.id}>
        <Image source={{ uri: video.thumbnailUrl }} style={styles.queueThumbnail} />
        <View style={styles.queueVideoInfo}>
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
          {/* Left section - Creator info */}
          <View style={styles.creatorInfoCompact}>
            <Image source={{ uri: item.channel.thumbnailUrl }} style={styles.creatorImageCompact} />
            <Text style={styles.creatorTextCompact} numberOfLines={2}>
              {item.channel.title}
            </Text>
            <Text style={styles.queueLengthText}>
              {queueLength} videos queued
            </Text>
          </View>
          
          {/* Right section - Video queue (4 slots) */}
          <View style={styles.videoQueueContainer}>
            {[0, 1, 2, 3].map(index => 
              renderVideoQueueSlot(queueVideos[index], index)
            )}
          </View>
        </View>
        
        <TouchableOpacity
          style={[
            styles.removeButton,
            removingCreatorId === item.channel.id && styles.removeButtonDisabled
          ]}
          onPress={(e) => {
            e.stopPropagation();
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

  // Web-compatible iframe component
  const YouTubeIframe = ({ videoId, key: iframeKey }: { videoId: string; key: string }) => {
    const iframeStyle = {
      width: '100%',
      height: 300,
      border: 'none',
      backgroundColor: '#000',
    };

    return (
      <iframe
        key={iframeKey}
        ref={iframeRef}
        style={iframeStyle}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&controls=1&rel=0&modestbranding=1&html5=1&playsinline=1&iv_load_policy=3&start=0&end=0`}
        allow="autoplay; encrypted-media; fullscreen"
        allowFullScreen
        title="YouTube video player"
      />
    );
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
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
              <YouTubeIframe
                key={`${videoQueue[currentVideoIndex].id}-${currentVideoIndex}-${Date.now()}`}
                videoId={videoQueue[currentVideoIndex].id}
              />
            )}
            
            {/* Video Controls */}
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
          </View>
        </View>
      </Modal>

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
            style={styles.creatorsList}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <Text style={styles.noCreatorsText}>
            No creators found. Add some in the Home section!
          </Text>
        )}
      </View>
    </View>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  banner: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    height: 100,
    width: 100,
  },
  bannerText: {
    color: theme.colors.text,
    marginTop: 10,
    fontSize: 50,
    fontFamily: 'sans-serif',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 18,
    marginTop: 50,
  },
  noCreatorsText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
  },
  creatorsList: {
    marginTop: 20,
  },
  creatorCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
  },
  creatorMainContent: {
    flexDirection: 'row',
    paddingRight: 40,
    alignItems: 'flex-start',
  },
  
  // Compact creator info styles
  creatorInfoCompact: {
    width: '25%',
    alignItems: 'center',
    paddingRight: 10,
  },
  creatorImageCompact: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 5,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  creatorTextCompact: {
    color: theme.colors.text,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 14,
  },
  
  // Video queue styles
  videoQueueContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  queueSlot: {
    width: '23%',
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    padding: 8,
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyQueueSlot: {
    width: '23%',
    backgroundColor: theme.colors.background,
    borderRadius: 8,
    minHeight: 80,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderStyle: 'dashed',
  },
  queueThumbnail: {
    width: '100%',
    height: 35,
    borderRadius: 4,
    marginBottom: 4,
  },
  queueVideoInfo: {
    flex: 1,
  },
  queueVideoTitle: {
    color: theme.colors.text,
    fontSize: 10,
    lineHeight: 12,
    marginBottom: 4,
  },
  queueVideoTime: {
    color: theme.colors.accent,
    fontSize: 8,
    fontWeight: 'bold',
  },
  queueLengthText: {
    color: theme.colors.accent,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 2,
    fontWeight: 'bold',
  },
  queueVideoType: {
    color: theme.colors.accent,
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 2,
  },
  currentVideoType: {
    color: theme.colors.accent,
    fontSize: 12,
    marginBottom: 5,
  },
  queueInfoText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 5,
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
    elevation: 2,
    shadowColor: theme.colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  removeButtonDisabled: {
    backgroundColor: '#666666',
  },
  removeButtonText: {
    color: theme.colors.buttonText,
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
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  removeButtonModal: {
    backgroundColor: theme.colors.error,
  },
  removeButtonModalText: {
    color: theme.colors.buttonText,
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
    width: '90%',
    maxWidth: 800,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 20,
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
    fontSize: 16,
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
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoQueueInfo: {
    marginTop: 15,
    padding: 10,
    backgroundColor: theme.colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  currentVideoTitle: {
    color: theme.colors.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  nextVideoText: {
    color: theme.colors.accent,
    fontSize: 12,
  },
  
  // Video controls styles
  videoControlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
    paddingHorizontal: 10,
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
    color: theme.colors.buttonText,
    fontSize: 12,
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: '#FF6B35',
  },
  videoDurationText: {
    color: theme.colors.textSecondary,
    fontSize: 10,
    marginTop: 5,
  },
});