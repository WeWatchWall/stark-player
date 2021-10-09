const vuePlugin = require('esbuild-vue');
require('browser-env-vars').generate({ esm: true });

require('esbuild').build({
  entryPoints: ['src/index.ts'],
  format: 'esm',
  bundle: true,
  minify: false,
  sourcemap: true,
  outfile: 'dist/index.js',
  write: true,
  plugins: [
    vuePlugin()
  ],
  define: {
    "process.env.NODE_ENV": JSON.stringify("development"),
    "global": "window"
  }
});