import { Command } from "commander";
import chalk from "chalk";

import { BuildAction } from "actions/build.action";

import { BuildCommand } from "./build.command";

import { ERROR_PREFIX } from "src/ui";

export class CommandLoader {
  public static async load(program: Command): Promise<void> {
    await new BuildCommand(new BuildAction()).load(program);
    this.handleInvalidCommand(program);
  }

  private static handleInvalidCommand(program: Command) {
    program.on("command:*", () => {
      console.error(`\n${ERROR_PREFIX} Invalid command: ${chalk.red("%s")}`, program.args.join(" "));
      console.log(`See ${chalk.red("--help")} for a list of available commands.\n`);
      process.exit(1);
    });
  }
}
