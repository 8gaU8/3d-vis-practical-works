import js from '@eslint/js'
import airbnbBase from 'eslint-config-airbnb-base'
import prettier from 'eslint-config-prettier'

export default [
  js.configs.recommended, // デフォルトの ESLint 推奨ルール
  airbnbBase, // Airbnb の JavaScript ルール
  prettier, // Prettier と競合するルールを無効化
  {
    ignores: ['node_modules', 'dist'], // 除外フォルダ
    rules: {
      'no-console': 'off', // console.log を警告
      'import/prefer-default-export': 'off', // デフォルトエクスポートの強制を無効化
      'import/no-unresolved': 'off',
      'import/extensions': 'off',
    },
  },
]
