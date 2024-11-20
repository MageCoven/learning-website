import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

interface Card {
    question: string;
    answer: string;
}

interface Deck {
    name: string;
    cards: Card[];
}

export const load: PageLoad = async ({ params, fetch }) => {
    if (!params.deckname) {
        error(404, 'Deck not found');
    }

    const deckname = params.deckname;
    const response = await fetch(`/decks/${deckname}.json`);
    const deck: Deck = await response.json();

    if (typeof deck !== 'object') {
        error(404, 'Deck not found');
    }

    if (!deck.name || typeof deck.name !== 'string') {
        error(500, 'Invalid deck name');
    }

    if (!deck.cards || !Array.isArray(deck.cards)) {
        error(500, 'Invalid deck');
    }

    return {
        deck: {
            ...deck,
            slug: deckname
        }
    };
};
