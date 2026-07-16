import adapter from '@sveltejs/adapter-netlify';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		prerender: {
			// The dataset is scraped; a single row with a malformed href must
			// log a warning, not fail a 30k-page deploy.
			handleHttpError: 'warn'
		}
	}
};

export default config;
