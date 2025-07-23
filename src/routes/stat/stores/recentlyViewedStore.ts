import { writable } from 'svelte/store';
import type { RecentlyViewedItem } from '../types';

function createRecentlyViewedStore() {
    const { subscribe, set, update } = writable<RecentlyViewedItem[]>([]);

    return {
        subscribe,
        addItem: (newItem: RecentlyViewedItem) => {
            update(items => {
                const updatedItems = [
                    newItem,
                    ...items.filter(item => item.discipline !== newItem.discipline)
                ].slice(0, 5);
                
                localStorage.setItem('recentlyViewed', JSON.stringify(updatedItems));
                return updatedItems;
            });
        },
        loadFromStorage: () => {
            const stored = localStorage.getItem('recentlyViewed');
            if (stored) {
                set(JSON.parse(stored));
            }
        }
    };
}

export const recentlyViewedStore = createRecentlyViewedStore(); 