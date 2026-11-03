import type {BookmarkStore, Bookmark, Folder} from './lib/bookmark';
import './style.css';

const bookmarkStore: BookmarkStore = loadBookmarks();

function loadBookmarks(): BookmarkStore{
    // Simulate loading bookmarks from a data source
    return {
        folders: [],
        bookmarks: []
    };
}

function addBookmark(bookmark: Bookmark){
    // Simulate adding a bookmark
    bookmarkStore.bookmarks.push(bookmark);
}

let currentFolderId: string | null = null;

function addFolder(name: string) {
    const siblings = bookmarkStore.folders.filter(
        folder => folder.parentId === null
    );

    const position = siblings.reduce(
        (highest, folder) => Math.max(highest, folder.position),
        -1
    ) + 1;

    const folder: Folder = {
        id: crypto.randomUUID(),
        name,
        parentId: null,
        position
    };

    bookmarkStore.folders.push(folder);
    renderFoldersSidebar();
}

document.getElementById('add-folder')?.addEventListener('click', () => {
    const name = window.prompt('Enter folder name:');

    if (name?.trim()) {
        addFolder(name.trim());
    }
});

function renderFoldersSidebar(){
    const folderList = document.getElementById('folder-list');
    if (!folderList) return;
    folderList.replaceChildren();

    const folders = bookmarkStore.folders
        .filter(folder => folder.parentId === null)
        .sort((a, b) => a.position - b.position);

    bookmarkStore.folders.forEach(folder => {
        const folderButton = document.createElement('button');
        folderButton.type = 'button';
        folderButton.textContent = folder.name;

        folderButton.classList.toggle(
            'active',
            folder.id === currentFolderId
        );

        folderButton.addEventListener('click', () => {
            currentFolderId = folder.id;
            renderFoldersSidebar();
            //renderBookmarkView();
        });

        folderList.appendChild(folderButton);
    });
}