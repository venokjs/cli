import { Builder, Configuration } from "../../configuration";
import { Input } from "../../../commands/abstract.command";
import { getValueOrDefault } from "./value.or.default";

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
