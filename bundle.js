import * as esbuild from 'esbuild';

let result = await esbuild.build({
  entryPoints: ['src/main.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'es2022',
  treeShaking: true,
  // external: ['path', 'fs', 'util', 'assert', 'url', 'child_process', 'events'],
  outfile: 'dist/goomv.mjs',
});
