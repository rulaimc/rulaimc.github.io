import { defaultTheme } from '@vuepress/theme-default'
import { defineUserConfig } from 'vuepress'
import { webpackBundler } from '@vuepress/bundler-webpack'

export default defineUserConfig({
  lang: 'zh-CN',

  title: '我梦笔记',
  description: '欢迎来到我梦的笔记文档空间',

theme: defaultTheme({
  logo: 'https://vuejs.press/images/hero.png',

  navbar: ['/'],

  sidebar: {
    '/guide/': [
      '/guide/MySQL.md',
      '/guide/Java.md',
      '/guide/Jvm.md',
      '/guide/Spring.md',
      '/guide/SpringBoot.md',
      '/guide/Redis.md',
      '/guide/数据结构.md',
      '/guide/设计模式.md',
      '/guide/Linux.md',
      '/guide/Nginx.md',
      '/guide/vue.md',
      '/guide/Emby.md',
    ],
  },

  //侧边栏目录展开深度
  sidebarDepth: 0,

}),

  bundler: webpackBundler(),
})
