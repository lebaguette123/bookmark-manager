import type {Bookmark, Folder, PendingDeletion} from '../models/bookmark';

interface CardActions {
    onOpenFolder: (folderId: string) => void;
    onRequestDelete: (bookmark: Bookmark) => void;
    onRequestFolderDelete: (target: PendingDeletion) => void;
    onOpenAddDialog: () => void;
}

export function createFolderCard(
    folder: Folder,
    onOpenFolder: (folderId: string) => void,
    onRequestFolderDelete: CardActions['onRequestFolderDelete']
): HTMLElement {
    const card = document.createElement('article');
    card.classList.add('folder-card');

    const openButton = document.createElement('button');
    openButton.type = 'button';
    openButton.textContent = folder.name;
    openButton.classList.add('folder-open');

    openButton.addEventListener('click', () => {
        onOpenFolder(folder.id);
    });

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('card-delete');

    deleteButton.addEventListener('click', () => {
        onRequestFolderDelete({
            kind: 'folder',
            id: folder.id,
            name: folder.name
        });
    });

    card.append(openButton, deleteButton);

    return card;
}

export function createBookmarkCard(
    bookmark: Bookmark,
    onRequestDelete: CardActions['onRequestDelete']
): HTMLElement {
    const card = document.createElement('article');
    card.classList.add('bookmark-card');

    const link = document.createElement('a');
    link.href = bookmark.url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = bookmark.title;
    link.classList.add('bookmark-link');

    const deleteButton = document.createElement('button');
    deleteButton.type = 'button';
    deleteButton.textContent = 'Delete';
    deleteButton.classList.add('card-delete');
    deleteButton.addEventListener('click', () => onRequestDelete(bookmark));

    card.append(link, deleteButton);

    return card;
}

export function createAddCard(
    onOpenAddDialog: CardActions['onOpenAddDialog']
): HTMLButtonElement {
    const card = document.createElement('button');
    card.type = 'button';
    card.classList.add('add-card');
    card.textContent = '+ Add';
    card.addEventListener('click', onOpenAddDialog);

    return card;
}
