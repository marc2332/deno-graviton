import { TsInfoConfig } from "./types";
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
];

export const enum ErrorMessages {
	pluginsKeyNotFound = "Deno: 'plugins' key was not found in tsconfig.json file",
	pluginsKeyIsNotArray = "Deno: the 'plugins' key must be an array in the tsconfig.json file",
	pluginArrayIsEmpty = "Deno: 'plugins' key in tsconfig file is an empty array",
	denoDisable = "Deno: set 'enable' in true",
	denoEnableNotBeABoolean = "Deno: 'enable' key must be boolean true or false",
	denoPluginNotFound = "Deno: 'typescript-deno-plugin' not found in tsconfig.json file",
	compilerOptionsNotFound = "Deno: 'compilerOptions' key was not found in tsconfig.json file",
	invalidJsonFormat = "Deno: error reading tsconfig.json file maybe not in correct json format",
	tsconfigFileNotFound = "Deno: The tsconfig.json file was not found",
}

export function maybeDenoProject(filePath: string): boolean {
  const exist =
    fs.existsSync(path.join(filePath, "import_map.json")) ||
    fs.existsSync(path.join(filePath, "imports", "deps.json")) ||
    fs.existsSync(path.join(filePath, "velociraptor.yaml")) ||
    fs.existsSync(path.join(filePath, "velociraptor.yml")) ||
    fs.existsSync(path.join(filePath, "scripts.yaml")) ||
    fs.existsSync(path.join(filePath, "scripts.json"));

	return exist;
}

/**
 * analyze and get information from tsconfig.json file
 * @param {string} folderPath
 */
export const TsInfo = (folderPath: string): Promise<TsInfoConfig> => {
  return new Promise(async (res) => {
    const pluginInstalled = fs.existsSync(
      path.join(folderPath, "/node_modules/typescript-deno-plugin")
    );
    const denoTsconfigFile = fs.existsSync(
      path.join(folderPath, "tsconfig.json")
    );

		let denoPluginConf = {};
		let tsconfigOk = false;
		let tsconfig = null;
		let msg = "";

		if (denoTsconfigFile) {
			try {
				tsconfig = window.require(path.join(folderPath, "tsconfig.json"));

				if (tsconfig?.compilerOptions) {

					if (!tsconfig.compilerOptions?.plugins) {
						msg = ErrorMessages.pluginsKeyNotFound;
					}
					else if (!Array.isArray(tsconfig.compilerOptions?.plugins)) {
						msg = ErrorMessages.pluginsKeyIsNotArray;
					}
					else if (Array.isArray(tsconfig.compilerOptions?.plugins)) {
						if (!tsconfig.compilerOptions?.plugins.length) {
							msg = ErrorMessages.pluginArrayIsEmpty;
						}
						else {
							tsconfig.compilerOptions.plugins.forEach((plugin: any) => {

								if (plugin.name === "typescript-deno-plugin") {
									denoPluginConf = plugin;
									if (!plugin.enable) {
										msg = ErrorMessages.denoDisable;
									}
									else if (typeof plugin.enable !== "boolean") {
										msg = ErrorMessages.denoEnableNotBeABoolean;
									}
									else {
										tsconfigOk = true;
									}
								}
								else {
									msg = ErrorMessages.denoPluginNotFound;
								}
							});
						}
					}
				}
				else {
					msg = ErrorMessages.compilerOptionsNotFound;
				}
			}
			catch (err) {
				msg = ErrorMessages.invalidJsonFormat;
			}
		}
		else if (!denoTsconfigFile) {
			msg = ErrorMessages.tsconfigFileNotFound;
		}

		res({
			denoTsconfigFile,
			pluginInstalled,
			denoPluginConf,
			tsconfigOk,
			tsconfig,
			msg,
		});
	});
};