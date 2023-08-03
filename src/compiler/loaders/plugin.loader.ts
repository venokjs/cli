import { join } from "path";
import ts from "typescript";

import { CLI_ERRORS } from "../../ui";
import { ReadonlyVisitor } from "../plugins/readonly.visitor.interface";

const PLUGIN_ENTRY_FILENAME = "plugin";

type Transformer = ts.TransformerFactory<any> | ts.CustomTransformerFactory;
type PluginEntry = string | PluginAndOptions;
type PluginOptions = Record<string, any>;

interface PluginAndOptions {
  name: "string";
  options: PluginOptions;
}

export interface VenokCompilerPlugin {
  before?: (options?: PluginOptions, program?: ts.Program) => Transformer;
  after?: (options?: PluginOptions, program?: ts.Program) => Transformer;
  afterDeclarations?: (options?: PluginOptions, program?: ts.Program) => Transformer;
  ReadonlyVisitor?: { new (options: PluginOptions): ReadonlyVisitor };
}

export interface MultiVenokCompilerPlugins {
  beforeHooks: Array<(program?: ts.Program) => Transformer>;
  afterHooks: Array<(program?: ts.Program) => Transformer>;
  afterDeclarationsHooks: Array<(program?: ts.Program) => Transformer>;
  readonlyVisitors: Array<ReadonlyVisitor>;
}

export class PluginsLoader {
  private name(entry: PluginEntry) {
    return typeof entry === "object" ? (entry as PluginAndOptions).name : (entry as string);
  }

  public load(plugins: PluginEntry[] = [], extras: { pathToSource?: string } = {}): MultiVenokCompilerPlugins {
    const pluginNames = plugins.map((entry) => this.name(entry));
    const pluginRefs = this.resolvePluginReferences(pluginNames);
    const multiCompilerPlugins: MultiVenokCompilerPlugins = {
      afterHooks: [],
      afterDeclarationsHooks: [],
      beforeHooks: [],
      readonlyVisitors: [],
    };

    pluginRefs.forEach((plugin, index) => {
      if (!plugin.before && !plugin.after && !plugin.afterDeclarations) {
        throw new Error(CLI_ERRORS.WRONG_PLUGIN(pluginNames[index]));
      }
      const options = typeof plugins[index] === "object" ? (plugins[index] as PluginAndOptions).options || {} : {};

      if (plugin.before) multiCompilerPlugins.beforeHooks.push(plugin.before.bind(plugin.before, options));

      if (plugin.after) multiCompilerPlugins.afterHooks.push(plugin.after.bind(plugin.after, options));

      if (plugin.afterDeclarations) {
        multiCompilerPlugins.afterDeclarationsHooks.push(plugin.afterDeclarations.bind(plugin.afterDeclarations, options));
      }

      if (plugin.ReadonlyVisitor) {
        const instance = new plugin.ReadonlyVisitor({
          ...options,
          ...extras,
          readonly: true,
        });
        instance.key = pluginNames[index];
        multiCompilerPlugins.readonlyVisitors.push(instance);
      }
    });
    return multiCompilerPlugins;
  }

  private resolvePluginReferences(pluginNames: string[]): VenokCompilerPlugin[] {
    const nodeModulePaths = [join(process.cwd(), "node_modules"), ...module.paths];

    return pluginNames.map((item) => {
      try {
        try {
          const binaryPath = require.resolve(join(item, PLUGIN_ENTRY_FILENAME), {
            paths: nodeModulePaths,
          });
          return require(binaryPath);
        } catch {}

        const binaryPath = require.resolve(item, { paths: nodeModulePaths });
        return require(binaryPath);
      } catch (e) {
        throw new Error(`"${item}" plugin is not installed.`);
      }
    });
  }
}
