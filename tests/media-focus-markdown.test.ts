import assert from 'node:assert/strict';
import test from 'node:test';
import { createSatteriMarkdownProcessor } from '@astrojs/markdown-satteri';
import { mediaFocusMarkdown } from '../src/lib/media-focus-markdown.ts';

test('marks originals before the real Markdown image compiler and retains public/image links', async () => {
  const renderer = await createSatteriMarkdownProcessor({ hastPlugins: [mediaFocusMarkdown(new URL('../', import.meta.url))] });
  const result = await renderer.render('[![Photo](../../assets/uploads/news/197.jpg)](/team/)\n\n![Public](/assets/logo.png)\n\n![External](https://example.org/a.jpg)', {
    fileURL: new URL('../src/content/blog/test.md', import.meta.url),
  });
  assert.match(result.code, /website\/src\/assets\/uploads\/news\/197.jpg/);
  assert.match(result.code, /data-original-image="website\/public\/assets\/logo.png"/);
  assert.match(result.code, /href="\/team\/"/);
  assert.match(result.code, /src="https:\/\/example.org\/a.jpg"/);
  assert.doesNotMatch(result.code, /data-focal-x/);
});
