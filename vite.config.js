import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        caseStudy:  resolve(__dirname, 'case-study.html'),
        caseStudy0: resolve(__dirname, 'case-study0.html'),
        caseStudy1: resolve(__dirname, 'case-study1.html'),
        caseStudy2: resolve(__dirname, 'case-study2.html'),
        caseStudy3: resolve(__dirname, 'case-study3.html'),
      }
    }
  }
})
