import type {BookmarkStore} from '../models/bookmark';

const STORAGE_KEY = 'bookmark-store';

export function loadBookmarks(): BookmarkStore {
    const json = localStorage.getItem(STORAGE_KEY);

    if (!json) {
        return {folders: [], bookmarks: []};
    }

    return JSON.parse(json) as BookmarkStore;
}

export const bookmarkStore: BookmarkStore = loadBookmarks();

export function saveBookmarks(): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bookmarkStore));
}
