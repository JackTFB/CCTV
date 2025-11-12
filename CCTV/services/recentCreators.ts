let recentlyClickedCreators: string[] = [];

export function addRecentlyClickedCreator(creatorId: string): void {
    recentlyClickedCreators = recentlyClickedCreators.filter(id => id !== creatorId);
    recentlyClickedCreators.unshift(creatorId);
    if (recentlyClickedCreators.length > 5) {
        recentlyClickedCreators = recentlyClickedCreators.slice(0, 5);
    }
}

export function getRecentlyClickedCreators(): string[] {
    return [...recentlyClickedCreators];
}

export function clearRecentlyClickedCreators(): void {
    recentlyClickedCreators = [];
}