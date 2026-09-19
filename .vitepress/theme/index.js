import DefaultTheme from 'vitepress/theme'
import './custom.css'

export default {
  extends: DefaultTheme,
  enhanceApp({ router }) {
    if (typeof window === 'undefined') return

    let fromSidebar = false
    let navSeq = 0

    document.addEventListener(
      'pointerdown',
      (e) => {
        fromSidebar = !!(
          e.target instanceof Element && e.target.closest('.VPSidebar a')
        )
      },
      true,
    )

    /**
     * 仅侧栏连点时合并导航：旧 go() 返回 false 取消，Promise 必定 resolve，不会挂死。
     */
    const prevBefore = router.onBeforeRouteChange
    router.onBeforeRouteChange = async (to) => {
      const sidebarNav = fromSidebar
      fromSidebar = false
      const seq = ++navSeq

      if (typeof prevBefore === 'function') {
        const ok = await prevBefore(to)
        if (ok === false) return false
      }

      if (!sidebarNav) return true

      await new Promise((r) => setTimeout(r, 50))
      return seq === navSeq
    }

    const prevAfter = router.onAfterRouteChange
    router.onAfterRouteChange = async (to) => {
      document.querySelectorAll('vite-error-overlay').forEach((el) => el.remove())

      if (document.body.style.overflow === 'hidden') {
        const overlay =
          document.querySelector('.VPSidebar.open') ||
          document.querySelector('#VPNavScreen') ||
          document.querySelector('.VPLocalSearchBox')
        if (!overlay) {
          document.body.style.removeProperty('overflow')
          document.body.style.removeProperty('padding-right')
          document.body.style.removeProperty('width')
        }
      }

      if (typeof prevAfter === 'function') await prevAfter(to)
    }
  },
}
