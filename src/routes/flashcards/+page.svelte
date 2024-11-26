<script lang="ts">
    import Spinner from "$lib/Spinner.svelte";
    import { marked } from 'marked';
    import markedKatex from 'marked-katex-extension';

    marked.use(markedKatex({ throwOnError: true }));

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

    interface DeckReference {
        name: string;
        url: string;
        languageCode: LanguageCode;
        numberOfCards: number;
    }

    interface DeckListData {
        groups: {
            [id: string]: DeckGroup;
        };
    }

    interface Deck {
        name: string;
        languageCode: LanguageCode;
        numberOfCards: number;
        cards: Card[];
    }

    interface DeckWithSides extends Deck {
        cardSides: ('question' | 'answer')[];
    }

    interface PlayContext {
        cards: Card[];
        index: number;
        side: 'question' | 'answer';
        nextCard: () => void;
        getCard: () => Card;
    }

    const languageCode: LanguageCode = 'sv';

    const deckListData: Promise<DeckListData> = new Promise((resolve, reject) => {
        fetch("/decks.json")
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }

                return response.json();
            })
            .then(data => {
                resolve(data);
            })
            .catch(error => {
                reject(error);
            });
    });

    let selectedDeckReference: DeckReference | null = $state(null);
    let playContext: PlayContext | null = $state(null);
    
    function flipSide(side: 'question' | 'answer'): 'question' | 'answer' {
        console.log(`From: ${side} To: ${side === 'question' ? 'answer' : 'question'}`);
        return side === 'question' ? 'answer' : 'question';
    }

    const deckCache: Map<string, Deck> = new Map();
    function loadDeck(reference: DeckReference): Promise<Deck> {
        if (deckCache.has(reference.url)) {
            return Promise.resolve(deckCache.get(reference.url)!);
        }
        
        return fetch(reference.url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error ${response.status}`);
                    }

                    return response.json();
                });
    }

    function addSidesToDeck(deck: Deck): DeckWithSides {
        return {
            ...deck,
            cardSides: deck.cards.map(() => 'question')
        }
    }

    function getGroups(deckListData: DeckListData, languageCode: LanguageCode): DeckGroup[] {
        return Object.values(deckListData.groups).map(group => {
            return {
                name: group.name,
                decks: group.decks.filter(deck => deck.languageCode === languageCode)
            };
        });
    }

    function markdownToHtml(markdown: string): string {
        const result = marked.parse(markdown);
        if (typeof result === 'string') {
            return result;
        }

        result.then(console.log).catch(console.error);
        throw new Error('Unexpected result from marked, expected string. Will print to console when promise is resolved.');
    }

    function forcePlayContext(): PlayContext {
        if (playContext == null) {
            throw new Error('playContext is null');
        }

        return playContext;
    }

    async function createPlayContext(): Promise<void> {
        if (selectedDeckReference == null) {
            throw new Error('selectedDeckReference is null');
        }

        const deck = await loadDeck(selectedDeckReference);

        playContext = {
            cards: deck.cards.map(card => ({...card})).sort(() => Math.random() - 0.5),
            index: 0,
            side: 'question',
            nextCard: () => {
                if (playContext == null) {
                    throw new Error('playContext is null');
                }

                playContext.side = 'question';

                playContext.index++;
                if (playContext.index >= playContext.cards.length) {
                    playContext = null;
                }
            },
            getCard: () => {
                if (playContext == null) {
                    throw new Error('playContext is null');
                }

                return playContext.cards[playContext.index];
            }
        };
    }

</script>
<div>
    <h1>Decks</h1>
    <div id="deck-list">
        {#await deckListData}
            <Spinner size="2em" color="black" duration="1s" />
        {:then deckListData}
            {#each getGroups(deckListData, languageCode) as group}
                <div class="deck-group">
                    <h2>{group.name[languageCode]}</h2>
                    <div class="deck-overview-list">
                        {#each group.decks as deck}
                            <div class="deck-overview" onclick={() => selectedDeckReference = deck} aria-hidden="true">
                                <div class="deck-name">
                                    {deck.name}
                                </div>
                                <div class="deck-number-of-cards">
                                    {deck.numberOfCards}
                                </div>
                            </div>
                        {/each}
                    </div>
                </div>
            {:else}
                <p>No decks found</p>
            {/each}
        {:catch error}
            <p>Error: {error.message}</p>
        {/await}
    </div>
    {#if selectedDeckReference != null}
        <div class="overlay">
            {#if playContext != null}
                <div id="play-view">
                    <div class="top-right">
                        <button class="close" onclick={() => playContext = null}>X</button>
                    </div>
                    {#if playContext.side === 'question'}
                        <div class="text">{@html markdownToHtml(playContext.getCard().question)}</div>
                        <div class="buttons">
                            <button onclick={() => forcePlayContext().side = 'answer'}>Show Answer</button>
                        </div>
                    {:else}
                        <div class="text">{@html markdownToHtml(playContext.getCard().answer)}</div>
                        <div class="buttons">
                            <button onclick={() => forcePlayContext().side = 'question'}>Show Question</button>
                            <button onclick={() => forcePlayContext().nextCard()}>Next</button>
                        </div>
                    {/if}
                </div>
            {:else}
                <div id="selected-deck-view">
                    {#await loadDeck(selectedDeckReference).then(addSidesToDeck)}
                        <Spinner size="2em" color="black" duration="1s" />
                    {:then selectedDeck}
                        <div class="top-right">
                            <button class="play" onclick={() => createPlayContext()}>Play</button>
                            <button class="close" onclick={() => {selectedDeckReference = null}}>X</button>
                        </div>
                        <h2>{selectedDeck.name}</h2>
                        <div class="card-list">
                            {#each selectedDeck.cards as card, index}
                                <div class="card" onclick={() => selectedDeck.cardSides[index] = flipSide(selectedDeck.cardSides[index])} aria-hidden="true">
                                    {#if selectedDeck.cardSides[index] === 'question'}
                                        <div>{@html markdownToHtml(card.question)}</div>
                                    {:else}
                                        <div>{@html markdownToHtml(card.answer)}</div>
                                    {/if}
                                </div>
                            {/each}
                        </div>
                    {/await}
                </div>
            {/if}
        </div>
    {/if}
</div>

<style>
    :global(.katex-html) {
        display: none;
    }

    .deck-group {
        margin-bottom: 1em;
    }

    .deck-group > h2 {
        margin-bottom: 0.5em;
        border-bottom: 1px solid black;
    }

    .deck-overview-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 1em;
    }

    .deck-overview {
        border: 1px solid black;
        border-radius: 0.5em;
        padding: 1em;

        background: white;
    }

    .deck-overview:hover {
        background: #f0f0f0;
        cursor: pointer;
    }

    .deck-overview > .deck-name {
        font-weight: bold;
    }

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;

        background: rgba(0, 0, 0, 0.5);
    }

    #selected-deck-view {
        position: absolute;
        top: 10%;
        left: 10%;
        right: 10%;
        bottom: 10%;

        background: white;
        border-radius: 0.5em;
        padding: 1em;
    }

    .top-right {
        position: absolute;
        top: 0;
        right: 0;

        display: flex;
    }

    .top-right > .close {
        background: none;
        border: 1em solid transparent;
        border-radius: 100%;
        outline: none;

        margin: 1em;
    }

    .top-right > .close:hover {
        cursor: pointer;
        background: grey;
    }

    .top-right > .play {
        background: none;
        border: 1em solid rgba(0, 0, 0, 0);
        outline: none;

        margin: 1em;

        border-bottom: 1px solid black;
    }

    .top-right > .play:hover {
        cursor: pointer;
        background: grey;
    }

    #play-view {
        position: absolute;
        background: white;
        left: 25%;
        width: 50%;
        height: 50%;
        margin: 10% auto;
        padding: 1rem;
        border-radius: 0.5rem;

        display: flex;
        flex-direction: column;
    }

    #play-view > .text {
        flex-grow: 1;
    }

    .buttons {
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .buttons > button {
        background: none;
        border: none;
        border-bottom: 1px solid black;
        margin: 0.5rem 1rem;
        padding: 0.5rem;
        cursor: pointer;
    }
</style>