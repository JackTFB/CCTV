import { YouTubeVideo, CreatorData } from './youtubeService';

export interface QueueBlock {
  type: 'shorts' | 'videos' | 'vods';
  targetSize: number;
  videos: YouTubeVideo[];
}

export interface CreatorFeed {
  creatorId: string;
  creatorName: string;
  blocks: QueueBlock[];
  originalVideos: YouTubeVideo[];
  playedVideos: Set<string>;
}

class FeedService {
  private feeds: Map<string, CreatorFeed> = new Map();
  private readonly PREVIEW_SIZE = 4;
  
  // Block configuration
  private readonly BLOCK_CONFIG = {
    shorts: { targetSize: 10, fallbackType: 'videos' as const },
    videos: { targetSize: 3, fallbackType: 'videos' as const },
    vods: { targetSize: 1, fallbackType: 'videos' as const }
  };

  /**
   * Creates a single block of content with the specified type
   */
  private createBlock(
    type: 'shorts' | 'videos' | 'vods',
    targetSize: number,
    creatorData: CreatorData,
    excludedVideoIds: Set<string>
  ): QueueBlock {
    const block: QueueBlock = {
      type,
      targetSize,
      videos: []
    };

    // Get available content for this block type, excluding played videos
    let availableContent: YouTubeVideo[] = [];
    
    switch (type) {
      case 'shorts':
        availableContent = (creatorData.shorts || []).filter(v => !excludedVideoIds.has(v.id));
        break;
      case 'videos':
        availableContent = (creatorData.latestVideos || []).filter(v => !excludedVideoIds.has(v.id));
        break;
      case 'vods':
        availableContent = (creatorData.vods || []).filter(v => !excludedVideoIds.has(v.id));
        break;
    }

    console.log(`📦 Creating ${type} block: ${availableContent.length} available, target: ${targetSize}`);

    if (availableContent.length >= targetSize) {
      // Enough content of the correct type
      block.videos = availableContent.slice(0, targetSize);
    } else if (availableContent.length > 0) {
      // Some content of correct type, fill remainder with fallback
      block.videos = [...availableContent];
      const remainingNeeded = targetSize - availableContent.length;
      
      // Use videos as fallback
      const fallbackContent = (creatorData.latestVideos || [])
        .filter(v => !excludedVideoIds.has(v.id))
        .filter(v => !block.videos.some(bv => bv.id === v.id)) // Avoid duplicates
        .slice(0, remainingNeeded);
      
      block.videos.push(...fallbackContent);
      console.log(`📦 ${type} block: used ${availableContent.length} ${type}, ${fallbackContent.length} videos as fallback`);
    } else {
      // No content of correct type, use fallback entirely
      const fallbackContent = (creatorData.latestVideos || [])
        .filter(v => !excludedVideoIds.has(v.id))
        .slice(0, targetSize);
      
      block.videos = fallbackContent;
      console.log(`📦 ${type} block: no ${type} available, using ${fallbackContent.length} videos as fallback`);
    }

    return block;
  }

  /**
   * Creates all three blocks for initial queue
   */
  private createAllBlocks(creatorData: CreatorData, playedVideos: Set<string>): QueueBlock[] {
    const blocks: QueueBlock[] = [];
    const usedVideoIds = new Set<string>();

    // Block 1: Shorts
    const shortsBlock = this.createBlock('shorts', this.BLOCK_CONFIG.shorts.targetSize, creatorData, playedVideos);
    shortsBlock.videos.forEach(v => usedVideoIds.add(v.id));
    blocks.push(shortsBlock);

    // Block 2: Videos (exclude videos already used in shorts block)
    const combinedPlayedAndUsed = new Set([...playedVideos, ...usedVideoIds]);
    const videosBlock = this.createBlock('videos', this.BLOCK_CONFIG.videos.targetSize, creatorData, combinedPlayedAndUsed);
    videosBlock.videos.forEach(v => usedVideoIds.add(v.id));
    blocks.push(videosBlock);

    // Block 3: VODs (exclude videos already used)
    const finalCombinedPlayedAndUsed = new Set([...playedVideos, ...usedVideoIds]);
    const vodsBlock = this.createBlock('vods', this.BLOCK_CONFIG.vods.targetSize, creatorData, finalCombinedPlayedAndUsed);
    blocks.push(vodsBlock);

    const totalVideos = blocks.reduce((sum, block) => sum + block.videos.length, 0);
    console.log(`📦 Created all blocks: ${totalVideos} total videos across ${blocks.length} blocks`);

    return blocks;
  }

  /**
   * Regenerates a specific block when it's empty
   */
  private regenerateBlock(
    blockIndex: number,
    feed: CreatorFeed,
    creatorData: CreatorData
  ): void {
    const blockType = ['shorts', 'videos', 'vods'][blockIndex] as 'shorts' | 'videos' | 'vods';
    const targetSize = [
      this.BLOCK_CONFIG.shorts.targetSize,
      this.BLOCK_CONFIG.videos.targetSize,
      this.BLOCK_CONFIG.vods.targetSize
    ][blockIndex];

    console.log(`🔄 Regenerating ${blockType} block (index ${blockIndex}) for ${feed.creatorName}`);

    // Get videos currently in other blocks to avoid duplicates
    const videosInOtherBlocks = new Set<string>();
    feed.blocks.forEach((block, index) => {
      if (index !== blockIndex) {
        block.videos.forEach(v => videosInOtherBlocks.add(v.id));
      }
    });

    // Combine played videos with videos in other blocks
    const excludedVideoIds = new Set([...feed.playedVideos, ...videosInOtherBlocks]);

    // Create new block
    const newBlock = this.createBlock(blockType, targetSize, creatorData, excludedVideoIds);

    if (newBlock.videos.length === 0) {
      console.log(`⚠️ No content available for ${blockType} block`);
      
      // Check if we've played all available content of this type
      const allContentOfType = this.getContentByType(creatorData, blockType);
      
      if (allContentOfType.length === 0) {
        console.log(`⚠️ No ${blockType} content exists at all, block will remain empty`);
      } else {
        console.log(`🔄 All ${blockType} content has been used, checking for reset possibility`);
        
        // Only reset if this is the ONLY content type exhausted and others have content
        const hasUnplayedOtherContent = this.hasUnplayedContentInOtherTypes(creatorData, blockType, feed.playedVideos);
        
        if (hasUnplayedOtherContent) {
          console.log(`🔄 Other content types still have unplayed videos, keeping ${blockType} block empty for now`);
          // Leave block empty - don't reset played history yet
        } else {
          console.log(`🔄 All content types exhausted, resetting played history for ${blockType}`);
          // Reset played videos for this content type only
          allContentOfType.forEach(v => feed.playedVideos.delete(v.id));
          
          // Try creating block again with reset history
          const resetExcludedIds = new Set([...feed.playedVideos, ...videosInOtherBlocks]);
          newBlock.videos = this.createBlock(blockType, targetSize, creatorData, resetExcludedIds).videos;
        }
      }
    }

    // Replace the block
    feed.blocks[blockIndex] = newBlock;
    
    console.log(`✅ Regenerated ${blockType} block: ${newBlock.videos.length} videos`);
  }

  /**
   * Checks if there are unplayed videos in other content types
   */
  private hasUnplayedContentInOtherTypes(
    creatorData: CreatorData, 
    excludeType: 'shorts' | 'videos' | 'vods', 
    playedVideos: Set<string>
  ): boolean {
    const allTypes: ('shorts' | 'videos' | 'vods')[] = ['shorts', 'videos', 'vods'];
    
    for (const type of allTypes) {
      if (type !== excludeType) {
        const contentOfType = this.getContentByType(creatorData, type);
        const unplayedContent = contentOfType.filter(v => !playedVideos.has(v.id));
        if (unplayedContent.length > 0) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Gets content by type from creator data
   */
  private getContentByType(creatorData: CreatorData, type: 'shorts' | 'videos' | 'vods'): YouTubeVideo[] {
    switch (type) {
      case 'shorts':
        return creatorData.shorts || [];
      case 'videos':
        return creatorData.latestVideos || [];
      case 'vods':
        return creatorData.vods || [];
    }
  }

  /**
   * Gets all available videos from creator data
   */
  private getAllVideos(creatorData: CreatorData): YouTubeVideo[] {
    const allVideos = [
      ...(creatorData.shorts || []),
      ...(creatorData.latestVideos || []),
      ...(creatorData.vods || [])
    ];
    
    const uniqueVideos = Array.from(
      new Map(allVideos.map(video => [video.id, video])).values()
    );
    
    return uniqueVideos.sort((a, b) => 
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );
  }

  /**
   * Gets the current queue by flattening all blocks
   */
  private getCurrentQueue(feed: CreatorFeed): YouTubeVideo[] {
    const queue: YouTubeVideo[] = [];
    feed.blocks.forEach(block => {
      queue.push(...block.videos);
    });
    return queue;
  }

  /**
   * Gets or creates a feed for a creator
   */
  public getCreatorFeed(creatorData: CreatorData): CreatorFeed {
    const creatorId = creatorData.channel.id;
    
    let feed = this.feeds.get(creatorId);
    
    if (!feed) {
      console.log(`🆕 Creating new feed for ${creatorData.channel.title}`);
      
      const playedVideos = new Set<string>();
      const blocks = this.createAllBlocks(creatorData, playedVideos);
      const originalVideos = this.getAllVideos(creatorData);
      
      feed = {
        creatorId,
        creatorName: creatorData.channel.title,
        blocks,
        originalVideos,
        playedVideos
      };
      
      this.feeds.set(creatorId, feed);
      
      const totalVideos = blocks.reduce((sum, block) => sum + block.videos.length, 0);
      console.log(`🆕 New feed created: ${totalVideos} videos across ${blocks.length} blocks`);
    }
    
    return feed;
  }

  /**
   * Gets the first 4 videos for WebFeed display slots
   */
  public getQueuePreview(creatorId: string): YouTubeVideo[] {
    const feed = this.feeds.get(creatorId);
    if (!feed) return [];
    
    const currentQueue = this.getCurrentQueue(feed);
    return currentQueue.slice(0, this.PREVIEW_SIZE);
  }

  /**
   * Gets current queue length
   */
  public getQueueLength(creatorId: string): number {
    const feed = this.feeds.get(creatorId);
    if (!feed) return 0;
    
    return this.getCurrentQueue(feed).length;
  }

  /**
   * Consumes the next video and regenerates blocks as needed
   */
  public consumeNextVideo(creatorId: string): YouTubeVideo | null {
    const feed = this.feeds.get(creatorId);
    if (!feed) return null;

    // Find the first non-empty block and consume its first video
    for (let blockIndex = 0; blockIndex < feed.blocks.length; blockIndex++) {
      const block = feed.blocks[blockIndex];
      
      if (block.videos.length > 0) {
        const consumedVideo = block.videos.shift()!;
        feed.playedVideos.add(consumedVideo.id);
        
        console.log(`🎬 Consumed: ${consumedVideo.title} from ${block.type} block for ${feed.creatorName}`);
        console.log(`📊 ${block.type} block: ${block.videos.length} remaining, Total played: ${feed.playedVideos.size}`);
        
        // If this block is now empty, regenerate it
        if (block.videos.length === 0) {
          console.log(`🔄 ${block.type} block empty, regenerating...`);
          
          // Create mock creator data for regeneration
          const mockCreatorData: CreatorData = {
            channel: {
              id: feed.creatorId,
              title: feed.creatorName,
              thumbnailUrl: '',
              subscriberCount: '0',
              description: ''
            },
            shorts: feed.originalVideos.filter(v => v.videoType === 'shorts'),
            latestVideos: feed.originalVideos.filter(v => v.videoType === 'videos'),
            vods: feed.originalVideos.filter(v => v.videoType === 'vods')
          };
          
          this.regenerateBlock(blockIndex, feed, mockCreatorData);
        }
        
        return consumedVideo;
      }
    }
    
    console.log(`⚠️ No videos available in any block for ${feed.creatorName}`);
    
    // If we reach here, all blocks are empty - check if we need a full reset
    const totalUnplayedVideos = feed.originalVideos.filter(v => !feed.playedVideos.has(v.id)).length;
    
    if (totalUnplayedVideos === 0) {
      console.log(`🔄 All videos played for ${feed.creatorName}, performing full reset`);
      feed.playedVideos.clear();
      
      // Recreate all blocks
      const mockCreatorData: CreatorData = {
        channel: {
          id: feed.creatorId,
          title: feed.creatorName,
          thumbnailUrl: '',
          subscriberCount: '0',
          description: ''
        },
        shorts: feed.originalVideos.filter(v => v.videoType === 'shorts'),
        latestVideos: feed.originalVideos.filter(v => v.videoType === 'videos'),
        vods: feed.originalVideos.filter(v => v.videoType === 'vods')
      };
      
      feed.blocks = this.createAllBlocks(mockCreatorData, feed.playedVideos);
      
      // Try consuming again
      return this.consumeNextVideo(creatorId);
    }
    
    return null;
  }

  /**
   * Updates feed with fresh creator data
   */
  public updateCreatorFeed(creatorData: CreatorData): void {
    const feed = this.feeds.get(creatorData.channel.id);
    if (feed) {
      const newOriginalVideos = this.getAllVideos(creatorData);
      const existingVideoIds = new Set(feed.originalVideos.map(v => v.id));
      const newVideos = newOriginalVideos.filter(v => !existingVideoIds.has(v.id));
      
      if (newVideos.length > 0) {
        console.log(`🆕 Found ${newVideos.length} new videos for ${feed.creatorName}`);
        feed.originalVideos = newOriginalVideos;
        
        // Check if any blocks need regeneration with new content
        const currentQueueLength = this.getCurrentQueue(feed).length;
        if (currentQueueLength <= 2) {
          console.log(`🔄 Queue low, regenerating empty blocks with new content`);
          
          // Regenerate any empty blocks
          feed.blocks.forEach((block, index) => {
            if (block.videos.length === 0) {
              this.regenerateBlock(index, feed, creatorData);
            }
          });
        }
      } else {
        feed.originalVideos = newOriginalVideos;
      }
      
      console.log(`🔄 Updated original videos for ${feed.creatorName}: ${feed.originalVideos.length} total`);
    }
  }

  /**
   * Forces regeneration of all blocks
   */
  public forceRefreshQueue(creatorId: string): void {
    const feed = this.feeds.get(creatorId);
    if (feed) {
      const mockCreatorData: CreatorData = {
        channel: {
          id: feed.creatorId,
          title: feed.creatorName,
          thumbnailUrl: '',
          subscriberCount: '0',
          description: ''
        },
        shorts: feed.originalVideos.filter(v => v.videoType === 'shorts'),
        latestVideos: feed.originalVideos.filter(v => v.videoType === 'videos'),
        vods: feed.originalVideos.filter(v => v.videoType === 'vods')
      };
      
      // Regenerate all blocks
      for (let i = 0; i < feed.blocks.length; i++) {
        this.regenerateBlock(i, feed, mockCreatorData);
      }
    }
  }

  /**
   * Resets played videos history for a creator
   */
  public resetPlayedHistory(creatorId: string): void {
    const feed = this.feeds.get(creatorId);
    if (feed) {
      feed.playedVideos.clear();
      console.log(`🧹 Reset played history for ${feed.creatorName}`);
      this.forceRefreshQueue(creatorId);
    }
  }

  /**
   * Gets feed statistics for debugging
   */
  public getFeedStats(creatorId: string): any {
    const feed = this.feeds.get(creatorId);
    if (!feed) return null;

    const currentQueue = this.getCurrentQueue(feed);
    
    return {
      creatorName: feed.creatorName,
      totalQueueLength: currentQueue.length,
      totalVideosAvailable: feed.originalVideos.length,
      playedVideosCount: feed.playedVideos.size,
      blocks: feed.blocks.map((block, index) => ({
        index,
        type: block.type,
        targetSize: block.targetSize,
        currentSize: block.videos.length,
        videos: block.videos.slice(0, 2).map(v => ({ title: v.title, type: v.videoType }))
      })),
      nextVideos: currentQueue.slice(0, 4).map(v => ({
        title: v.title,
        type: v.videoType
      })),
      playedVideoIds: Array.from(feed.playedVideos)
    };
  }

  /**
   * Clears all feeds
   */
  public clearAllFeeds(): void {
    this.feeds.clear();
    console.log('🧹 Cleared all feeds');
  }

  /**
   * Removes a specific creator's feed
   */
  public removeCreatorFeed(creatorId: string): void {
    this.feeds.delete(creatorId);
    console.log(`🗑️ Removed feed for creator: ${creatorId}`);
  }
}

// Export singleton instance
export const feedService = new FeedService();