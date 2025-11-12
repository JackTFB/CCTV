export interface Creator {
    id: string;
    name: string;
    subscriberCount?: number;
    thumbnailUrl: string; // CHANGED: was profileImageURL
    addedAt?: string; // ADDED: missing field
}

export interface Video {
    id: string;
    title: string;
    thumbnailUrl: string;
    creatorId: string;
    channelId: string;
    channelTitle: string; // ADDED: missing semicolon
    description: string;
    publishedAt: string;
    videoType?: 'videos' | 'shorts' | 'vods';
}