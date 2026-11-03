import type {BookmarkStore, Bookmark, Folder, FolderItem} from './lib/bookmark';
import './style.css';

const bookmarkStore: BookmarkStore = loadBookmarks();

function loadBookmarks(): BookmarkStore{
    // Simulate loading bookmarks from a data source
    return {
        folders: [],
        bookmarks: []
    };
}

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
            ? createFolderCard(item.folder)
            : createBookmarkCard(item.bookmark);

        bookmarkView.append(card);
    });

    bookmarkView.append(createAddCard());
}

function createFolderCard(folder: Folder): HTMLButtonElement{
    const card = document.createElement('button');
    card.type = 'button';
    card.textContent = folder.name;
    card.classList.add('folder-card');

    card.addEventListener('click', () => {
        openFolder(folder.id);
    });

    return card;
}

function createBookmarkCard(bookmark: Bookmark): HTMLAnchorElement {
    const card = document.createElement('a');
    card.href = bookmark.url;
    card.target = '_blank';
    card.rel = 'noopener noreferrer';
    card.textContent = bookmark.title;
    card.classList.add('bookmark-card');

    return card;
}

function createAddCard(): HTMLButtonElement{
    const card = document.createElement('button');
    card.type = 'button'
    card.classList.add('add-card');
    card.textContent = '+ Add';

    card.addEventListener('click', ()=>{
       const dialog = document.getElementById('add-dialog') as HTMLDialogElement;
       dialog.showModal();
    });

    return card;
}

function openFolder(folderId: string): void {
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

renderFoldersSidebar();
renderBookmarkView();