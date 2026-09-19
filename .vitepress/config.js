import { defineConfig } from 'vitepress';
import sidebar from './option/sidebar.js';
import sidebarEn from './option/sidebar.en.js';
import nav from './option/nav.js';
import navEn from './option/nav.en.js';

/** 搜索结果区分三套 SDK；只改索引，不改页面展示标题 */
function searchSdkLabel(relativePath = '') {
  const en = relativePath.startsWith('en/');
  const path = en ? relativePath.slice(3) : relativePath;
  if (path.startsWith('keyboard/')) return en ? 'Keyboard' : '键盘';
  if (path.startsWith('qmk/')) return 'QMK';
  if (path.startsWith('mouse/')) return en ? 'Mouse' : '鼠标';
  return '';
}

const search = {
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
};

const socialLinks = [
  { icon: 'github', link: 'https://github.com/rdmctmzt/keyboard-docs' },
];

export default defineConfig({
  base: '/keyboard-docs/',
  lastUpdated: true,
  themeConfig: {
    socialLinks,
    search,
  },
  locales: {
    root: {
      label: '简体中文',
      lang: 'zh-CN',
      title: 'RDR 文档',
      description: '键盘 / QMK / 鼠标 SDK 文档',
      themeConfig: {
        nav,
        sidebar,
        docFooter: { prev: '上一页', next: '下一页' },
        lastUpdated: {
          text: '更新时间',
          formatOptions: { dateStyle: 'full', timeStyle: 'medium' },
        },
        outline: { level: [2, 3], label: '目录' },
        darkModeSwitchLabel: '外观',
        lightModeSwitchTitle: '切换到浅色',
        darkModeSwitchTitle: '切换到深色',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        langMenuLabel: '语言',
      },
    },
    en: {
      label: 'English',
      lang: 'en-US',
      title: 'RDR Docs',
      description: 'Keyboard, QMK, and mouse SDK documentation',
      themeConfig: {
        nav: navEn,
        sidebar: sidebarEn,
        docFooter: { prev: 'Previous', next: 'Next' },
        lastUpdated: {
          text: 'Last updated',
          formatOptions: { dateStyle: 'full', timeStyle: 'medium' },
        },
        outline: { level: [2, 3], label: 'On this page' },
        darkModeSwitchLabel: 'Appearance',
        lightModeSwitchTitle: 'Switch to light mode',
        darkModeSwitchTitle: 'Switch to dark mode',
        sidebarMenuLabel: 'Menu',
        returnToTopLabel: 'Return to top',
        langMenuLabel: 'Language',
      },
    },
  },
});
