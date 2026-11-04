export interface Bookmark {
    id: string;
    title: string;
    url: string;
    folderId: string | null;
    dateAdded: string;
    position: number;
}

export interface Folder {
    id: string;
    name: string;
    parentId: string | null;
    position: number;
}

export interface BookmarkStore {
    folders: Folder[];
    bookmarks: Bookmark[];
}

export type FolderItem =
    | { kind: "folder"; folder: Folder }
    | { kind: "bookmark"; bookmark: Bookmark };

export type PendingDeletion =
    | { kind: 'bookmark'; id: string; name: string }
    | { kind: 'folder'; id: string; name: string };


