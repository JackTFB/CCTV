// @ts-ignore

export interface YouTubeVideo {
    id: string;
    title: string;
    thumbnailUrl: string;
    videoType: string;
}

export interface YouTubeChannel {
    id: string;
    title: string;
    thumbnailUrl: string;
}

export const searchForChannels = async (accessToken: string, query: string, apiKey: string): Promise<YouTubeChannel[]> => {
    if (!query.trim()) {
        return[];
    }

    const API_URL = 'https://www.googleapis.com/youtube/v3/search';
    const params = new URLSearchParams({
        part: 'snippet',
        q: query,
        type: 'channel',
        maxResults: '5',
        key: apiKey,
    });

    const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearder ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (data.error) {
        console.error('YouTube API Search Error:', data.error.message);
        throw new Error(data.error.message);
    }

    const channels: YouTubeChannel[] = data.items
        .filter((item: any) => item.snippet)
        .map((item: any) => ({
            id: item.snippet.channelId,
            title: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails.high.url,
        }));

    return channels;
};

export const fetchYouTubeVideos = async (accessToken: string, playlist: string): Promise<YouTubeVideo[]> => {




    const API_URL = 'https://www.googleapis.com/youtube/v3/playlistItems';

    const params = new URLSearchParams({
        part: 'snippet',
        playlistId: playlist,
        maxResults: '10',
    });

    const response = await fetch(`${API_URL}?${params.toString()}`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });

    const data = await response.json();

    if (data.error) {
        console.error('YouTube API Error:', data.error.message);
        throw new Error(data.error.message);
    }

    const fetchedVideos: YouTubeVideo[] = data.items
        .filter((item: any) => item.snippet?.resourceId?.videoId)
        .map((item: any) => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            thumbnailUrl: item.snippet.thumbnails.high.url,
        }));

    return fetchedVideos;
};