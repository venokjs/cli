import { dirname, posix } from "path";
import ts from "typescript";
import os from "os";

import { TypeScriptBinaryLoader } from "compiler/loaders/typescript.loader";

import tsPaths = require("tsconfig-paths");

export function tsconfigPathsBeforeHookFactory(compilerOptions: ts.CompilerOptions) {
  const tsBinary = new TypeScriptBinaryLoader().load();
  const { paths = {}, baseUrl = "./" } = compilerOptions;
  const matcher = tsPaths.createMatchPath(baseUrl!, paths, ["main"]);

  return (ctx: ts.TransformationContext): ts.Transformer<any> => {
    return (sf: ts.SourceFile) => {
      const visitNode = (node: ts.Node): ts.Node => {
        if (tsBinary.isImportDeclaration(node) || (tsBinary.isExportDeclaration(node) && node.moduleSpecifier)) {
          try {
            const importPathWithQuotes = node.moduleSpecifier && node.moduleSpecifier.getText();

            if (!importPathWithQuotes) return node;

            const text = importPathWithQuotes.substring(1, importPathWithQuotes.length - 1);
            const result = getNotAliasedPath(sf, matcher, text);
            if (!result) return node;

            const moduleSpecifier = tsBinary.factory.createStringLiteral(result);
            (moduleSpecifier as any).parent = (node as any).moduleSpecifier.parent;

            if (tsBinary.isImportDeclaration(node)) {
              const updatedNode = tsBinary.factory.updateImportDeclaration(
                node,
                node.modifiers,
                node.importClause,
                moduleSpecifier,
                node.assertClause,
              );
              (updatedNode as any).flags = node.flags;
              return updatedNode;
            } else {
              const updatedNode = tsBinary.factory.updateExportDeclaration(
                node,
                node.modifiers,
                node.isTypeOnly,
                node.exportClause,
                moduleSpecifier,
                node.assertClause,
              );
              (updatedNode as any).flags = node.flags;
              return updatedNode;
            }
          } catch {
            return node;
          }
        }
        return tsBinary.visitEachChild(node, visitNode, ctx);
      };
      return tsBinary.visitNode(sf, visitNode);
    };
  };
}

function getNotAliasedPath(sf: ts.SourceFile, matcher: tsPaths.MatchPath, text: string) {
  let result = matcher(text, undefined, undefined, [".ts", ".tsx", ".js", ".jsx"]);
  if (!result) return;

  if (os.platform() === "win32") result = result.replace(/\\/g, "/");

  try {
    // Installed packages (node modules) should take precedence over root files with the same name.
    // Ref: https://github.com/nestjs/nest-cli/issues/838
    const packagePath = require.resolve(text, {
      paths: [process.cwd(), ...module.paths],
    });

    // From 0x303133
    // We need to check if path contains "node_modules"
    // Either we can catch bugs
    // For ex. u can try to build venok cli with cli
    // and remove `packagePath.includes("node_modules")`
    // from check
    if (packagePath && packagePath.includes("node_modules")) return text;
  } catch {}

  const resolvedPath = posix.relative(dirname(sf.fileName), result) || "./";
  return resolvedPath[0] === "." ? resolvedPath : "./" + resolvedPath;
}
