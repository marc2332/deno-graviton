import { importMap, importsInfo, Deps } from "./types";
import fs from "fs-extra";
import path from "path";

const getFile = (folderPath: string, file: string) =>
  path.join(folderPath, file);

export function resolveImports(dir: string, Notification: any, timeOut = 3000) {
  const infoDeps: importsInfo = {};

  if (fs.existsSync(getFile(dir, "import_map.json"))) {
    try {
      const importmap: importMap = window.require(
        getFile(dir, "import_map.json")
      );

      if (!importmap?.imports) {
        throw "'imports' key not found in import_map.json file";
      }
      else if (!Object.keys(importmap?.imports).length) {
        throw "'imports' key is a empty object";
      }
      else if (!(importmap.imports !== null && typeof importmap.imports === 'object')) {
        throw "'imports' key must be an object";
      }
      else {
        infoDeps["import_map.json"] = {};
        for (const dep in importmap.imports) {
          if (typeof importmap.imports[dep] !== "string") {
            throw `the package '${dep}' must be have a url string type`;
          }

          infoDeps["import_map.json"][dep] = { url: { value: importmap.imports[dep] } };
        }
      }
    }
    catch (err) {
      const msg =
        err instanceof SyntaxError
          ? "error reading import_map.json file maybe not in correct json format"
          : typeof err === "string"
            ? err
            : (err as Error).message;

      setTimeout(()=> {
        new Notification({
          title: "Deno",
          content: msg,
        });
      }, timeOut);
    }
  }

  if (fs.existsSync(getFile(dir, "imports/deps.json"))) {
    try {
      const deps: Deps = window.require(getFile(dir, "imports/deps.json"));

      if (!deps?.meta) {
        throw "'meta' key not found in deps.json file";
      }
      else if (!Object.keys(deps?.meta).length) {
        throw "'meta' key is a empty object";
      }
      else if (!(deps.meta !== null && typeof deps.meta === 'object')) {
        throw "'meta' key must be an object";
      }
      else {
        infoDeps["deps.json"] = {};
        for (const dep in deps.meta) {
          if (
            typeof deps.meta[dep].url !== "string" ||
            typeof deps.meta[dep].hash !== "string"
          ) {
            throw `the package '${dep}' must be have a url and hash string type`;
          }

          infoDeps["deps.json"][dep] = {
            url: { value: "url: " + deps.meta[dep].url },
            hash: { value: "hash: " + deps.meta[dep].hash },
          };
        }
      }
    }
    catch (err) {
      const msg =
        err instanceof SyntaxError
          ? "error reading deps.json file maybe not in correct json format"
          : typeof err === "string"
            ? err
            : (err as Error).message;

      setTimeout(()=> {
        new Notification({
          title: "Deno",
          content: msg,
        });
      }, timeOut)
    }
  }

  return infoDeps;
}

export function existManager(filePath: string): boolean {
  const exist =
    fs.existsSync(path.join(filePath, "import_map.json")) ||
    fs.existsSync(path.join(filePath, "imports/deps.json"));

  return exist;
}
