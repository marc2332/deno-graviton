const fs = window.require("fs-extra");
import { exec } from "child_process";
import { parse } from "yaml";
import path from "path";
import os from "os";

const fileMatches = [
	"velociraptor.yaml",
	"scripts.yaml",
	"velociraptor.yml",
	"velociraptor.json",
	"scripts.json",
];

/* verify if deno is installed */
const existDeno = () => {
	if (os.type() === "Windows_NT") {
		const Paths = process.env.Path.split(";");

		const regx = new RegExp(/.deno/);
		return Paths.filter((path) => {
			if (regx.test(path)) {
				return path;
			}
		}).length;
	} else {
		return !!process.env.DENO_INSTALL;
	}
};

function DenoInfo(callback = () => {}) {
	try {
		if (existDeno()) {
			// * get info from deno
			const runner = exec(`deno eval "console.log(Deno.version.deno)"`);
			runner.stdout.on("data", (stdout) => {
				callback(stdout);
			});

			return true;
		} else {
			return false;
		}
	} catch (err) {
		return false;
	}
}

export const entry = ({ RunningConfig, StatusBarItem, Dialog }) => {
	// * velociraptor support
	RunningConfig.data.envs.push({
		name: "Deno",
		filter(dir) {
			return new Promise(async (resolve, reject) => {
				fileMatches.forEach(async (file) => {
					const matchFile = path.join(dir, file);
					if (fs.existsSync(matchFile)) {
						const fileData = await fs.readFile(matchFile, "UTF-8");
						const fileJSON =
							file.includes("yaml") || file.includes("yml")
								? await parse(fileData)
								: JSON.parse(fileData);
						return resolve(fileJSON);
					}
				});
			});
		},
	});

	// * deno info support
	function main(folderPath) {
		const plugin = fs.existsSync(
			path.join(folderPath, "/node_modules/typescript-deno-plugin")
		);
		const denoTsconfigFile = fs.existsSync(
			path.join(folderPath, "tsconfig.json")
		);
		let tsconfigOk = false;
		let diag = null;
		let msg = "";

		if (denoTsconfigFile) {
			try {
				const tsconfig = require(path.join(folderPath, "tsconfig.json"));

				if (tsconfig?.compilerOptions) {
					if (!tsconfig.compilerOptions?.plugins) {
						msg = "Deno: plugins key was not found in tsconfig.json file";
					}

					else if (!Array.isArray(tsconfig.compilerOptions?.plugins)) {
						msg =
							"Deno: the plugins key must be an array in the tsconfig.json file";
					}

					else if (Array.isArray(tsconfig.compilerOptions?.plugins)) {

						if (!tsconfig.compilerOptions?.plugins.length) {
							msg = "Deno: plugin array in tsconfig file is empty"
						}

						else {
							tsconfig.compilerOptions.plugins.forEach((plugin) => {
								if (plugin.name === "typescript-deno-plugin") {

									if (!plugin.enable) {
										msg = "Deno: set 'enable' in true";
									}

									else if (typeof plugin.enable !== "boolean") {
										msg = "Deno: 'enable' key must be boolean true or false";
									}

									else {
										tsconfigOk = true;
										diag = new Dialog({
											title: "Deno info",
											content: `Config:\n - enable = ${plugin.enable}\n - importmaps = "${plugin.importmap}"\n`,
										});
									}
								}

								else {
									msg = "Deno: plugin not found in tsconfig.json file";
								}
							});
						}
					}
				}

				else {
					msg =
						"Deno: 'compilerOptions' key was not found in tsconfig.json file";
				}
			}

			catch (err) {
				msg = "Deno: error reading tsconfig.json file maybe not in correct json format";
			}
		}

		else if (!denoTsconfigFile) {
			msg = "Deno: The tsconfig.json file was not found";
		}

		// * it is activated only if the deno plugin is installed in the workspace
		if (plugin) {
			// * show deno info
			if (DenoInfo() && denoTsconfigFile && tsconfigOk) {
				DenoInfo((info) => {
					new StatusBarItem({
						label: `Deno ${info}`,
						hint: "Deno support",
						action: (e) => {
							diag.launch();
						},
					});
				});
			}
			// * show deno error
			else {
				new StatusBarItem({
					label: msg,
					hint: "something has not gone well",
					important: true,
					action: () => {
						new Dialog({
							title: "Deno error",
							content: msg,
						}).launch();
						console.error(`Deno plugin: => ${msg}`);
					},
				});
			}
		}
	}

	// * when loading workspace
	RunningConfig.on("addFolderToRunningWorkspace", ({ folderPath }) => {
		main(folderPath);
	});
};
