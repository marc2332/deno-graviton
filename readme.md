## 🦕 Deno Graviton

Deno plugin, allows you to inspect your projects that use Velociraptor (https://github.com/umbopepato/velociraptor), and also of TypeScript's Deno Plugin (https://www.npmjs.com/package/typescript-deno-plugin)

### Setup

create a `tsconfig.json` file with the following configuration:

```json
{
	"compilerOptions": {
		"plugins": [
			{
				"name": "typescript-deno-plugin",
				"enable": true,
				"importmap": "import_map.json" // optional
			}
		]
	}
}
```

restart graviton and enjoy

### Thing it allows to:

- full integration through [lsp codemirror](https://github.com/marc2332/lsp-codemirror) [wip]
  - top level await
  - Deno namespace
  - import files using extension
  - support to import maps
- Inspect velociraptor.yml (scripts.json, etc...) files from Graviton. More info in [Velociraptor](https://github.com/umbopepato/velociraptor)
- Run scripts from Graviton

### 🕹 Developing

Clone the repo to the desired .graviton2/plugins:

```shell
git clone https://github.com/marc2332/deno-graviton.git
```

Install dependencies:

```shell
npm install
```

Run locally:

```shell
npm run watch
```

Build (optional):

```shell
npm run build
```

## Contributors

- [Marc Espín Sanz](https://github.com/marc2332) `creator`
- [Erick Sosa(buttercubz)](https://github.com/buttercubz)

Contributions / suggestions are welcomed.
