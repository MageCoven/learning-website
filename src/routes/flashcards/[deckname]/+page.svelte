<script lang="ts">
    import type{ PageData } from './$types';
    import { marked } from 'marked';
    import markedKatex from 'marked-katex-extension';

    marked.use(markedKatex({ throwOnError: true }));

    interface Card {
        question: string;
        answer: string;
    }

    const { data }: { data: PageData } = $props();

    let showCards = $state(false);
    function toggleShowCards() {
        showCards = !showCards;
    }

    let isPlaying = $state(false);
    let side: 'question' | 'answer' = $state('question');
    let cardIndex = 0;
    const playCards = data.deck.cards.map(card => ({ ...card }));

    function play() {
        isPlaying = true;
        cardIndex = 0;
        showSide('question');
        playCards.sort(() => Math.random() - 0.5);
    }

    function nextCard(): null | Card {
        if (!isPlaying) {
            return null;
        }

        cardIndex++;
        if (cardIndex >= playCards.length) {
            isPlaying = false;
            return null;
        }
        
        const card = playCards[cardIndex];
        return card;
    }

    function showSide(newSide: 'question' | 'answer') {
        side = newSide;
    }

    function currentCard(): Card {
        return playCards[cardIndex];
    }

    function cardToHtml(card: Card, side: 'question' | 'answer'): string {
        const string = side === 'question' ? card.question : card.answer;
        const result = marked.parse(string);
        if (typeof result === 'string') {
            return result;
        }
        
        result.then(console.log).catch(console.error);
        throw new Error('Unexpected result from marked, expected string. Will print to console when promise is resolved.');
    }
</script>

<main>
    <h1>{data.deck.name}</h1>

    <button onclick={() => toggleShowCards()}>
        {showCards ? 'Hide Cards' : 'Show Cards'} cards
    </button>

    <button onclick={() => play()}>
        Play
    </button>

    {#if isPlaying}
        <div class="overlay">
            <div class="card">
                <button id="close-play-button" onclick={() => isPlaying = false}>X</button>
                {#if side === 'question'}
                    <div>{@html cardToHtml(currentCard(), 'question')}</div>
                    <div class="buttons">
                        <button id="show-answer-button" onclick={() => showSide('answer')}>Show Answer</button>
                    </div>
                {:else}
                    <div>{@html cardToHtml(currentCard(), 'answer')}</div>
                    <div class="buttons">
                        <button id="show-question-button" onclick={() => showSide('question')}>Show Question</button>
                        <button id="next-card-button" onclick={() => nextCard()}>Next</button>
                    </div>
                {/if}
            </div>
        </div>
    {:else if showCards}
        <ul>
            {#each data.deck.cards as card}
                <li>
                    <div>{@html cardToHtml(card, "question")}</div>
                    <div>{@html cardToHtml(card, "answer")}</div>
                </li>
            {/each}
        </ul>
    {/if}
</main>

<style>
    :global(.katex-html) {
        display: none;
    }

    .overlay {
        background: rgba(0, 0, 0, 0.5);
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
    }

    .card {
        position: absolute;
        background: white;
        left: 25%;
        width: 50%;
        margin: 10% auto;
        padding: 1rem;
        border-radius: 0.5rem;
    }

    #close-play-button {
        position: absolute;
        top: 0;
        right: 0;

        background: none;
        border: 1em solid rgba(0, 0, 0, 0);
        outline: none;

        margin: 1em;

        border-radius: 100%;
    }

    #close-play-button:hover {
        cursor: pointer;
        background: grey;
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