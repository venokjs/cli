import { Command } from "commander";

import { availableBuilders } from "../src/compiler/constants";
import { AbstractCommand, Input } from "./abstract.command";
import { ERROR_PREFIX, INFO_PREFIX } from "../src/ui";
import { BuilderVariant } from "../src/configuration";

interface BuildOptions {
  config: string;
  watch: boolean;
  watchAssets: boolean;
  path: string;
  builder: BuilderVariant;
  typeCheck: string;
  preserveWatchOutput: boolean;
}

export class BuildCommand extends AbstractCommand {
  public load(program: Command): void {
    program
      .command("build [app]")
      .option("-c, --config [path]", "Path to nest-cli configuration file.")
      .option("-p, --path [path]", "Path to tsconfig file.")
      .option("-w, --watch", "Run in watch mode (live-reload).")
      .option("-b, --builder [name]", "Builder to be used (tsc, webpack, swc).")
      .option("--watchAssets", "Watch non-ts (e.g., .graphql) files mode.")
      .option("--type-check", "Enable type checking (when SWC is used).")
      .option("--preserveWatchOutput", 'Use "preserveWatchOutput" option when using tsc watch mode.')
      .description("Build Nest application.")
      .action(async (app: string, config: BuildOptions, command: Command) => {
        const options: Input[] = [];
        const inputs: Input[] = [];

        inputs.push({ name: "app", value: app });

        options.push({ name: "config", value: config.config });

        options.push({ name: "watch", value: !!config.watch });
        options.push({ name: "watchAssets", value: !!config.watchAssets });
        options.push({ name: "path", value: config.path });

        if (config.builder && !availableBuilders.includes(config.builder)) {
          console.error(ERROR_PREFIX + ` Invalid builder option: ${config.builder}. Available builders: ${availableBuilders.join(", ")}`);
          return;
        }

        options.push({ name: "builder", value: config.builder });

        if (config.typeCheck && config.builder !== "swc") {
          console.warn(INFO_PREFIX + ` "typeCheck" will not have any effect when "builder" is not "swc".`);
        }

        options.push({ name: "typeCheck", value: config.typeCheck });

        options.push({
          name: "preserveWatchOutput",
          value: !!config.preserveWatchOutput && !!config.watch,
        });

        await this.action.handle(inputs, options);
      });
  }
}
