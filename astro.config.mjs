import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';

const isGitHubPages = process.env.GITHUB_PAGES === '1';
const repoBase = process.env.GITHUB_PAGES_BASE || '/familia-wittmann';

export default defineConfig({
  site: isGitHubPages ? 'https://wittmannf.github.io' : 'https://familiawittmann.com.br',
  base: isGitHubPages ? repoBase : '/',
  output: 'static',
  adapter: cloudflare({
    imageService: 'compile'
  }),
  markdown: {
    shikiConfig: { theme: 'github-light' }
  }
});
