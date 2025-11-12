import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, SafeAreaView, TextInput } from 'react-native';
import { getCreators, Creator } from '../../services/database';
import { getMultipleCreatorsData, CreatorData, YouTubeVideo } from '../../services/youtubeService';
import YoutubeIframe from "react-native-youtube-iframe";
import { useTheme } from '../../context/ThemeContext';

export default function MobileVOD() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [allVideos, setAllVideos] = useState<YouTubeVideo[]>([]);
  const [filteredVideos, setFilteredVideos] = useState<YouTubeVideo[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'videos' | 'shorts' | 'vods'>('all');
  const [playingVideo, setPlayingVideo] = useState<YouTubeVideo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Creator dropdown/search state
  const [searchText, setSearchText] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [filteredCreators, setFilteredCreators] = useState<Creator[]>([]);

  // Theme
  const { theme } = useTheme();

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    if (selectedCreator) {
      loadCreatorVideos(selectedCreator);
    } else {
      setAllVideos([]);
    }
  }, [selectedCreator]);

  useEffect(() => {
    filterVideos();
  }, [allVideos, selectedType]);

  useEffect(() => {
    // Filter creators based on search text
    if (searchText.trim() === '') {
      setFilteredCreators(creators);
    } else {
      const filtered = creators.filter(creator =>
        creator.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCreators(filtered);
    }
  }, [searchText, creators]);

  const loadCreators = async () => {
    try {
      const savedCreators = await getCreators();
      setCreators(savedCreators);
      setFilteredCreators(savedCreators);
    } catch (error) {
      console.error('Error loading creators:', error);
    }
  };

  const loadCreatorVideos = async (creator: Creator) => {
    setIsLoading(true);
    try {
      const creatorsData = await getMultipleCreatorsData([creator.id]);
      
      if (creatorsData.length > 0) {
        const data = creatorsData[0];
        const videos: YouTubeVideo[] = [];
        videos.push(...data.latestVideos);
        videos.push(...data.shorts);
        videos.push(...data.vods);

        videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        setAllVideos(videos);
      }
    } catch (error) {
      console.error('Error loading videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filterVideos = () => {
    if (selectedType === 'all') {
      setFilteredVideos(allVideos);
    } else {
      setFilteredVideos(allVideos.filter(video => video.videoType === selectedType));
    }
  };

  const handleCreatorSelect = (creator: Creator) => {
    setSelectedCreator(creator);
    setSearchText(creator.name);
    setShowDropdown(false);
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setShowDropdown(true);
    
    // If search is cleared, clear selected creator
    if (text.trim() === '') {
      setSelectedCreator(null);
    }
  };

  const onPlayerStateChange = useCallback((state: string) => {
    if (state === 'ended') {
      setPlayingVideo(null);
    }
  }, []);

  const styles = createStyles(theme);

  const renderVideoItem = ({ item }: { item: YouTubeVideo }) => (
    <TouchableOpacity
      style={styles.videoItem}
      onPress={() => setPlayingVideo(item)}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.videoThumbnail} />
      <View style={styles.videoInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.channelName}>{item.channelTitle}</Text>
        <Text style={styles.videoDate}>
          {new Date(item.publishedAt).toLocaleDateString()}
        </Text>
        <View style={styles.videoTypeTag}>
          <Text style={styles.videoTypeText}>{item.videoType?.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFilterButton = (type: 'all' | 'videos' | 'shorts' | 'vods', label: string) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        selectedType === type && styles.filterButtonActive,
      ]}
      onPress={() => setSelectedType(type)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedType === type && styles.filterButtonTextActive
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const renderCreatorDropdownItem = ({ item }: { item: Creator }) => (
    <TouchableOpacity
      style={styles.dropdownItem}
      onPress={() => handleCreatorSelect(item)}
    >
      <Image source={{ uri: item.thumbnailUrl }} style={styles.creatorThumbnail} />
      <Text style={styles.dropdownItemText}>{item.name}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Modal
        visible={!!playingVideo}
        transparent={true}
        animationType='fade'
        onRequestClose={() => setPlayingVideo(null)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.videoPlayerContainer}>
            {playingVideo && (
              <YoutubeIframe
                height={200}
                play={true}
                videoId={playingVideo.id}
                onChangeState={onPlayerStateChange}
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setPlayingVideo(null)}
            >
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
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

      <Text style={styles.header}>Videos & VODs</Text>

      {creators.length === 0 ? (
        <View style={styles.emptyCreatorsContainer}>
          <Text style={styles.emptyCreatorsText}>
            No creators found. Go to the Home page to add some creators first!
          </Text>
        </View>
      ) : (
        <>
          {/* Creator Search/Dropdown */}
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search creators..."
              placeholderTextColor={theme.colors.textSecondary}
              value={searchText}
              onChangeText={handleSearchChange}
              onFocus={() => setShowDropdown(true)}
            />
            
            {showDropdown && filteredCreators.length > 0 && (
              <View style={styles.dropdown}>
                <FlatList
                  data={filteredCreators}
                  renderItem={renderCreatorDropdownItem}
                  keyExtractor={(item) => item.id}
                  style={styles.dropdownList}
                  showsVerticalScrollIndicator={false}
                  nestedScrollEnabled={true}
                />
              </View>
            )}
          </View>

          {/* Close dropdown when clicking outside */}
          {showDropdown && (
            <TouchableOpacity
              style={styles.overlay}
              onPress={() => setShowDropdown(false)}
              activeOpacity={1}
            />
          )}

          {selectedCreator && (
            <View style={styles.filterContainer}>
              {renderFilterButton('all', 'All')}
              {renderFilterButton('videos', 'Videos')}
              {renderFilterButton('shorts', 'Shorts')}
              {renderFilterButton('vods', 'VODs')}
            </View>
          )}

          {isLoading ? (
            <Text style={styles.loadingText}>Loading videos...</Text>
          ) : !selectedCreator ? (
            <Text style={styles.emptyText}>
              Select a creator to view their videos and VODs
            </Text>
          ) : filteredVideos.length > 0 ? (
            <FlatList
              data={filteredVideos}
              renderItem={renderVideoItem}
              keyExtractor={(item) => item.id}
              showsVerticalScrollIndicator={false}
            />
          ) : (
            <Text style={styles.emptyText}>
              No videos found for this creator. Try a different filter or check back later.
            </Text>
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const createStyles = (theme: any) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
    padding: 16,
  },
  banner: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    height: 80,
    width: 80,
  },
  bannerText: {
    color: theme.colors.text,
    marginTop: 10,
    fontSize: 32,
    fontFamily: 'sans-serif',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  // Creator search/dropdown styles
  searchContainer: {
    position: 'relative',
    zIndex: 1000,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    padding: 15,
    color: theme.colors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: theme.colors.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderTopWidth: 0,
    maxHeight: 200,
    zIndex: 1001,
  },
  dropdownList: {
    maxHeight: 200,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  creatorThumbnail: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginRight: 10,
  },
  dropdownItemText: {
    color: theme.colors.text,
    fontSize: 16,
    flex: 1,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  emptyCreatorsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCreatorsText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 18,
    marginHorizontal: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    flexWrap: 'wrap',
    gap: 10,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.accent,
  },
  filterButtonText: {
    color: theme.colors.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterButtonTextActive: {
    color: theme.colors.buttonText,
  },
  videoItem: {
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
    flexDirection: 'row',
  },
  videoThumbnail: {
    width: 120,
    height: 68,
    borderRadius: 8,
    marginRight: 10,
  },
  videoInfo: {
    flex: 1,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  channelName: {
    fontSize: 12,
    color: theme.colors.accent,
    marginBottom: 5,
  },
  videoDate: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 5,
  },
  videoTypeTag: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  videoTypeText: {
    fontSize: 10,
    color: theme.colors.buttonText,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.modalOverlay,
  },
  videoPlayerContainer: {
    width: '90%',
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    padding: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  closeButton: {
    backgroundColor: theme.colors.error,
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 10,
  },
  closeButtonText: {
    color: theme.colors.buttonText,
    fontWeight: 'bold',
  },
  loadingText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
  },
  emptyText: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    fontSize: 16,
    marginTop: 50,
  },
});