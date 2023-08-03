import rimraf from "rimraf";

import { getValueOrDefault } from "./getters/value.or.default";

import { Configuration } from "src/configuration";

export class WorkspaceHelper {
  public async deleteOutDirIfEnabled(configuration: Required<Configuration>, appName: string, dirPath: string) {
    const isDeleteEnabled = getValueOrDefault<boolean>(configuration, "compilerOptions.deleteOutDir", appName);
    if (!isDeleteEnabled) return;
    await rimraf(dirPath);
  }
}
