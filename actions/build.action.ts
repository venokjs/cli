import chalk from "chalk";
import ts from "typescript";

import { VenokConfigurationLoader } from "../src/configuration/venok.configuration.loader";
import { TypeScriptBinaryLoader } from "../src/compiler/loaders/typescript.loader";
import { ConfigurationLoader } from "../src/configuration/configuration.loader";
import { getValueOrDefault } from "../src/helpers/getters/value.or.default";
import { getTscConfigPath } from "../src/helpers/getters/tsconfig.paths";
import { PluginsLoader } from "../src/compiler/loaders/plugin.loader";
import { TsConfigProvider } from "../src/compiler/tsconfig.provider";
import { AssetsManager } from "../src/compiler/assets.manager";
import { defaultOutDir } from "../src/configuration/defaults";
import { WorkspaceHelper } from "../src/helpers/workspace";
import { getBuilder } from "../src/helpers/getters/builder";
import { Input } from "../commands/abstract.command";
import { Configuration } from "../src/configuration";
import { AbstractAction } from "./abstract.action";
import { FileSystemReader } from "../src/readers";
import { ERROR_PREFIX } from "../src/ui";

export class BuildAction extends AbstractAction {
  protected readonly pluginsLoader = new PluginsLoader();
  protected readonly tsLoader = new TypeScriptBinaryLoader();
  protected readonly tsConfigProvider = new TsConfigProvider(this.tsLoader);
  protected readonly fileSystemReader = new FileSystemReader(process.cwd());
  protected readonly loader: ConfigurationLoader = new VenokConfigurationLoader(this.fileSystemReader);
  protected readonly assetsManager = new AssetsManager();
  protected readonly workspaceHelper = new WorkspaceHelper();

  public async handle(commandInputs: Input[], commandOptions: Input[]) {
    try {
      const watchModeOption = commandOptions.find((option) => option.name === "watch");
      const watchMode = !!(watchModeOption && watchModeOption.value);

      const watchAssetsModeOption = commandOptions.find((option) => option.name === "watchAssets");
      const watchAssetsMode = !!(watchAssetsModeOption && watchAssetsModeOption.value);

      await this.runBuild(commandInputs, commandOptions, watchMode, watchAssetsMode);
    } catch (err) {
      if (err instanceof Error) console.log(`\n${ERROR_PREFIX} ${err.message}\n`);
      else console.error(`\n${chalk.red(err)}\n`);

      process.exit(1);
    }
  }

  public async runBuild(
    commandInputs: Input[],
    commandOptions: Input[],
    watchMode: boolean,
    watchAssetsMode: boolean,
    isDebugEnabled = false,
    onSuccess?: () => void,
  ) {
    const configFileName = commandOptions.find((option) => option.name === "config")!.value as string;
    const configuration = await this.loader.load(configFileName);
    const appName = commandInputs.find((input) => input.name === "app")!.value as string;

    const pathToTsconfig = getTscConfigPath(configuration, commandOptions, appName);
    const { options: tsOptions } = this.tsConfigProvider.getByConfigFilename(pathToTsconfig);
    const outDir = tsOptions.outDir || defaultOutDir;

    const builder = getBuilder(configuration, commandOptions, appName);

    await this.workspaceHelper.deleteOutDirIfEnabled(configuration, appName, outDir);
    this.assetsManager.copyAssets(configuration, appName, outDir, watchAssetsMode);

    switch (builder.type) {
      case "tsc":
        return this.runTsc(watchMode, commandOptions, configuration, pathToTsconfig, appName, onSuccess);
      case "swc":
        return this.runSwc(configuration, appName, pathToTsconfig, watchMode, commandOptions, tsOptions, onSuccess);
    }
  }

  private async runSwc(
    configuration: Required<Configuration>,
    appName: string,
    pathToTsconfig: string,
    watchMode: boolean,
    options: Input[],
    tsOptions: ts.CompilerOptions,
    onSuccess: (() => void) | undefined,
  ) {
    const { SwcCompiler } = await import("../src/compiler/swc/swc.compiler");
    const swc = new SwcCompiler(this.pluginsLoader);
    await swc.run(
      configuration,
      pathToTsconfig,
      appName,
      {
        watch: watchMode,
        typeCheck: getValueOrDefault<boolean>(configuration, "compilerOptions.typeCheck", appName, "typeCheck", options),
        tsOptions,
        assetsManager: this.assetsManager,
      },
      onSuccess,
    );
  }

  private async runTsc(
    watchMode: boolean,
    options: Input[],
    configuration: Required<Configuration>,
    pathToTsconfig: string,
    appName: string,
    onSuccess: (() => void) | undefined,
  ) {
    if (watchMode) {
      const { WatchCompiler } = await import("../src/compiler/tsc/watch.compiler");
      const watchCompiler = new WatchCompiler(this.pluginsLoader, this.tsConfigProvider, this.tsLoader);
      const isPreserveWatchOutputEnabled = options.find((option) => option.name === "preserveWatchOutput" && option.value === true)
        ?.value as boolean | undefined;
      watchCompiler.run(configuration, pathToTsconfig, appName, { preserveWatchOutput: isPreserveWatchOutputEnabled }, onSuccess);
    } else {
      const { TscCompiler } = await import("../src/compiler/tsc/tsc.compiler");
      const compiler = new TscCompiler(this.pluginsLoader, this.tsConfigProvider, this.tsLoader);
      compiler.run(configuration, pathToTsconfig, appName, undefined, onSuccess);
      this.assetsManager.closeWatchers();
    }
  }
}
