import js from '@eslint/js'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended, prettier,

  {
    languageOptions: {
      globals: {
        window: "writable",
        document: "readonly",
        console: "readonly",
        requestAnimationFrame: "readonly",
      }
    }
  }
]

