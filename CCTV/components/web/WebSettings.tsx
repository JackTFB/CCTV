import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, Switch } from 'react-native';
import { clearAllData } from '../../services/database';
import { feedService } from '../../services/feedService';
import { useTheme } from '../../context/ThemeContext';

export default function WebSettings() {
  const [showClearModal, setShowClearModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const { theme, isDark, toggleTheme } = useTheme();

  const handleClearDatabase = () => {
    setShowClearModal(true);
  };

  const confirmClearDatabase = async () => {
    setIsClearing(true);
    setShowClearModal(false);
    
    try {
      // Clear the database using the existing clearAllData function
      await clearAllData();
      
      // Clear all feeds
      feedService.clearAllFeeds();
      
      console.log('✅ Database and feeds cleared successfully');
      Alert.alert(
        'Success',
        'Database has been cleared successfully. All creators and their feeds have been removed.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('❌ Error clearing database:', error);
      Alert.alert(
        'Error',
        'Failed to clear database. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsClearing(false);
    }
  };

  const cancelClearDatabase = () => {
    setShowClearModal(false);
  };

  const styles = createStyles(theme);

  return (
    <View style={styles.container}>
      {/* Confirmation Modal */}
      <Modal
        visible={showClearModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelClearDatabase}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>⚠️ Clear Database</Text>
            <Text style={styles.modalMessage}>
              This will permanently delete ALL creators and their feeds from your database. 
              {'\n\n'}
              This action cannot be undone. Are you sure you want to continue?
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={cancelClearDatabase}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.clearButton]}
                onPress={confirmClearDatabase}
              >
                <Text style={styles.clearButtonText}>Clear Database</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.banner}>
        <Text style={styles.bannerText}>Settings</Text>
      </View>

      <View style={styles.content}>
        {/* Theme Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Appearance</Text>
          <Text style={styles.sectionDescription}>
            Customize the app's appearance and theme
          </Text>
          
          <View style={styles.themeToggleContainer}>
            <View style={styles.themeToggleInfo}>
              <Text style={styles.themeToggleTitle}>
                {isDark ? '🌙 Dark Mode' : '☀️ Light Mode'}
              </Text>
              <Text style={styles.themeToggleDescription}>
                {isDark ? 'Switch to light theme' : 'Switch to dark theme'}
              </Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: '#767577', true: '#007AFF' }}
              thumbColor={isDark ? '#ffffff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Database Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Database Management</Text>
          <Text style={styles.sectionDescription}>
            Manage your local database and stored data
          </Text>
          
          <TouchableOpacity
            style={[
              styles.clearDatabaseButton,
              isClearing && styles.clearDatabaseButtonDisabled
            ]}
            onPress={handleClearDatabase}
            disabled={isClearing}
          >
            <Text style={styles.clearDatabaseButtonText}>
              {isClearing ? 'Clearing Database...' : '🗑️ Clear Database'}
            </Text>
          </TouchableOpacity>
          
          <Text style={styles.warningText}>
            ⚠️ This will remove all creators and their feed data permanently
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About CCTV</Text>
          <Text style={styles.aboutText}>
            Content Creator Television (CCTV) helps you organize and watch your favorite YouTube creators' content in a TV-like experience.
          </Text>
        </View>
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
    height: 80,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  bannerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  section: {
    marginBottom: 30,
    padding: 20,
    backgroundColor: theme.colors.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  themeToggleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  themeToggleInfo: {
    flex: 1,
  },
  themeToggleTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  themeToggleDescription: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  clearDatabaseButton: {
    backgroundColor: theme.colors.error,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  clearDatabaseButtonDisabled: {
    backgroundColor: '#666666',
    opacity: 0.7,
  },
  clearDatabaseButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningText: {
    fontSize: 12,
    color: theme.colors.warning,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  aboutText: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.colors.modalOverlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: theme.colors.card,
    borderRadius: 15,
    padding: 25,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    textAlign: 'center',
    marginBottom: 15,
  },
  modalMessage: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: 25,
    lineHeight: 22,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 15,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#6c757d',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clearButton: {
    backgroundColor: theme.colors.error,
  },
  clearButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});