import { parse } from 'yaml'
const fs = window.require('fs-extra')
import { join } from 'path'

const fileMatches = [
	'velociraptor.yaml',
	'scripts.yaml',
	'velociraptor.yml',
	'velociraptor.json',
	'scripts.json'
]

export const entry = ({ RunningConfig }) => {
	RunningConfig.data.envs.push({
		name: 'Deno',
		filter(dir){
			return new Promise(async (resolve, reject) => {
				fileMatches.forEach( async (file) => {
					const matchFile = join(dir,file)
					if( fs.existsSync(matchFile)){
						const fileData = await fs.readFile(matchFile,'UTF-8')
						const fileJSON = file.includes('yaml') || file.includes('yml')? await parse(fileData) : JSON.parse(fileData)
						return resolve(fileJSON)
					}
				})
			})
		}
	})
}