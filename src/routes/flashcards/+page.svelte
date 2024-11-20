<script lang="ts">
    import { browser } from "$app/environment";

    const deckFiles = [
        'calculus-1.json'
    ];

    interface Deck {
        name: string;
        slug: string;
        cards: {
            question: string;
            answer: string;
        }[];
    }

    const decks: Promise<Deck[]> = Promise.all(
        deckFiles.map(async (file) => {
            if (!browser) {
                throw new Error('This code only runs in the browser');
            }

            const response = await fetch(`decks/${file}`);
            const data = await response.json();
            const slug = file.replace('.json', '');
            return { ...data, slug };
        })
    );

</script>

<main>
    <h1>Flashcard Decks</h1>
    {#await decks}
        <p>Loading...</p>
    {:then decks}
        {#each decks as deck}
            <ul>
                <li><a href={`flashcards/${deck.slug}`}>{deck.name}</a></li>
            </ul>
        {/each}
    {:catch error}
        <p style="color: red">{error.message}</p>
    {/await}
</main>