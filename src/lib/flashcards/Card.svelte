<script lang="ts">
    import { marked } from 'marked';
    import markedKatex from 'marked-katex-extension';

    marked.use(markedKatex({ throwOnError: true }));

    let {
        question,
        answer,
        onclose,
        onnext
    }: {
        question: string;
        answer: string;
        onclose?: () => void;
        onnext?: () => void;
    } = $props();

    let cardElement: HTMLDivElement;

    if (question === undefined) {
        throw new Error('question is required');
    }

    if (answer === undefined) {
        throw new Error('answer is required');
    }

    if (onclose === undefined) {
        onclose = () => {
            // Add class hidden to cardElement if it is not already there
            if (cardElement == undefined) {
                return;
            }

            if (!cardElement.classList.contains('hidden')) {
                cardElement.classList.add('hidden');
            }
        };
    }

    let side: 'question' | 'answer' = $state('question');

    function markdownToHtml(markdown: string): string {
        const result = marked.parse(markdown);
        if (typeof result === 'string') {
            return result;
        }

        console.error(`Unexpected result from marked, expected string. Will print to console when promise is resolved.`);
        result.then(console.log).catch(console.error);
        return 'Error: Could not parse markdown, see console for details';
    }

    function changeSide(newSide: 'question' | 'answer') {
        side = newSide;
    }
</script>

<div class="card" bind:this={cardElement}>
    <button id="close" onclick={() => onclose()}>X</button>
    {#if side === 'question'}
        <div>
            {@html markdownToHtml(question)}
            <div class="buttons">
                <button onclick={() => changeSide('answer')}>
                    Show Answer
                </button>
            </div>
        </div>
    {:else}
        <div>
            {@html markdownToHtml(answer)}
            <div class="button">
                <button onclick={() => changeSide('question')}>
                    Show Question
                </button>
                {#if onnext}
                    <button onclick={() => onnext()}>
                        Next
                    </button>
                {/if}
            </div>
        </div>
    {/if}
</div>

<style>
    :global(.katex-html) {
        display: none;
    }

    .card {
        position: relative;
        background: white;
        padding: 1rem;
        border-radius: 0.5rem;
    }

    #close {
        position: absolute;
        top: 0;
        right: 0;

        background: none;
        border: 1em solid rgba(0, 0, 0, 0);
        outline: none;
        border-radius: 100%;

        margin: 1em;
    }

    .buttons {
        display: flex;
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