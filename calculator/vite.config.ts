import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import path from 'path'

export default defineConfig({
    plugins: [svelte()],
    resolve: {
        alias: {
            '@tabletop/indonesia': path.resolve('../tabletop/games/indonesia/src/index.ts'),
            '@tabletop/common': path.resolve('../tabletop/libs/common/src/index.ts')
        }
    }
})
