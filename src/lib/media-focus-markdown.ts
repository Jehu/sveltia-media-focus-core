import { fileURLToPath } from 'node:url';
import { relative } from 'node:path';
import type { SatteriProcessorOptions } from '@astrojs/markdown-satteri';
import { resolveOriginalImagePath } from './asset-path.ts';

/** Only identity is compiled: focus is resolved per page, even with cached MDX. */
export function mediaFocusMarkdown(
  websiteRoot: URL,
): NonNullable<SatteriProcessorOptions['hastPlugins']>[number] {
  return {
    name: 'media-focus-originals',
    element: {
      filter: ['img'],
      visit(node, context) {
        const src = node.properties?.src;
        if (typeof src !== 'string' || /^(?:[a-z][a-z\d+.-]*:|\/\/|#)/i.test(src)) return;
        if (!context.fileURL) throw new Error('Bildfokus: Markdown-Quelldatei fehlt.');
        const sourceFile =
          'website/' +
          relative(fileURLToPath(websiteRoot), fileURLToPath(context.fileURL))
            .split('\\')
            .join('/');
        context.setProperty(node, 'data-original-image', resolveOriginalImagePath(src, sourceFile));
      },
    },
  };
}
