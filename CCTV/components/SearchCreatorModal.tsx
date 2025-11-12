import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Image,
    StyleSheet,
    Alert
} from 'react-native';
import { searchForChannels, YouTubeChannel } from '../services/youtubeService';
import { addCreator } from '../services/database';
import { useTheme } from '../context/ThemeContext';

const YOUTUBE_API_KEY = 'AIzaSyB9re5DOg4S4bOBsGJV1ZsXj-zlWcSXFOs';

interface SearchCreatorModalProps {
    visible: boolean;
    onClose: () => void;
    onCreatorAdded: () => void;
}

export const SearchCreatorModal: React.FC<SearchCreatorModalProps> = ({
    visible,
    onClose,
    onCreatorAdded,
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<YouTubeChannel[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Theme
    const { theme } = useTheme();

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;

        setIsSearching(true);
        try {
            // FIXED: No auth needed
            const results = await searchForChannels(searchQuery);
            setSearchResults(results);
        } catch (error) {
            Alert.alert('Error', 'Failed to search for channels');
        } finally {
            setIsSearching(false);
        }
    };

    const handleAddCreator = async (channel: YouTubeChannel) => {
        setIsAdding(true);
        try {
            await addCreator({
                id: channel.id,
                name: channel.title,
                thumbnailUrl: channel.thumbnailUrl,
            });
            Alert.alert(`Success`, `Added ${channel.title} to your list!`);
            onCreatorAdded();
            handleClose();
        } catch (error) {
            Alert.alert('Error', 'Failed to add creator');
            console.error('Add creator error:', error);
        } finally {
            setIsAdding(false);
        }
    };

    const handleClose = () => {
        setSearchQuery('');
        setSearchResults([]);
        onClose();
    }

    const styles = createStyles(theme);

    const renderChannelItem = ({ item }: { item: YouTubeChannel }) => (
        <View style={styles.channelItem}>
            <Image source={{ uri: item.thumbnailUrl }} style={styles.channelImage} />
            <View style={styles.channelInfo}>
                <Text style={styles.channelTitle}>{item.title}</Text>
                <Text style={styles.channelDescription} numberOfLines={2}>
                    {item.description}
                </Text>
            </View>
            <TouchableOpacity
                style={[
                    styles.addButton,
                    isAdding && styles.addButtonDisabled
                ]}
                onPress={() => handleAddCreator(item)}
                disabled={isAdding}
            >
                <Text style={styles.addButtonText}>
                    {isAdding ? 'Adding...' : 'Add'}
                </Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            onRequestClose={handleClose}
        >
            <View style={styles.modalContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerTitle}>Search Creators</Text>
                    <TouchableOpacity 
                        onPress={handleClose}
                        style={styles.closeButtonContainer}
                    >
                        <Text style={styles.closeButton}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.searchContainer}>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search for creators (e.g., Marques Brownlee)"
                        placeholderTextColor={theme.colors.textSecondary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={handleSearch}
                    />
                    <TouchableOpacity
                        style={[
                            styles.searchButton,
                            (!searchQuery.trim() || isSearching) && styles.searchButtonDisabled
                        ]}
                        onPress={handleSearch}
                        disabled={isSearching || !searchQuery.trim()}
                    >
                        <Text style={styles.searchButtonText}>
                            {isSearching ? 'Searching...' : 'Search'}
                        </Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    data={searchResults}
                    renderItem={renderChannelItem}
                    keyExtractor={(item) => item.id}
                    style={styles.resultsList}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        searchQuery && !isSearching ? (
                            <Text style={styles.emptyText}>
                                No results found
                            </Text>
                        ) : null
                    }
                />
            </View>
        </Modal>
    )
}

const createStyles = (theme: any) => StyleSheet.create({
    modalContainer: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 50,
        borderBottomWidth: 1,
        borderBottomColor: theme.colors.border,
        backgroundColor: theme.colors.surface,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: theme.colors.text,
    },
    closeButtonContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: theme.colors.error,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButton: {
        fontSize: 18,
        color: theme.colors.buttonText,
        fontWeight: 'bold',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 20,
        gap: 10,
        backgroundColor: theme.colors.background,
    },
    searchInput: {
        flex: 1,
        backgroundColor: theme.colors.card,
        color: theme.colors.text,
        padding: 15,
        borderRadius: 8,
        fontSize: 16,
        borderWidth: 1,
        borderColor: theme.colors.border,
    },
    searchButton: {
        backgroundColor: theme.colors.button,
        paddingHorizontal: 20,
        paddingVertical: 15,
        borderRadius: 8,
        justifyContent: 'center',
        shadowColor: theme.colors.text,
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 3,
    },
    searchButtonDisabled: {
        backgroundColor: '#666666',
        opacity: 0.7,
    },
    searchButtonText: {
        color: theme.colors.buttonText,
        fontWeight: 'bold',
        fontSize: 14,
    },
    resultsList: {
        flex: 1,
        paddingHorizontal: 20,
        backgroundColor: theme.colors.background,
    },
    channelItem: {
        flexDirection: 'row',
        backgroundColor: theme.colors.card,
        padding: 15,
        borderRadius: 10,
        marginBottom: 10,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: theme.colors.border,
        shadowColor: theme.colors.text,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    channelImage: {
        width: 60,
        height: 60,
        borderRadius: 30,
        marginRight: 15,
        borderWidth: 2,
        borderColor: theme.colors.accent,
    },
    channelInfo: {
        flex: 1,
    },
    channelTitle: {
        color: theme.colors.text,
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
    },
    channelDescription: {
        color: theme.colors.textSecondary,
        fontSize: 14,
        lineHeight: 18,
    },
    addButton: {
        backgroundColor: theme.colors.success,
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
        shadowColor: theme.colors.text,
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.1,
        shadowRadius: 2,
        elevation: 2,
    },
    addButtonDisabled: {
        backgroundColor: '#666666',
        opacity: 0.7,
    },
    addButtonText: {
        color: theme.colors.buttonText,
        fontWeight: 'bold',
        fontSize: 12,
    },
    emptyText: {
        color: theme.colors.textSecondary,
        textAlign: 'center',
        marginTop: 50,
        fontSize: 16,
        fontStyle: 'italic',
    },
});