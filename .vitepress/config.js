import { defineConfig } from 'vitepress';
import sidebar from './option/sidebar.js';
import nav from './option/nav.js';

/** 搜索结果区分三套 SDK；只改索引，不改页面展示标题 */
function searchSdkLabel(relativePath = '') {
  if (relativePath.startsWith('keyboard/')) return '键盘';
  if (relativePath.startsWith('qmk/')) return 'QMK';
  if (relativePath.startsWith('mouse/')) return '鼠标';
  return '';
}

export default defineConfig({
  title: 'RDR 文档',
  description: '键盘 / QMK / 鼠标 SDK 文档',
  lang: 'zh-CN',
  base: '/keyboard-docs/',
  lastUpdated: true,
  themeConfig: {
    socialLinks: [
      { icon: 'github', link: 'https://github.com/rdmctmzt/keyboard-docs' },
    ],
    nav,
    sidebar,
    search: {
      provider: 'local',
      options: {
        async _render(src, env, md) {
          const label = searchSdkLabel(env.relativePath);
          const indexed = label
            ? src.replace(/^#\s+(.+)$/m, `# ${label} · $1`)
            : src;
          const html = md.render(indexed, env);
          if (env.frontmatter?.search === false) return '';
          return html;
        },
      },
    },
    docFooter: {
      prev: '上一页',
      next: '下一页',
    },
    lastUpdated: {
      text: '更新时间',
      formatOptions: {
        dateStyle: 'full',
        timeStyle: 'medium',
      },
    },
    outline: {
      level: [2, 3],
      label: '目录',
    },
  },
});
