import type {Bookmark, BookmarkStore, Folder} from '../models/bookmark';

export function parseBookmarksHtml(html: string): BookmarkStore {
    const parsedDocument = new DOMParser().parseFromString(html, 'text/html');
    const rootList = parsedDocument.querySelector('dl');

    if (!(rootList instanceof HTMLDListElement)) {
        throw new Error('Could not find the root bookmark list.');
    }

    const importedStore: BookmarkStore = {
        folders: [],
        bookmarks: []
    };

    processBookmarkList(rootList, null, importedStore);

    return importedStore;
}

function processBookmarkList(
    list: HTMLDListElement,
    parentFolderId: string | null,
    targetStore: BookmarkStore
): void {
    let position = 0;

    for (const entry of Array.from(list.children)) {
        if (entry.tagName !== 'DT') continue;

        const heading = entry.querySelector(':scope > h3');

        if (heading) {
            const nestedList = entry.querySelector(':scope > dl');
            const folder: Folder = {
                id: crypto.randomUUID(),
                name: heading.textContent?.trim() || 'Untitled folder',
                parentId: parentFolderId,
                position: position++
            };

            targetStore.folders.push(folder);

            if (nestedList instanceof HTMLDListElement) {
                processBookmarkList(nestedList, folder.id, targetStore);
            }

            continue;
        }

        const link = entry.querySelector(':scope > a');
        const href = link?.getAttribute('href')?.trim();

        if (!link || !href) continue;

        const dateTimestamp = Number(link.getAttribute('add_date'));
        const dateAdded = Number.isFinite(dateTimestamp) && dateTimestamp > 0
            ? new Date(dateTimestamp * 1000).toISOString()
            : new Date().toISOString();

        const bookmark: Bookmark = {
            id: crypto.randomUUID(),
            title: link.textContent?.trim() || href,
            url: href,
            folderId: parentFolderId,
            position: position++,
            dateAdded
        };

        targetStore.bookmarks.push(bookmark);
    }
}
