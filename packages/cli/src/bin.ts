#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';
import { registerInit } from './commands/init.js';
import { registerValidate } from './commands/validate.js';
import { registerBump } from './commands/bump.js';
import { registerQuizInit } from './commands/quiz-init.js';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

const program = new Command();
program
  .name('skill-course')
  .description('Authoring CLI for skillcourse courses')
  .version(pkg.version);

registerInit(program);
registerValidate(program);
registerBump(program);
registerQuizInit(program);

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
