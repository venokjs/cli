#!/usr/bin/env node
import { program } from "commander";
import process from "process";

import { CommandLoader } from "commands/command.loader";

const bootstrap = async () => {
  const pkg = process.env.VENOK_CLI_DEV ? "../package.json" : "../../package.json";
  program
    .version(require(pkg).version, "-v, --version", "Output the current version.")
    .usage("<command> [options]")
    .helpOption("-h, --help", "Output usage information.");

  await CommandLoader.load(program);

  await program.parseAsync(process.argv);

  if (!process.argv.slice(2).length) program.outputHelp();
};

bootstrap();
