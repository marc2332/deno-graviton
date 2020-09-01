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

function getDenoVersion() {
	return new Promise(res => {
		try {
			if (existDeno()) {
				// * get info from deno
				const runner = exec(`deno eval "console.log(Deno.version.deno)"`);
				runner.stdout.on("data", stdout => {
					res(stdout);
				});

				return true;
			} else {
				return false;
			}
		} catch (err) {
			return res(false);
		}
	})
}

export const entry = async ({ RunningConfig, StatusBarItem, Dialog, puffin: { element } }) => {
	
	const DenoVersion = await getDenoVersion()
	
	// * velociraptor support
	RunningConfig.data.envs.push({
		name: "Deno",
		filter(dir: string) {
			let base: any = {
				"DenoVersion": {
					value: `Deno v${DenoVersion}`
				}
			}
			return new Promise(async (resolve) => {
				fileMatches.forEach(async (file) => {
					const matchFile = path.join(dir, file);
					if (fs.existsSync(matchFile)) {
						const fileData = await fs.readFile(matchFile, "UTF-8");
						const fileJSON =
							file.includes("yaml") || file.includes("yml")
								? await parse(fileData)
								: JSON.parse(fileData);
						return base = { base, ...fileJSON }
					}
				})
				if(await fs.exists(path.join(dir, 'tsconfig.json'))){
					const { pluginInstalled } = await TsInfo(dir)
					
					const importmapExists = await fs.exists(path.join(dir, 'import_map.json'))

					base = {
						...base,
						"DenoPlugin":{
							value:`Deno plugin ${pluginInstalled ? "enabled" : "disabled"}`
						}
					}
					
					// * Add import_map.json dependencies
					if(importmapExists) {
						let dependencies  = window.require(path.join(dir, 'import_map.json')).imports
						base.dependencies = {}
						await Promise.all(Object.keys(dependencies).map( async (dep) => {
							const depName = dep.split('/')[0]
							const depValue = dependencies[dep]
							const cachedFileExists = await fs.exists(path.join(dir, 'imports',`${depName}.ts`))
							let itemValue = {}
							if(cachedFileExists) {
								itemValue[`imports/${depName}.ts`] = ''
							}else{
								itemValue = ''
							}
							base.dependencies[`[${dep}] ${depValue}`] = itemValue
						}))
					}
				}
				return resolve(base)
			});
		},
	});
	
	const DenoErrors = []
	
	const DenoStatusBarItem = new StatusBarItem({
		label: "Deno",
		hint: "Deno support",
		action: () => {
			if (DenoVersion) {
				if(DenoErrors.length === 0){
					new Dialog({
						title: "Deno info",
						component(){
							return element`
								<div>
									Status: 
									<ul>
										<li> Deno version: ${DenoVersion} </li>
									</ul>
								</div>
							`
						}
					}).launch()
				}else{
					new Dialog({
						title: "Deno errors",
						component(){
							return element`
								<div>
									Errors: 
									<ul>
										${DenoErrors.map(({ path, msg}) => {
											return element`<li>Error: ${msg} found in ${path}</li>`
										})}
									</ul>
								</div>
							`
						}
					}).launch()
				}
			} else {// * show deno error
				new Dialog({
					title: "Deno",
					content: "Deno is not installed",
				}).launch();
			}
		},
	});

	// * deno info support
	async function main(folderPath: string) {
		
		const { tsconfigOk, denoTsconfigFile, msg } = await TsInfo(folderPath)
		
		// * show deno info
		const allOk = DenoVersion && denoTsconfigFile && tsconfigOk
		
		if(!allOk){
			DenoStatusBarItem.setLabel('Deno Error')
			DenoErrors.push({
				path: folderPath,
				msg
			})
		}
	}
	
	// * when loading workspace
	RunningConfig.on("addFolderToRunningWorkspace", ({ folderPath }) => {
		main(folderPath);
	});
};


const TsInfo =  (folderPath: string): any => {
	return new Promise(async (res) => {
		const pluginInstalled = await fs.exists(
			path.join(folderPath, "/node_modules/typescript-deno-plugin")
		)
		const denoTsconfigFile = await fs.exists(
			path.join(folderPath, "tsconfig.json")
		)

		let tsconfigOk = false
		let msg = ""
		let tsconfig = null
		let denoPluginConf = null

		if (denoTsconfigFile) {
			try {
				tsconfig = window.require(path.join(folderPath, "tsconfig.json"));
			
				if (tsconfig?.compilerOptions) {
					if (!tsconfig.compilerOptions?.plugins) {
						msg = "Deno: plugins key was not found in tsconfig.json file";

					} else if (!Array.isArray(tsconfig.compilerOptions?.plugins)) {
						msg = "Deno: the plugins key must be an array in the tsconfig.json file";

					} else if (Array.isArray(tsconfig.compilerOptions?.plugins)) {
						if (!tsconfig.compilerOptions?.plugins.length) {
							msg = "Deno: plugin array in tsconfig file is empty"

						} else {
							tsconfig.compilerOptions.plugins.forEach((plugin: any) => {
								denoPluginConf = plugin
								if (plugin.name === "typescript-deno-plugin") {
									if (!plugin.enable) {
										msg = "Deno: set 'enable' in true";

									}else if (typeof plugin.enable !== "boolean") {
										msg = "Deno: 'enable' key must be boolean true or false";

									}else {
										tsconfigOk = true
									}
								} else {
									msg = "Deno: plugin not found in tsconfig.json file";

								}
							});
						}
					}
				} else {
					msg = "Deno: 'compilerOptions' key was not found in tsconfig.json file";
				}
			}
			catch (err) {
				msg = "Deno: error reading tsconfig.json file maybe not in correct json format";
			}
		} else if (!denoTsconfigFile) {
			msg = "Deno: The tsconfig.json file was not found";
		}
		
		res({
			tsconfigOk,
			msg,
			pluginInstalled,
			denoTsconfigFile,
			tsconfig,
			denoPluginConf
		})
	})
}
