import { Options } from "@swc/core";

import { ERROR_PREFIX } from "../../ui";

interface CliOptions {
  readonly outDir: string;
  readonly outFile: string;
  /**
   * Invoke swc using transformSync. It's useful for debugging.
   */
  readonly sync: boolean;
  readonly sourceMapTarget?: string;
  readonly filename: string;
  readonly filenames: string[];
  readonly extensions: string[];
  readonly watch: boolean;
  readonly copyFiles: boolean;
  readonly includeDotfiles: boolean;
  readonly deleteDirOnStart: boolean;
  readonly quiet: boolean;
}

type SwcBinary = {
  default: ({ cliOptions, swcOptions }: { cliOptions: Partial<CliOptions>; swcOptions: Options }) => Promise<void>;
};

export class SwcBinaryLoader {
  private swcBinary?: SwcBinary;

  public load(): SwcBinary {
    if (this.swcBinary) return this.swcBinary;

    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const swcBinary = require("@swc/cli/lib/swc/dir");
      this.swcBinary = swcBinary;
      return swcBinary;
    } catch (err) {
      console.error(
        ERROR_PREFIX +
          ' Failed to load "@swc/cli" and "@swc/core" packages. Please, install them by running "npm i -D @swc/cli @swc/core".',
      );
      process.exit(1);
    }
  }
}
