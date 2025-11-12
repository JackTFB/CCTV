import type { Creator, Video } from './database.types'

export type { Creator, Video } from './database.types'

const DB_NAME = 'cctv_db';
const DB_VERSION = 3; // UPDATED: Increment version for schema changes
const CREATORS_STORE = 'creators';
const VIDEOS_STORE = 'videos';

class IndexedDBService {
    private db: IDBDatabase | null = null;

    async openDB(): Promise<IDBDatabase> {
        if (this.db) return this.db;

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;

                // Create creators store
                if (!db.objectStoreNames.contains(CREATORS_STORE)) {
                    const creatorsStore = db.createObjectStore(CREATORS_STORE, { keyPath: 'id' });
                    creatorsStore.createIndex('name', 'name', { unique: false });
                    creatorsStore.createIndex('addedAt', 'addedAt', { unique: false }); // ADDED
                }

                // Create videos store
                if (!db.objectStoreNames.contains(VIDEOS_STORE)) {
                    const videosStore = db.createObjectStore(VIDEOS_STORE, { keyPath: 'id' });
                    videosStore.createIndex('creatorId', 'creatorId', { unique: false });
                    videosStore.createIndex('publishedAt', 'publishedAt', { unique: false });
                }
            };
        });
    }

    async getAll<T>(storeName: string): Promise<T[]> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async add<T>(storeName: string, item: T): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(item);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async delete(storeName: string, id: string): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onerror = () => {
                console.error(`Delete request failed for ${storeName}:${id}:`, request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                console.log(`Successfully deleted ${id} from ${storeName}`); // DEBUG
                resolve();
            };

            // ADDED: Transaction error handling
            transaction.onerror = () => {
                console.error(`Transaction failed for deleting ${id} from ${storeName}:`, transaction.error);
                reject(transaction.error);
            };
        });
    }

    async getByIndex<T>(storeName: string, indexName: string, value: any): Promise<T[]> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const index = store.index(indexName);
            const request = index.getAll(value);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve(request.result);
        });
    }

    async clear(storeName: string): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async addMultiple<T>(storeName: string, items: T[]): Promise<void> {
        const db = await this.openDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);

            let completed = 0;
            const total = items.length;

            if (total === 0) {
                resolve();
                return;
            }

            const handleComplete = () => {
                completed++;
                if (completed === total) {
                    resolve();
                }
            };

            items.forEach(item => {
                const request = store.put(item);
                request.onerror = () => reject(request.error);
                request.onsuccess = handleComplete;
            });
        });
    }
};

const dbService = new IndexedDBService();

export const initDatabase = async (): Promise<void> => {
    try {
        await dbService.openDB();
        console.log("IndexedDB initialized successfully.");
    } catch (error) {
        console.error("Error initializing IndexedDB:", error);
        throw error;
    }
};

export const getCreators = async (): Promise<Creator[]> => {
    try {
        const creators = await dbService.getAll<Creator>(CREATORS_STORE);
        // Sort by addedAt descending (newest first)
        return creators.sort((a, b) => {
            const aTime = a.addedAt ? new Date(a.addedAt).getTime() : 0;
            const bTime = b.addedAt ? new Date(b.addedAt).getTime() : 0;
            return bTime - aTime;
        });
    } catch (error) {
        console.error("Error getting creators:", error);
        return [];
    }
};

export const addCreator = async (creator: Creator): Promise<void> => {
    try {
        const existingCreators = await getCreators();
        
        if (existingCreators.some(c => c.id === creator.id)) {
            throw new Error(`${creator.name} is already in your list`);
        }
        
        const creatorWithTimestamp = {
            ...creator,
            addedAt: creator.addedAt || new Date().toISOString(),
        };
        
        await dbService.add(CREATORS_STORE, creatorWithTimestamp);
        console.log(`Successfully added creator: ${creator.name}`);
    } catch (error) {
        console.error("Error adding creator:", error);
        throw error;
    }
};

export const updateCreatorSubscriberCount = async (id: string, subscriberCount: number): Promise<void> => {
    try {
        const creator = await getCreatorById(id);
        if (!creator) {
            throw new Error('Creator not found');
        }
        
        const updatedCreator = {
            ...creator,
            subscriberCount
        };
        
        await dbService.add(CREATORS_STORE, updatedCreator);
        console.log(`Updated subscriber count for creator ${id}: ${subscriberCount}`);
    } catch (error) {
        console.error("Error updating creator subscriber count:", error);
        throw error;
    }
}

export const removeCreator = async (creatorId: string): Promise<void> => {
    console.log(`Starting removal of creator: ${creatorId}`); // DEBUG
    
    try {
        // First, check if the creator exists
        const existingCreator = await getCreatorById(creatorId);
        if (!existingCreator) {
            console.warn(`Creator with ID ${creatorId} not found in database`);
            throw new Error('Creator not found');
        }
        
        console.log(`Found creator to remove: ${existingCreator.name}`); // DEBUG
        
        // Remove the creator first
        await dbService.delete(CREATORS_STORE, creatorId);
        console.log(`Successfully deleted creator from ${CREATORS_STORE}`); // DEBUG

        // Then remove all associated videos
        const videos = await dbService.getByIndex<Video>(VIDEOS_STORE, 'creatorId', creatorId);
        console.log(`Found ${videos.length} videos to remove for creator ${creatorId}`); // DEBUG
        
        for (const video of videos) {
            await dbService.delete(VIDEOS_STORE, video.id);
            console.log(`Deleted video: ${video.title}`); // DEBUG
        }
        
        console.log(`Successfully removed creator with ID: ${creatorId} and ${videos.length} videos`);
    } catch (error) {
        console.error("Error removing creator:", error);
        console.error("Creator ID that failed:", creatorId); // DEBUG
        throw error;
    }
};

export const getVideos = async (): Promise<Video[]> => {
    try {
        const videos = await dbService.getAll<Video>(VIDEOS_STORE);
        return videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } catch (error) {
        console.error("Error getting videos:", error);
        return [];
    }
};

export const addVideos = async (videos: Video[]): Promise<void> => {
    try {
        // Filter out duplicates before adding
        const existingVideos = await dbService.getAll<Video>(VIDEOS_STORE);
        const existingIds = new Set(existingVideos.map(v => v.id));
        const newVideos = videos.filter(v => !existingIds.has(v.id));
        
        if (newVideos.length > 0) {
            await dbService.addMultiple(VIDEOS_STORE, newVideos);
            console.log(`Successfully processed ${newVideos.length} new videos`);
        }
    } catch (error) {
        console.error("Error adding videos:", error);
        throw error;
    }
};

export const getVideosByCreatorId = async (creatorId: string): Promise<Video[]> => {
    try {
        const videos = await dbService.getByIndex<Video>(VIDEOS_STORE, 'creatorId', creatorId);
        return videos.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    } catch (error) {
        console.error("Error getting videos by creator:", error);
        return [];
    }
};

export const clearAllData = async (): Promise<void> => {
    try {
        await dbService.clear(VIDEOS_STORE);
        await dbService.clear(CREATORS_STORE);
        console.log("Successfully cleared all data");
    } catch (error) {
        console.error("Error clearing data:", error);
        throw error;
    }
};

// Additional utility functions to match native implementation
export const getCreatorById = async (creatorId: string): Promise<Creator | null> => {
    try {
        const creators = await dbService.getAll<Creator>(CREATORS_STORE);
        return creators.find(c => c.id === creatorId) || null;
    } catch (error) {
        console.error("Error getting creator by ID:", error);
        return null;
    }
};

export const getVideoCount = async (): Promise<number> => {
    try {
        const videos = await dbService.getAll<Video>(VIDEOS_STORE);
        return videos.length;
    } catch (error) {
        console.error("Error getting video count:", error);
        return 0;
    }
};

export const getCreatorCount = async (): Promise<number> => {
    try {
        const creators = await dbService.getAll<Creator>(CREATORS_STORE);
        return creators.length;
    } catch (error) {
        console.error("Error getting creator count:", error);
        return 0;
    }
};