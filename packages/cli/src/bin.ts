#!/usr/bin/env node
import { Command } from 'commander';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const pkg = require('../package.json') as { version: string };

const program = new Command();
program
  .name('skill-course')
  .description('Authoring CLI for skillcourse courses')
  .version(pkg.version);

program
  .command('init <slug>')
  .description('Scaffold a new course folder')
  .action(() => {
    throw new Error('init command not implemented yet');
  });

program
  .command('validate [path]')
  .description('Validate a course folder')
  .action(() => {
    throw new Error('validate command not implemented yet');
  });

program
  .command('bump <type>')
  .description('Bump course version (patch | minor | major)')
  .action(() => {
    throw new Error('bump command not implemented yet');
  });

program
  .command('quiz <subcommand>')
  .description('Quiz subcommands (init)')
  .action(() => {
    throw new Error('quiz command not implemented yet');
  });

program.parseAsync(process.argv).catch((err: Error) => {
  console.error(err.message);
  process.exit(1);
});
