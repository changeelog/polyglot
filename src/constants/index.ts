import { Config } from '../interfaces';
import { PerformanceStep } from '../types';

export const DEFAULT_CONFIG: Config = {
  packageManagers: {
    bun: { lockFile: 'bun.lockb', command: 'bun' },
    pnpm: { 
      lockFile: 'pnpm-lock.yaml', 
      command: 'pnpm',
      cacheCleanCommand: 'store prune',
      resolutionCommand: 'install --lockfile-only'
    },
    npm: { 
      lockFile: 'package-lock.json', 
      command: 'npm',
      cacheCleanCommand: 'cache clean --force',
      resolutionCommand: 'install --package-lock-only'
    },
    yarn: { 
      lockFile: 'yarn.lock', 
      command: 'yarn',
      cacheCleanCommand: 'cache clean',
      resolutionCommand: 'install --frozen-lockfile'
    },
  },
  performanceResultsFile: '.polyglot-performance.json',
  maxPerformanceResults: 10,
  ciConfigTemplates: {
    'GitHub Actions': `
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Use Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '{{nodeVersion}}'
    - run: {{packageManager}} install
    - run: {{packageManager}} run build --if-present
    - run: {{packageManager}} test
`,
    'GitLab CI': `
image: node:{{nodeVersion}}

stages:
  - build
  - test

cache:
  paths:
    - node_modules/

install_dependencies:
  stage: build
  script:
    - {{packageManager}} install

test:
  stage: test
  script:
    - {{packageManager}} run build --if-present
    - {{packageManager}} test
`,
    'CircleCI': `
version: 2.1
jobs:
  build:
    docker:
      - image: cimg/node:{{nodeVersion}}
    steps:
      - checkout
      - run: {{packageManager}} install
      - run: {{packageManager}} run build --if-present
      - run: {{packageManager}} test
`,
    'Travis CI': `
language: node_js
node_js:
  - "{{nodeVersion}}"
script:
  - {{packageManager}} install
  - {{packageManager}} run build --if-present
  - {{packageManager}} test
`
  }
};

export const PERFORMANCE_STEPS: ReadonlyArray<PerformanceStep> = [
  'cacheClean',
  'dependencyResolution',
  'packageInstallation',
  'cachedInstallation'
];
