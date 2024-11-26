<script lang="ts">
    interface SpinnerProps {
        size: string;
        color: string;
        duration: string;
        paused?: boolean;
    }

    const {
        size = '1em',
        color = 'black',
        duration = '1s',
        paused = false
    }: SpinnerProps = $props();
</script>

<div
    class="circle-spinner"
    class:paused={paused}
    style="--size: {size}; --color: {color}; --duration: {duration};"
></div>

<style>
    .circle-spinner {
        height: var(--size);
        width: var(--size);
        
        border-color: var(--color) transparent var(--color) var(--color);
        border-width: calc(var(--size) / 15);
        border-style: solid;
        border-image: initial;
        border-radius: 50%;
        
        animation: var(--duration) linear 0s infinite normal none running rotate;
    }

    .paused {
        animation-play-state: paused;
    }

    @keyframes rotate {
        0% {
            transform: rotate(0deg);
        }
        100% {
            transform: rotate(360deg);
        }
    }
</style>