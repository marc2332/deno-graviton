import { getDenoVersion, maybeDenoProject } from "./utils/handlers";
import { resolveImports, existManager } from "./utils/importsResolver";
import { velociraptor } from "./utils/velociraptorSupport";

async function entry({
  RunningConfig,
  StatusBarItem,
  Dialog,
  Notification,
  puffin: { element },
}) {
  const DenoVersion = await getDenoVersion();

  RunningConfig.data.envs.push({
    name: "Deno",
    async filter(dir: string) {
      let base = {};

      // * velociraptor support
      base = velociraptor(dir, base);

      // * notification to activate the plugin
      if (maybeDenoProject(dir)) {
        const notify = new Notification({
          title: "Deno",
          lifeTime: Infinity,
          content:
            "some files related to deno have been detected, do you want use deno?",
          buttons: [
            {
              label: "yes",
              action() {
                const diag = new Dialog({
                  title: "Deno",
                  content:
                    "this is a experimental deno lsp support, you need deno v1.6.0 or above",
                });
                diag.launch();
                // * close all
                setTimeout(() => {
                  diag.close();
                  notify.remove();
                }, 10000);

                RunningConfig.emit("registerLanguageServer", {
                  modes: ["javascript", "typescript"],
                  args: ["deno", "lsp"],
                });
              },
            },
            {
              label: "later",
              action() {
                notify.remove();
                // * do noting ignore
              },
            },
          ],
        });
      }

      if (existManager(dir)) {
        const DenoDeps = resolveImports(dir, Notification);
        base = { ...base, ...DenoDeps };
      }

      return base;
    },
  });

  const DenoErrors = [];

  const DenoStatusBarItem = new StatusBarItem({
    label: "Deno",
    hint: "Deno support",
    action: () => {
      if (DenoVersion) {
        if (DenoErrors.length === 0) {
          new Dialog({
            title: "Deno info",
            component() {
              return element`
								<div>
									Status:
									<ul>
										<li> Deno version: ${DenoVersion} </li>
									</ul>
								</div>
							`;
            },
          }).launch();
				}
				else {
          new Dialog({
            title: "Deno errors",
            component() {
              return element`
								<div>
									Errors:
									<ul>
										${DenoErrors.map(({ path, msg }) => {
                      return element`<li>Error: ${msg} found in ${path}</li>`;
                    })}
									</ul>
								</div>
							`;
            },
          }).launch();
        }
      } else {
        // * show deno error
        new Dialog({
          title: "Deno",
          content: "Deno is not installed",
        }).launch();
      }
    },
  });

  // * deno info support
  async function main(folderPath: string) {
    RunningConfig.on("removeFolderFromRunningWorkspace", ({ folderPath }) => {
      DenoErrors.find(({ path }, i) => {
        console.log(path, folderPath);
        if (path === folderPath) {
          DenoErrors.splice(i, 1);
        }
      });
      if (DenoErrors.length === 0) {
        DenoStatusBarItem.setLabel("Deno");
      }
    });
  }

  // * when loading workspace
  RunningConfig.on("addFolderToRunningWorkspace", ({ folderPath }) => {
    main(folderPath);
  });
}

export { entry };
