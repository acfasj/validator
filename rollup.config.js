import typescriptPlugin from 'rollup-plugin-typescript'

export default {
  input: 'src/index.ts',
  plugins: [
    typescriptPlugin({
      typescript: require('typescript')
    })
  ],
  output: [
    {
      file: 'dist/validator.js',
      format: 'umd',
      name: 'Validator'
    },
    {
      file: 'dist/validator.esm.js',
      format: 'es'
    }
  ]
}
