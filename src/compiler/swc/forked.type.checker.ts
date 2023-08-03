import ts from "typescript";

import { FOUND_NO_ISSUES_GENERATING_METADATA, FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED } from "compiler/constants";
import { PluginMetadataGenerator } from "compiler/plugins/plugin.metadata.generator";
import { TypeCheckerHost } from "compiler/plugins/type.checker.host";
import { PluginsLoader } from "compiler/loaders/plugin.loader";
import { BaseCompiler } from "compiler/base.compiler";

import { Configuration } from "src/configuration";
import { ERROR_PREFIX } from "src/ui";

import { SwcCompilerExtras } from "./swc.compiler";

const [tsConfigPath, appName, sourceRoot, plugins] = process.argv.slice(2);

class ForkedTypeChecker extends BaseCompiler {
  private readonly pluginMetadataGenerator = new PluginMetadataGenerator();
  private readonly typeCheckerHost = new TypeCheckerHost();

  public async run(
    configuration: Required<Configuration>,
    tsConfigPath: string,
    appName: string | undefined,
    extras: Pick<SwcCompilerExtras, "typeCheck" | "watch">,
  ) {
    const { readonlyVisitors } = this.loadPlugins(configuration, tsConfigPath, appName);
    const outputDir = this.getPathToSource(configuration, tsConfigPath, appName);

    try {
      const onTypeCheckOrProgramInit = (program: ts.Program) => {
        if (readonlyVisitors.length > 0) {
          console.log(FOUND_NO_ISSUES_GENERATING_METADATA);

          this.pluginMetadataGenerator.generate({
            outputDir,
            visitors: readonlyVisitors,
            tsProgramRef: program,
          });
        } else {
          console.log(FOUND_NO_ISSUES_METADATA_GENERATION_SKIPPED);
        }
      };
      this.typeCheckerHost.run(tsConfigPath, {
        watch: extras.watch,
        onTypeCheck: onTypeCheckOrProgramInit,
        onProgramInit: onTypeCheckOrProgramInit,
      });
    } catch (err) {
      console.log(ERROR_PREFIX, (err as any).message);
    }
  }
}

const pluginsLoader = new PluginsLoader();
const forkedTypeChecker = new ForkedTypeChecker(pluginsLoader);
const applicationName = appName === "undefined" ? "" : appName;
const options: Partial<Configuration> = { sourceRoot };

if (applicationName) {
  options.projects = {};
  options.projects[applicationName] = {
    compilerOptions: {
      plugins: JSON.parse(plugins),
    },
  };
} else {
  options.compilerOptions = { plugins: JSON.parse(plugins) };
}

forkedTypeChecker.run(options as unknown as Required<Configuration>, tsConfigPath, applicationName, {
  watch: true,
  typeCheck: true,
});
