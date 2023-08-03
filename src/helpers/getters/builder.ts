import { Builder, Configuration } from "src/configuration";

import { getValueOrDefault } from "./value.or.default";

import { Input } from "commands/abstract.command";

/**
 * Returns the builder to use for the given application.
 * @param configuration Configuration object.
 * @param cmdOptions Command line options.
 * @param appName Application name.
 * @returns The builder to use.
 */
export function getBuilder(configuration: Required<Configuration>, cmdOptions: Input[], appName: string) {
  const builderValue = getValueOrDefault<Builder>(configuration, "compilerOptions.builder", appName, "builder", cmdOptions, "tsc");
  return typeof builderValue === "string" ? { type: builderValue } : builderValue;
}
