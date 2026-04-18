#!/usr/bin/env node
// start.js — compile and run a TypeScript example.  Mirrors node-with-gjs-examples.

import { spawnSync } from 'node:child_process';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const target = process.argv[2];
if (!target) {
    console.error('Usage: node start.js src/<example>.ts');
    process.exit(2);
}

function run(cmd, args, opts = {}) {
    const r = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32', ...opts });
    if (r.status !== 0) process.exit(r.status ?? 1);
}

const absTarget = path.resolve(target);
// Emit alongside the project so Node's module resolution finds ./node_modules.
const outDir = path.join(__dirname, 'dist');
fs.mkdirSync(outDir, { recursive: true });

const tsconfig = {
    compilerOptions: {
        target: 'ES2022',
        module: 'ESNext',
        moduleResolution: 'bundler',
        outDir,
        rootDir: path.dirname(absTarget),
        esModuleInterop: true,
        skipLibCheck: true,
        allowSyntheticDefaultImports: true,
    },
    include: [absTarget],
};
const tsconfigPath = path.join(outDir, 'tsconfig.gen.json');
fs.writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

run('npx', ['tsc', '-p', tsconfigPath], { cwd: __dirname });

const outFile = path.join(outDir, path.basename(absTarget).replace(/\.ts$/, '.js'));
// Write a package.json so .js files in dist/ are treated as ES modules.
fs.writeFileSync(path.join(outDir, 'package.json'), JSON.stringify({ type: 'module' }));
// Expose the source directory so examples that load sibling assets (HTML,
// images, etc.) can resolve them robustly, regardless of cwd at launch.
run(process.execPath, [outFile], {
    env: { ...process.env, NWJXA_EXAMPLE_SRC_DIR: path.dirname(absTarget) },
});
