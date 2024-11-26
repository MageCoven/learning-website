import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

type LanguageCode = 'en' | 'sv';

interface DeckOverview {
    name: string;
    url: string;
    languageCode: LanguageCode;
    numberOfCards: number;
}

interface DeckGroup {
    name: {
        [key in LanguageCode]: string;
    };
    decks: DeckOverview[];
}

interface DeckFile {
    groups: { [id: string]: DeckGroup };
}

interface Card {
    question: string;
    answer: string;
}

interface Deck {
    name: string;
    group: string;
    languageCode: LanguageCode;
    cards: Card[];
}

const deckFilePath = 'static/decks.json';
const deckFolderPath = 'static/decks';

function generateDeckFile() {
    console.log('Generating deck file...');

    let deckFile: DeckFile;
    try {
        const deckFileContent = fs.readFileSync(deckFilePath, 'utf8');
        deckFile = JSON.parse(deckFileContent);
    } catch {
        deckFile = {
            groups: {}
        };
    }

    if (!deckFile.groups) {
        deckFile.groups = {};
    }

    Object.entries(deckFile.groups).forEach(([, group]) => {
        group.decks = [];
        if (!group.name) {
            throw new Error('Group is missing a name');
        }

        if (!group.name.en) {
            throw new Error('Group is missing an english name');
        }

        if (!group.name.sv) {
            throw new Error('Group is missing a swedish name');
        }

        console.log(`Reading group: ${group.name.en}`);
    });

    console.log(`Reading decks from: ${deckFolderPath}`);
    const deckFiles = fs.readdirSync(deckFolderPath).map((fileName: string) => {
        return {
            fileName,
            path: path.join(deckFolderPath, fileName)
        };
    });

    deckFiles.forEach(({ fileName, path }) => {
        const deckContent = fs.readFileSync(path, 'utf8');
        const deck: Deck = JSON.parse(deckContent);

        // Make sure the deck has the right structure
        if (!deck.name) {
            throw new Error(`${fileName} is missing a name`);
        }

        if (!deck.group) {
            throw new Error(`${fileName} is missing a group`);
        }

        if (!deck.languageCode) {
            throw new Error(`${fileName} is missing languageCode`);
        }

        if (!deck.cards) {
            throw new Error(`${fileName} is missing cards`);
        }

        deck.cards.forEach((card, index) => {
            if (!card.question) {
                throw new Error(`Card ${index} is missing a question for deck ${fileName}`);
            }

            if (!card.answer) {
                throw new Error(`Card ${index} is missing an answer for deck ${fileName}`);
            }
        });

        const deckOverview: DeckOverview = {
            name: deck.name,
            url: `/decks/${fileName}`,
            languageCode: deck.languageCode,
            numberOfCards: deck.cards.length
        };

        const group = deckFile.groups[deck.group];
        if (!group) {
            throw new Error(`Group ${deck.group} not found`);
        }

        group.decks.push(deckOverview);
        console.log(`- Added deck: ${deck.name}`);
    });

    fs.writeFileSync(deckFilePath, JSON.stringify(deckFile, null, 4), 'utf8');
    console.log('Deck file generated!');
}

export default defineConfig({
    plugins: [
        sveltekit(),
        {
            name: 'generate-deck-file',
            buildStart() {
                generateDeckFile();
            },
            handleHotUpdate({ file, server }) {
                if (file.startsWith(deckFolderPath) && file.endsWith('.json')) {
                    generateDeckFile();

                    server.ws.send({
                        type: 'full-reload'
                    });
                }
            }
        }
    ]
});
