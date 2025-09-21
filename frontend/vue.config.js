const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  publicPath: process.env.NODE_ENV === 'production' ? '/' : '/',
  pwa: {
    name: 'PWA App',
    shortName: 'PWA',
    themeColor: '#4DBA87',
    backgroundColor: '#ffffff',
    msTileColor: '#000000',
    appleMobileWebAppCapable: 'yes',
    appleMobileWebAppStatusBarStyle: 'black',
    workboxPluginMode: 'InjectManifest',
    workboxOptions: {
      swSrc: './src/service-worker.js',
    },
    iconPaths: {
      favicon32: null,
      favicon16: null,
      appleTouchIcon: null,
      maskIcon: null,
      msTileImage: null
    },
    manifestOptions: {
      background_color: '#ffffff',
      display: 'standalone',
      scope: '/',
      start_url: '/',
      orientation: 'portrait-primary',
      icons: []
    }
  },
  devServer: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true
      }
    }
  }
})
