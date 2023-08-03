import { getDefaultTsconfigPath } from "./default.tsconfig.paths";
import { Builder, Configuration } from "../../configuration";
import { Input } from "../../../commands/abstract.command";
import { getValueOrDefault } from "./value.or.default";

/**
 * Returns the path to the tsc configuration file to use for the given application.
 * @param configuration Configuration object.
 * @param cmdOptions Command line options.
 * @param appName Application name.
 * @returns The path to the tsc configuration file to use.
 */
export function getTscConfigPath(configuration: Required<Configuration>, cmdOptions: Input[], appName: string) {
  let tsconfigPath = getValueOrDefault<string | undefined>(configuration, "compilerOptions.tsConfigPath", appName, "path", cmdOptions);
  if (tsconfigPath) return tsconfigPath;

  const builder = getValueOrDefault<Builder>(configuration, "compilerOptions.builder", appName);

  tsconfigPath = typeof builder === "object" && builder?.type === "tsc" ? builder.options?.configPath : undefined;

  return tsconfigPath ?? getDefaultTsconfigPath();
}
