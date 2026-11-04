import type {BookmarkStore, Bookmark, Folder, FolderItem, PendingDeletion} from './models/bookmark';
import {parseBookmarksHtml} from './features/bookmark-import';
import {bookmarkStore, saveBookmarks} from './data/bookmark-storage';
import {createAddCard, createBookmarkCard, createFolderCard} from './ui/cards';
import './styles/index.css';

let pendingImport: BookmarkStore | null = null;
let pendingDeletion: PendingDeletion | null = null;

function addBookmark(name: string, url: string, folderId: string | null = null){
    const bookmark: Bookmark = {
        id: crypto.randomUUID(),
        title: name,
        url,
        position: getNextPosition(folderId),
        folderId,
        dateAdded: Date.now().toString(),
    }

    bookmarkStore.bookmarks.push(bookmark);
    saveBookmarks();

    renderBookmarkView();
}

function deleteBookmark(bookmarkId: string){
    const index = bookmarkStore.bookmarks.findIndex(
        bookmark => bookmark.id === bookmarkId
    );

    if (index === -1) return;

    bookmarkStore.bookmarks.splice(index, 1);

    saveBookmarks();
    renderBookmarkView();
}

function deleteFolder(folderId: string): void {
    const foldersToDelete = new Set<string>();

    function collectDescendants(id: string): void {
        if (foldersToDelete.has(id)) return;

        foldersToDelete.add(id);

        bookmarkStore.folders
            .filter(folder => folder.parentId === id)
            .forEach(folder => collectDescendants(folder.id));
    }

    collectDescendants(folderId);

    bookmarkStore.folders = bookmarkStore.folders.filter(
        folder => !foldersToDelete.has(folder.id)
    );

    bookmarkStore.bookmarks = bookmarkStore.bookmarks.filter(
        bookmark => bookmark.folderId === null ||
            !foldersToDelete.has(bookmark.folderId)
    );

    if (currentFolderId !== null && foldersToDelete.has(currentFolderId)) {
        currentFolderId = null;
    }

    saveBookmarks();
    renderFoldersSidebar();
    renderBookmarkView();
}


let currentFolderId: string | null = null;

function addFolder(name: string, parentId: string | null = null) {
    const folder: Folder = {
        id: crypto.randomUUID(),
        name,
        parentId,
        position: getNextPosition(parentId)
    };

    bookmarkStore.folders.push(folder);
    saveBookmarks();

    renderFoldersSidebar();
    renderBookmarkView();
}

document.getElementById('add-folder')?.addEventListener('click', () => {
    const dialog = document.getElementById('folder-dialog');

    if (dialog instanceof HTMLDialogElement) {
        dialog.showModal();
    }
});

document.getElementById('navigate-parent')?.addEventListener('click', navigateToParent);

document.getElementById('bookmark-form')?.addEventListener('submit', event => {
    event.preventDefault();

    const title = (document.getElementById('bookmark-title') as HTMLInputElement).value.trim();
    const url = (document.getElementById('bookmark-url') as HTMLInputElement).value.trim();

    if (!title || !url) return;

    addBookmark(title, url, currentFolderId);

    const dialog = document.getElementById('bookmark-dialog');

    if (dialog instanceof HTMLDialogElement) {
        dialog.close();
    }

    (event.currentTarget as HTMLFormElement).reset();
});

document.getElementById('folder-form')?.addEventListener('submit', event => {
   event.preventDefault();

   const input = document.getElementById('folder-name');

   if (!(input instanceof HTMLInputElement)) return;

   const name = input.value.trim();
   if (!name) return;

   addFolder(name, currentFolderId);

   const dialog = document.getElementById('folder-dialog');

   if (dialog instanceof HTMLDialogElement) {
       dialog.close();
   }

    (event.currentTarget as HTMLFormElement).reset();
});

document.getElementById('cancel-folder')?.addEventListener('click', () => {
    const dialog = document.getElementById('folder-dialog');

    if (dialog instanceof HTMLDialogElement) {
        dialog.close();
    }
});

document.getElementById('cancel-bookmark')?.addEventListener('click', () => {
    const dialog = document.getElementById('bookmark-dialog');

    if (dialog instanceof HTMLDialogElement) {
        dialog.close();
    }
});

document.getElementById('add-bookmark-option')?.addEventListener('click', () => {
    const addDialog = document.getElementById('add-dialog');
    const bookmarkDialog = document.getElementById('bookmark-dialog');

    if (addDialog instanceof HTMLDialogElement &&
        bookmarkDialog instanceof HTMLDialogElement) {

        addDialog.close();
        bookmarkDialog.showModal();
    }
});

document.getElementById('add-folder-option')?.addEventListener('click', () => {
    const addDialog = document.getElementById('add-dialog');
    const folderDialog = document.getElementById('folder-dialog');

    if (
        addDialog instanceof HTMLDialogElement &&
        folderDialog instanceof HTMLDialogElement
    ) {
        addDialog.close();
        folderDialog.showModal();
    }
});

document.getElementById('confirm-import')?.addEventListener('click', () => {
   if (!pendingImport) return;

   bookmarkStore.folders.splice(
       0,
       bookmarkStore.folders.length,
       ...pendingImport.folders
   );
   bookmarkStore.bookmarks.splice(
       0,
       bookmarkStore.bookmarks.length,
       ...pendingImport.bookmarks
   );
   pendingImport = null;

   saveBookmarks();

   currentFolderId = null;

   renderFoldersSidebar();
   renderBookmarkView();

   const dialog = document.getElementById('replace-import-dialog');
   if (dialog instanceof HTMLDialogElement) {
       dialog.close();
   }
});

document.getElementById('cancel-import')?.addEventListener('click', () => {
    pendingImport = null;

    const dialog = document.getElementById('replace-import-dialog');

    if (dialog instanceof HTMLDialogElement) {
        dialog.close();
    }
});

document.getElementById('replace-import-dialog')?.addEventListener('close', () => {
    pendingImport = null;
});

document.getElementById('home-button')?.addEventListener('click', () => {
    currentFolderId = null;
    renderFoldersSidebar();
    renderBookmarkView();
});

document.getElementById('confirm-delete')?.addEventListener('click', () => {
    if (!pendingDeletion) return;

    const target = pendingDeletion;
    pendingDeletion = null;

    const dialog = document.getElementById('delete-dialog');

    if (dialog instanceof HTMLDialogElement) {
        dialog.close();
    }

    if (target.kind === 'bookmark') {
        deleteBookmark(target.id);
    } else {
        deleteFolder(target.id);
    }
});

document.getElementById('cancel-delete')?.addEventListener('click', () => {
    pendingDeletion = null;

    const dialog = document.getElementById('delete-dialog');

    if (dialog instanceof HTMLDialogElement) {
        dialog.close();
    }
});

const importButton = document.getElementById('import-bookmarks');
const fileInput = document.getElementById('bookmark-file');

if (importButton && fileInput instanceof HTMLInputElement) {
    importButton.addEventListener('click', () => {
        fileInput.click();
    });

    fileInput.addEventListener('change', async () => {
        const file = fileInput.files?.[0];

        if (!file) return;

        fileInput.value = '';

        const html = await file.text();

        let importedStore: BookmarkStore;

        try {
            importedStore = parseBookmarksHtml(html);
        } catch (error) {
            console.error(error);
            return;
        }

        pendingImport = importedStore;

        const summary = document.getElementById('import-summary');
        if (summary){
            summary.textContent = `Found ${importedStore.folders.length} folders and ${importedStore.bookmarks.length} bookmarks.`;
        }

        const dialog = document.getElementById('replace-import-dialog');

        if (dialog instanceof HTMLDialogElement) {
            dialog.showModal();
        }
    });
}

function renderFoldersSidebar(){
    const folderList = document.getElementById('folder-list');
    if (!folderList) return;
    folderList.replaceChildren();

    const folders = bookmarkStore.folders
        .filter(folder => folder.parentId === null)
        .sort((a, b) => a.position - b.position);

    folders.forEach(folder => {
        const folderButton = document.createElement('button');
        folderButton.type = 'button';
        folderButton.textContent = folder.name;

        folderButton.classList.toggle(
            'active',
            folder.id === currentFolderId
        );

        folderButton.addEventListener('click', () => {
            openFolder(folder.id);
        });

        folderList.appendChild(folderButton);
    });
}

function renderBookmarkView(){
    const bookmarkView = document.getElementById('bookmark-content');
    if (!bookmarkView) return;
    bookmarkView.replaceChildren();

    const foldersToRender = bookmarkStore.folders
        .filter(folder => folder.parentId === currentFolderId)
        .sort((a, b) => a.position - b.position);

    const bookmarksToRender = bookmarkStore.bookmarks
        .filter(bookmark => bookmark.folderId === currentFolderId)
        .sort((a, b) => a.position - b.position);

    const items: FolderItem[] = [
        ...foldersToRender.map(folder => ({
            kind: "folder" as const,
            folder
        })),
        ...bookmarksToRender.map(bookmark => ({
            kind: "bookmark" as const,
            bookmark
        }))
    ];

    items.sort((a, b) => {
        const positionA = a.kind === "folder"
            ? a.folder.position
            : a.bookmark.position;

        const positionB = b.kind === "folder"
            ? b.folder.position
            : b.bookmark.position;

        return positionA - positionB;
    });

    if (items.length === 0) {
        const message = document.createElement('p');
        message.classList.add('empty-state')
        message.textContent = 'This folder is empty.';
        bookmarkView.append(message);
    }

    items.forEach(item => {
        const card = item.kind === "folder"
            ? createFolderCard(item.folder, openFolder, requestDeletion)
            : createBookmarkCard(item.bookmark, requestBookmarkDeletion);

        bookmarkView.append(card);
    });

    updateViewTitle();

    bookmarkView.append(createAddCard(openAddDialog));
}

function requestBookmarkDeletion(bookmark: Bookmark): void {
    requestDeletion({
        kind: 'bookmark',
        id: bookmark.id,
        name: bookmark.title
    });
}

function openAddDialog(): void {
    const dialog = document.getElementById('add-dialog');

    if (dialog instanceof HTMLDialogElement) {
        dialog.showModal();
    }
}

export function openFolder(folderId: string): void {
    currentFolderId = folderId;
    renderFoldersSidebar();
    renderBookmarkView();
}

function navigateToParent(): void {
    if (currentFolderId === null) return;

    const currentFolder = bookmarkStore.folders.find(
        folder => folder.id === currentFolderId
    );

    currentFolderId = currentFolder?.parentId ?? null;

    renderFoldersSidebar();
    renderBookmarkView();
}

function getNextPosition(parentId: string | null): number {
    const folderPositions = bookmarkStore.folders
        .filter(folder => folder.parentId === parentId)
        .map(folder => folder.position);

    const bookmarkPositions = bookmarkStore.bookmarks
        .filter(bookmark => bookmark.folderId === parentId)
        .map(bookmark => bookmark.position);

    return Math.max(-1, ...folderPositions, ...bookmarkPositions) + 1;
}

function updateViewTitle(): void {
    const title = document.getElementById('view-title');
    if (!title) return;

    if (currentFolderId === null) {
        title.textContent = 'Home';
        return;
    }

    const folder = bookmarkStore.folders.find(
        folder => folder.id === currentFolderId
    );

    title.textContent = folder?.name ?? 'Unknown Folder';
}

export function requestDeletion(target: PendingDeletion): void {
    pendingDeletion = target;

    const title = document.getElementById('delete-dialog-title');
    const message = document.getElementById('delete-dialog-message');

    if (title) {
        title.textContent = target.kind === 'folder'
            ? 'Delete Folder?'
            : 'Delete Bookmark?';
    }

    if (message) {
        message.textContent = target.kind === 'folder'
            ? `Are you sure you want to delete "${target.name}" and all its contents?`
            : `Are you sure you want to delete "${target.name}"?`;
    }

    const dialog = document.getElementById('delete-dialog');

    if (dialog instanceof HTMLDialogElement) {
        dialog.showModal();
    }
}

renderFoldersSidebar();
renderBookmarkView();