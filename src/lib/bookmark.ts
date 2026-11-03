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
export interface BookmarkStore{
    folders: Folder[];
    bookmarks: Bookmark[];
}

export type FolderItem =
    | { kind: "folder"; folder: Folder }
    | { kind: "bookmark"; bookmark: Bookmark };