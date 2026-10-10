import process from 'node:process';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] || '';

const isDeploying = process.env.GITHUB_ACTIONS && repo && !repo.endsWith('.github.io');

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			adapter: adapter({
				fallback: '404.html'
			}),
			paths: {
				base: isDeploying ? `/${repo}` : ''
			},
			prerender:
			{
				entries: ['*']
			}
		})
	]
});
