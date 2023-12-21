import createRouter from 'router5'
import browserPlugin from 'router5-plugin-browser'

const routes = [
  { name: 'home', path: '/' },
  { name: 'video', path: '/video/:id' },
]

const router = createRouter(routes, {
  defaultRoute: 'home'
})

router.usePlugin(browserPlugin({
    // useHash: true
}))

console.log('start router');
router.start();

export default router;