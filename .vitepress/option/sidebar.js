export default {
  '/keyboard/': [
    {
      text: '键盘 SDK',
      items: [
        { text: '开始', link: '/keyboard/' },
        {
          text: 'API',
          link: '/keyboard/api/info',
          items: [
            { text: '基础的设备信息', link: '/keyboard/api/info' },
            { text: '功能区', link: '/keyboard/api/func' },
            { text: '布局/改键', link: '/keyboard/api/key' },
            { text: '灯光', link: '/keyboard/api/lighting' },
            { text: '点阵屏', link: '/keyboard/api/matrix' },
            { text: 'LCD', link: '/keyboard/api/lcd' },
            { text: '编码器', link: '/keyboard/api/encoder' },
            { text: '性能', link: '/keyboard/api/performance' },
            { text: '宏', link: '/keyboard/api/macro' },
            { text: '在线升级', link: '/keyboard/api/upgrade' },
            { text: '其它 API', link: '/keyboard/api/misc' },
            { text: '命令说明', link: '/keyboard/api/commands' },
          ],
        },
        { text: '键值表', link: '/keyboard/keycodes' },
        { text: '参数类型', link: '/keyboard/types' },
      ],
    },
  ],
  '/qmk/': [
    {
      text: 'QMK SDK',
      items: [
        { text: '开始', link: '/qmk/' },
        {
          text: 'API',
          link: '/qmk/api/info',
          items: [
            { text: '基础的设备信息', link: '/qmk/api/info' },
            { text: '布局/改键', link: '/qmk/api/key' },
            { text: '灯光', link: '/qmk/api/lighting' },
            { text: '宏', link: '/qmk/api/macro' },
            { text: '编码器', link: '/qmk/api/encoder' },
            { text: '其它 API', link: '/qmk/api/misc' },
            { text: '命令说明', link: '/qmk/api/commands' },
          ],
        },
        { text: '键值表', link: '/qmk/keycodes' },
        { text: '参数类型', link: '/qmk/types' },
      ],
    },
  ],
  '/mouse/': [
    {
      text: '鼠标 SDK',
      items: [
        { text: '开始', link: '/mouse/' },
        {
          text: 'API',
          link: '/mouse/api/info',
          items: [
            { text: '基础的设备信息', link: '/mouse/api/info' },
            { text: '全局设置', link: '/mouse/api/globalSetting' },
            { text: '性能 / DPI', link: '/mouse/api/performance' },
            { text: '按键映射', link: '/mouse/api/keyRemapping' },
            { text: '宏', link: '/mouse/api/macro' },
            { text: '在线升级', link: '/mouse/api/upgrade' },
            { text: '命令说明', link: '/mouse/api/commands' },
          ],
        },
        { text: '键值表', link: '/mouse/keycodes' },
        { text: '参数类型', link: '/mouse/types' },
      ],
    },
  ],
};
