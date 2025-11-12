import * as SQLite from 'expo-sqlite';
import type { Creator, Video } from './database.types';

export type { Creator, Video } from './database.types';

const db = SQLite.openDatabaseSync('cctv.db');

export const initDatabase = async (): Promise<void> => {
    try {
        await db.withTransactionAsync(async () => {
            await db.execAsync(
                `CREATE TABLE IF NOT EXISTS creators (
                    id TEXT PRIMARY KEY NOT NULL,
                    name TEXT NOT NULL,
                    thumbnailUrl TEXT NOT NULL,
                    addedAt TEXT,
                    subscriberCount INTEGER DEFAULT 0
                 );`
            );

            await db.execAsync(
                `CREATE TABLE IF NOT EXISTS videos (
                    id TEXT PRIMARY KEY NOT NULL,
                    title TEXT NOT NULL,
                    thumbnailUrl TEXT NOT NULL,
                    publishedAt TEXT NOT NULL,
                    channelId TEXT NOT NULL,
                    channelTitle TEXT NOT NULL,
                    description TEXT,
                    creatorId TEXT NOT NULL,
                    videoType TEXT,
                    FOREIGN KEY (creatorId) REFERENCES creators (id) ON DELETE CASCADE
                 );`
            );

            // Add subscriberCount column if it doesn't exist
            try {
                await db.execAsync('ALTER TABLE creators ADD COLUMN subscriberCount INTEGER DEFAULT 0;');
            } catch (error) {
                // Ignore error, column already exists
            }
        });
        console.log("SQLite Database initialized successfully.");
    } catch (error) {
        console.error("Error initializing SQLite database:", error);
        throw error;
    }
};

export const getCreators = async (): Promise<Creator[]> => {
    try {
        const result = await db.getAllAsync<Creator>('SELECT * FROM creators ORDER BY addedAt DESC;');
        return result || [];
    } catch (error) {
        console.error("Error getting creators:", error);
        return [];
    }
};

export const addCreator = async (creator: Creator): Promise<void> => {
    try {
        const existingCreator = await db.getFirstAsync<Creator>(
            'SELECT * FROM creators WHERE id = ?;',
            creator.id
        );
        
        if (existingCreator) {
            throw new Error(`${creator.name} is already in your list`);
        }

        const creatorWithTimestamp = {
            ...creator,
            addedAt: creator.addedAt || new Date().toISOString(),
        };

        await db.runAsync(
            `INSERT INTO creators (id, name, subscriberCount, thumbnailUrl, addedAt) VALUES (?, ?, ?, ?, ?);`,
            creatorWithTimestamp.id,
            creatorWithTimestamp.name,
            creatorWithTimestamp.subscriberCount || 0,
            creatorWithTimestamp.thumbnailUrl,
            creatorWithTimestamp.addedAt
        );
        
        console.log(`Successfully added creator: ${creator.name}`);
    } catch (error) {
        console.error("Error adding creator:", error);
        throw error;
    }
};

export const updateCreatorSubscriberCount = async (id: string, subscriberCount: number): Promise<void> => {
    try {
        await db.runAsync(
            `UPDATE creators SET subscriberCount = ? WHERE id = ?;`,
            subscriberCount,
            id
        );
        console.log(`Updated subscriber count for creator ${id}: ${subscriberCount}`);
    } catch (error) {
        console.error("Error updating creator subscriber count:", error);
        throw error;
    }
};

export const removeCreator = async (creatorId: string): Promise<void> => {
    try {
        console.log(`Starting removal of creator: ${creatorId}`);
        
        // Check if creator exists first
        const existingCreator = await db.getFirstAsync<Creator>(
            'SELECT * FROM creators WHERE id = ?;',
            creatorId
        );
        
        if (!existingCreator) {
            throw new Error('Creator not found');
        }
        
        console.log(`Found creator to remove: ${existingCreator.name}`);
        
        await db.withTransactionAsync(async () => {
            // Remove associated videos first (due to foreign key constraint)
            await db.runAsync('DELETE FROM videos WHERE creatorId = ?;', creatorId);
            
            // Then remove the creator
            const result = await db.runAsync('DELETE FROM creators WHERE id = ?;', creatorId);
            
            if (result.changes === 0) {
                throw new Error('Creator not found');
            }
        });
        
        console.log(`Successfully removed creator with ID: ${creatorId}`);
    } catch (error) {
        console.error("Error removing creator:", error);
        throw error;
    }
};

export const getVideos = async (): Promise<Video[]> => {
    try {
        const result = await db.getAllAsync<Video>(
            'SELECT * FROM videos ORDER BY publishedAt DESC;'
        );
        return result || [];
    } catch (error) {
        console.error("Error getting videos:", error);
        return [];
    }
};

export const addVideos = async (videos: Video[]): Promise<void> => {
    if (!videos || videos.length === 0) return;

    try {
        await db.withTransactionAsync(async () => {
            for (const video of videos) {
                const existing = await db.getFirstAsync<Video>(
                    'SELECT id FROM videos WHERE id = ?;',
                    video.id
                );
                
                if (!existing) {
                    await db.runAsync(
                        `INSERT INTO videos (
                            id, title, thumbnailUrl, publishedAt, 
                            channelId, channelTitle, description, creatorId, videoType
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
                        video.id,
                        video.title,
                        video.thumbnailUrl,
                        video.publishedAt,
                        video.channelId,
                        video.channelTitle,
                        video.description || '',
                        video.creatorId,
                        video.videoType || 'videos'
                    );
                }
            }
        });
        
        console.log(`Successfully processed ${videos.length} videos`);
    } catch (error) {
        console.error("Error adding videos:", error);
        throw error;
    }
};

export const getVideosByCreatorId = async (creatorId: string): Promise<Video[]> => {
    try {
        const result = await db.getAllAsync<Video>(
            'SELECT * FROM videos WHERE creatorId = ? ORDER BY publishedAt DESC;',
            creatorId
        );
        return result || [];
    } catch (error) {
        console.error("Error getting videos by creator:", error);
        return [];
    }
};

export const clearAllData = async (): Promise<void> => {
    try {
        await db.withTransactionAsync(async () => {
            await db.execAsync('DELETE FROM videos;');
            await db.execAsync('DELETE FROM creators;');
        });
        console.log("Successfully cleared all data");
    } catch (error) {
        console.error("Error clearing data:", error);
        throw error;
    }
};

export const getCreatorById = async (creatorId: string): Promise<Creator | null> => {
    try {
        const creator = await db.getFirstAsync<Creator>(
            'SELECT * FROM creators WHERE id = ?;',
            creatorId
        );
        return creator || null;
    } catch (error) {
        console.error("Error getting creator by ID:", error);
        return null;
    }
};

export const getVideoCount = async (): Promise<number> => {
    try {
        const result = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM videos;'
        );
        return result?.count || 0;
    } catch (error) {
        console.error("Error getting video count:", error);
        return 0;
    }
};

export const getCreatorCount = async (): Promise<number> => {
    try {
        const result = await db.getFirstAsync<{ count: number }>(
            'SELECT COUNT(*) as count FROM creators;'
        );
        return result?.count || 0;
    } catch (error) {
        console.error("Error getting creator count:", error);
        return 0;
    }
};