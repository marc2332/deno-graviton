import { exec } from "child_process";
import fs from "fs-extra";
import path from "path";
import os from "os";

/**
 * verify if deno is installed
 */
const existDeno = () => {
  if (os.type() === "Windows_NT") {
    const Paths = process.env.Path.split(";");

    const regex = new RegExp(/.deno/);
    return Paths.filter((path) => {
      if (regex.test(path)) {
        return path;
      }
    }).length;
  } else {
    return !!process.env.DENO_INSTALL;
  }
};

/**
 * return deno version info
 */
export function getDenoVersion(): Promise<string | boolean> {
  return new Promise((res) => {
    try {
      if (existDeno()) {
        // * get info from deno
        const runner = exec(`deno eval "console.log(Deno.version.deno)"`);
        runner.stdout.on("data", (stdout) => {
          res(stdout);
        });
        return true;
      } else {
        return res(false);
      }
    } catch (err) {
      return res(false);
    }
  });
}

export const fileMatches = [
  "velociraptor.yaml",
  "scripts.yaml",
  "velociraptor.yml",
  "velociraptor.json",
  "scripts.json",
  "run.json",
  "run.yaml",
  "run.yml",
];

export function maybeDenoProject(filePath: string): boolean {
  const exist =
    fs.existsSync(path.join(filePath, "import_map.json")) ||
    fs.existsSync(path.join(filePath, "imports", "deps.json")) ||
    fs.existsSync(path.join(filePath, "velociraptor.yaml")) ||
    fs.existsSync(path.join(filePath, "velociraptor.yml")) ||
    fs.existsSync(path.join(filePath, "scripts.yaml")) ||
    fs.existsSync(path.join(filePath, "scripts.json")) ||
    fs.existsSync(path.join(filePath, "run.json")) ||
    fs.existsSync(path.join(filePath, "run.yml")) ||
    fs.existsSync(path.join(filePath, "run.yaml")) ||
    fs.existsSync(path.join(filePath, "mod.ts"));

  return exist;
}
