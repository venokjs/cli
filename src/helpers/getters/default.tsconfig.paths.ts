import { join } from "path";
import fs from "fs";

const TSCONFIG_BUILD_JSON = "tsconfig.build.json";
const TSCONFIG_JSON = "tsconfig.json";

export function getDefaultTsconfigPath() {
  return fs.existsSync(join(process.cwd(), TSCONFIG_BUILD_JSON)) ? TSCONFIG_BUILD_JSON : TSCONFIG_JSON;
}
