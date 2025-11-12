// @ts-ignore
// eslint-disable-next-line import/no-unresolved
import { YOUTUBE_API_KEY, YOUTUBE_BASE_URL } from "@env";

const YOUTUBE_API_KEY = 'AIzaSyB9re5DOg4S4bOBsGJV1ZsXj-zlWcSXFOs';
const YOUTUBE_BASE_URL = 'https://www.googleapis.com/youtube/v3';

export interface YouTubeVideo {
    id: string;
    title: string;
    thumbnailUrl: string;
    publishedAt: string;
    channelId: string;
    channelTitle: string;
    description: string;
    videoType?: 'videos' | 'shorts' | 'vods';
}

export interface YouTubeChannel {
    id: string;
    title: string;
    thumbnailUrl: string;
    subscriberCount?: string;
    description: string;
    customUrl?: string;
}

export interface CreatorData {
    channel: YouTubeChannel;
    latestVideos: YouTubeVideo[];
    shorts: YouTubeVideo[];
    vods: YouTubeVideo[];
}

// FIXED: All functions use consistent signatures without OAuth
export async function searchForChannels(query: string): Promise<YouTubeChannel[]> {
    const url = `${YOUTUBE_BASE_URL}/search?part=snippet&q=${encodeURIComponent(query)}&type=channel&maxResults=10&key=${YOUTUBE_API_KEY}`;
    
    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API error:', response.status, errorText);
        throw new Error(`Failed to search channels: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
        console.warn('No search results found:', data);
        return [];
    }

    return data.items.map((item: any) => ({
        id: item.id.channelId,
        title: item.snippet.title,
        // Use higher resolution thumbnails
        thumbnailUrl: item.snippet.thumbnails?.medium?.url || 
                     item.snippet.thumbnails?.default?.url || '',
        description: item.snippet.description || '',
        customUrl: item.snippet.customUrl,
    }));
}

export async function getChannelDetails(channelId: string): Promise<YouTubeChannel> {
    const url = `${YOUTUBE_BASE_URL}/channels?part=snippet,statistics&id=${channelId}&key=${YOUTUBE_API_KEY}`;

    console.log('Getting channel details from:', url); // Debug log

    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API error:', response.status, errorText);
        throw new Error(`Failed to get channel details: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
        throw new Error('Channel not found');
    }

    const channel = data.items[0];

    return {
        id: channel.id,
        title: channel.snippet.title,
        // Use higher resolution thumbnails
        thumbnailUrl: channel.snippet.thumbnails?.medium?.url || 
                     channel.snippet.thumbnails?.default?.url || '',
        subscriberCount: channel.statistics?.subscriberCount,
        description: channel.snippet.description || '',
        customUrl: channel.snippet.customUrl,
    };
}

export async function fetchYouTubeVideos(playlistId: string, maxResults = 50): Promise<YouTubeVideo[]> {
    const url = `${YOUTUBE_BASE_URL}/playlistItems?part=snippet&playlistId=${playlistId}&maxResults=${maxResults}&key=${YOUTUBE_API_KEY}`;
    
    console.log('Fetching videos from:', url); // Debug log

    const response = await fetch(url);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('YouTube API error:', response.status, errorText);
        throw new Error(`Failed to fetch videos: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
        console.warn('No video items found:', data);
        return [];
    }

    return data.items.map((item: any) => ({
        id: item.snippet.resourceId.videoId,
        title: item.snippet.title,
        // Use higher resolution thumbnails - maxresdefault first, then medium, then default
        thumbnailUrl: item.snippet.thumbnails?.maxresdefault?.url || 
                     item.snippet.thumbnails?.medium?.url || 
                     item.snippet.thumbnails?.default?.url || '',
        publishedAt: item.snippet.publishedAt,
        channelId: item.snippet.channelId,
        channelTitle: item.snippet.channelTitle,
        description: item.snippet.description || '',
    }));
}

export async function getCreatorData(channelId: string): Promise<CreatorData> {
    try {
        console.log('Getting creator data for channel:', channelId);
        
        const channel = await getChannelDetails(channelId);

        const [latestVideos, shorts, vods] = await Promise.allSettled([
            fetchYouTubeVideos(channelId.replace(/^UC/, 'UULF'), 10),
            fetchYouTubeVideos(channelId.replace(/^UC/, 'UUSH'), 10),
            fetchYouTubeVideos(channelId.replace(/^UC/, 'UULV'), 10)
        ]);

        return {
            channel,
            latestVideos: (latestVideos.status === 'fulfilled' ? latestVideos.value : [])
                .map(v => ({ ...v, videoType: 'videos' as const })),
            shorts: (shorts.status === 'fulfilled' ? shorts.value : [])
                .map(v => ({ ...v, videoType: 'shorts' as const })),
            vods: (vods.status === 'fulfilled' ? vods.value : [])
                .map(v => ({ ...v, videoType: 'vods' as const }))
        };
    } catch (error) {
        console.error('Error getting creator data:', error);
        throw error;
    }
}

export async function getMultipleCreatorsData(channelIds: string[]): Promise<CreatorData[]> {
    console.log('🌐 getMultipleCreatorsData called with:', channelIds.length, 'channels'); // DEBUG
    console.log('🌐 Channel IDs:', channelIds); // DEBUG
    
    const promises = channelIds.map(channelId =>
        getCreatorData(channelId).catch(error => {
            console.error(`❌ Failed to get data for channel ${channelId}:`, error);
            return null;
        })
    );

    const results = await Promise.all(promises);
    const validResults = results.filter((result): result is CreatorData => result !== null);
    
    console.log(`🌐 Successfully loaded ${validResults.length} out of ${channelIds.length} creators`); // DEBUG
    console.log('🌐 Valid results:', validResults.map(r => r.channel.title)); // DEBUG
    
    return validResults;
}