import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { SearchCreatorModal } from '../SearchCreatorModal';
import { getMultipleCreatorsData, CreatorData } from '../../services/youtubeService';
import { getCreators, Creator, updateCreatorSubscriberCount } from '../../services/database';
import { addRecentlyClickedCreator, getRecentlyClickedCreators } from '../../services/recentCreators';
import { useTheme } from '../../context/ThemeContext';

export default function WebHome() {
  const [creators, setCreators] = useState<Creator[]>([]);
  const [displayedCreatorsData, setDisplayedCreatorsData] = useState<CreatorData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearchModalVisible, setIsSearchModalVisible] = useState(false);

  // Theme
  const { theme } = useTheme();

  useEffect(() => {
    loadCreators();
  }, []);

  useEffect(() => {
    if (creators.length > 0) {
      loadDisplayedCreatorsData();
    } else {
      setDisplayedCreatorsData([]);
    }
  }, [creators]);

  const loadCreators = async () => {
    try {
      console.log('Loading creators from database...');
      const savedCreators = await getCreators();
      console.log('Loaded creators:', savedCreators.length);
      setCreators(savedCreators);
    } catch (error) {
      console.error('Error loading creators:', error);
    }
  };

  const getTop5Creators = (creatorsList: Creator[] = creators): Creator[] => {
    if (creatorsList.length === 0) return [];

    const recentlyClicked = getRecentlyClickedCreators();
    
    if (recentlyClicked.length > 0) {
      // Show recently clicked creators first
      const recentCreators = recentlyClicked
        .map(id => creatorsList.find(creator => creator.id === id))
        .filter((creator): creator is Creator => creator !== undefined)
        .slice(0, 5);
      
      // If we need more creators to fill 5 spots, add popular ones
      if (recentCreators.length < 5) {
        const remainingCreators = creatorsList
          .filter(creator => !recentlyClicked.includes(creator.id))
          .sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0))
          .slice(0, 5 - recentCreators.length);
        
        return [...recentCreators, ...remainingCreators];
      }
      
      return recentCreators;
    } else {
      // Show top 5 most popular creators
      return creatorsList
        .sort((a, b) => (b.subscriberCount || 0) - (a.subscriberCount || 0))
        .slice(0, 5);
    }
  };

  const loadDisplayedCreatorsData = async (creatorsList?: Creator[]) => {
    setIsLoading(true);
    try {
      const currentCreators = creatorsList || creators;
      const top5Creators = getTop5Creators(currentCreators);
      console.log('Loading data for top 5 creators:', top5Creators.length);
      
      const channelIds = top5Creators.map(creator => creator.id);
      const data = await getMultipleCreatorsData(channelIds);
      
      // Update subscriber counts in database
      for (const creatorData of data) {
        if (creatorData.channel.subscriberCount) {
          await updateCreatorSubscriberCount(
            creatorData.channel.id, 
            creatorData.channel.subscriberCount
          );
        }
      }
      
      console.log('Loaded top 5 creators data:', data.length);
      setDisplayedCreatorsData(data);
    } catch (error) {
      console.error('Error loading creators data:', error);
      Alert.alert('Error', 'Failed to load creators data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatorAdded = async () => {
    console.log('Creator added, refreshing lists...');
    try {
      // Load fresh creators list from database
      const freshCreators = await getCreators();
      console.log('Fresh creators loaded:', freshCreators.length);
      
      // Update state and immediately load displayed data with fresh list
      setCreators(freshCreators);
      await loadDisplayedCreatorsData(freshCreators);
      
      console.log('Creator lists refreshed');
    } catch (error) {
      console.error('Error refreshing creator lists:', error);
    }
  };

  const handleCreatorClick = (creatorId: string) => {
    addRecentlyClickedCreator(creatorId);
    // Here you could navigate to creator detail page or perform other actions
    console.log('Creator clicked:', creatorId);
  };

  const styles = createStyles(theme);

  const renderCreatorCard = ({ item }: { item: CreatorData }) => (
    <TouchableOpacity 
      style={styles.creatorCard}
      onPress={() => handleCreatorClick(item.channel.id)}
      activeOpacity={0.8}
    >
      <View style={styles.creatorInfo}>
        <Image source={{ uri: item.channel.thumbnailUrl }} style={styles.creatorImage} />
        <View style={styles.creatorTextContainer}>
          <Text style={styles.creatorText}>{item.channel.title}</Text>
          <Text style={styles.subscriberText}>
            {item.channel.subscriberCount 
              ? `${(Number(item.channel.subscriberCount) / 1000000).toFixed(1)}M subscribers`
              : 'Subscriber count unavailable'
            }
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Main Banner */}
      <View style={styles.banner}>
        <Image
          style={styles.bannerImage}
          resizeMode='contain'
          source={require("../../assets/images/react-logo.png")}
        />
        <Text style={styles.bannerText}>CCTV</Text>
        <Text style={styles.bannerSubtext}>Content Creator Television</Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <TouchableOpacity
          style={styles.addCreatorButton}
          onPress={() => setIsSearchModalVisible(true)}
        >
          <Text style={styles.addCreatorButtonText}>Add Creator</Text>
        </TouchableOpacity>

        <SearchCreatorModal
          visible={isSearchModalVisible}
          onClose={() => setIsSearchModalVisible(false)}
          onCreatorAdded={handleCreatorAdded}
        />

        {isLoading ? (
          <Text style={styles.loadingText}>Loading creators...</Text>
        ) : displayedCreatorsData.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              {getRecentlyClickedCreators().length > 0 ? 'Recently Viewed' : 'Most Popular'}
            </Text>
            <FlatList
              data={displayedCreatorsData}
              renderItem={renderCreatorCard}
              keyExtractor={(item) => item.channel.id}
              style={styles.creatorsList}
              showsVerticalScrollIndicator={false}
            />
          </>
        ) : creators.length > 0 ? (
          <Text style={styles.loadingText}>Loading creator data...</Text>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.noCreatorsText}>
              No creators found. Add some creators to get started!
            </Text>
            <TouchableOpacity
              style={styles.addFirstCreatorButton}
              onPress={() => setIsSearchModalVisible(true)}
            >
              <Text style={styles.addFirstCreatorButtonText}>Add Your First Creator</Text>
            </TouchableOpacity>
          </View>
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
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
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
    fontWeight: 'bold',
  },
  bannerSubtext: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    marginTop: 5,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  addCreatorButton: {
    backgroundColor: theme.colors.button,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addCreatorButtonText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
  sectionTitle: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
  },
  creatorCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: theme.colors.text,
    shadowOffset: { 
      width: 0, 
      height: 2 
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  creatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  creatorImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  creatorTextContainer: {
    flex: 1,
    marginLeft: 15,
  },
  creatorText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subscriberText: {
    color: theme.colors.textSecondary,
    fontSize: 14,
  },
  creatorsList: {
    marginTop: 10,
  },
  loadingText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 18,
    marginTop: 50,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noCreatorsText: {
    color: theme.colors.text,
    textAlign: 'center',
    fontSize: 16,
    marginBottom: 20,
    lineHeight: 22,
  },
  addFirstCreatorButton: {
    backgroundColor: theme.colors.success,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 8,
    marginTop: 10,
    shadowColor: theme.colors.text,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  addFirstCreatorButtonText: {
    color: theme.colors.buttonText,
    fontSize: 16,
    fontWeight: 'bold',
  },
});