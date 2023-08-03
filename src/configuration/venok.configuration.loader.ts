import { Reader } from "../readers";
import { Configuration } from "./configuration";
import { ConfigurationLoader } from "./configuration.loader";
import { defaultConfiguration } from "./defaults";

export class VenokConfigurationLoader implements ConfigurationLoader {
  constructor(private readonly reader: Reader) {}

  public async load(name?: string): Promise<Required<Configuration>> {
    const content: string | undefined = name
      ? await this.reader.read(name)
      : await this.reader.readAnyOf(["venok-cli.json", ".venokcli.json", ".venok-cli.json", "venok.json"]);

    if (!content) return defaultConfiguration;

    const fileConfig = JSON.parse(content);

    if (fileConfig.compilerOptions) {
      return {
        ...defaultConfiguration,
        ...fileConfig,
        compilerOptions: {
          ...defaultConfiguration.compilerOptions,
          ...fileConfig.compilerOptions,
        },
      };
    }
    return {
      ...defaultConfiguration,
      ...fileConfig,
    };
  }
}
