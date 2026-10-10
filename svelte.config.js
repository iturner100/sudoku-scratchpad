import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';
export default {preprocess:vitePreprocess(),kit:{adapter:adapter(),paths:{base:process.env.GITHUB_ACTIONS && repo && !repo.endsWith('.github.io')?`/${repo}`:''},prerender:{entries:['*']}}};
