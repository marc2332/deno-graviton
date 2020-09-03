import { getDenoVersion, TsInfo, maybeDenoProject } from "./utils/handlers";
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
      let base = {
        DenoVersion: {
          value: `Deno v${DenoVersion}`,
        },
      };

      // * velociraptor support
      base = velociraptor(dir, base);

      const { pluginInstalled } = await TsInfo(dir);

      // * notification to activate the plugin
      if (maybeDenoProject(dir) && !pluginInstalled) {
        new Notification({
          title: "Deno",
          content:
            "some files related to deno have been detected, do you want to activate the plugin?",
          buttons: [
            {
              label: "activate",
              action() {
                new Dialog({
                  title: "tip",
                  content: "remember install typescript-deno-plugin",
                }).launch();
              },
            },
            {
              label: "later",
              action() {
                new Dialog({
                  title: "deno",
                  content: "ignored",
                }).launch();
              },
            },
          ],
        });
      }

      if (existManager(dir)) {
        const depsInfo = resolveImports(dir, Notification);
        base = { ...base, ...depsInfo };
      }

      console.log(base);
      return base;
    },
  });

  const DenoErrors = [];

  // * deno info support
  async function main(folderPath: string) {
    const { tsconfigOk, denoTsconfigFile, msg, pluginInstalled } = await TsInfo(
      folderPath
    );

    // * if deno is installed
    if (DenoVersion) {
      // * if typescript-deno-plugin is installed
      if (pluginInstalled) {
        const allOk = denoTsconfigFile && tsconfigOk;

        // * show deno info
        if (allOk && !DenoErrors.length) {
          new StatusBarItem({
            label: "Deno",
            hint: `Deno ${DenoVersion}`,
            action() {
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
            },
          });
        }

        // * show deno errors
        else {
          DenoErrors.push({
            msg,
          });
          new StatusBarItem({
            label: "Deno Error",
            hint: "☹",
            important: true,
            action() {
              new Dialog({
                title: "Deno errors",
                component() {
                  return element`
                              <div>
                                Errors:
                                <ul>
                                  ${DenoErrors.map(({ msg }) => {
                                    return element`<li>${msg}</li>`;
                                  })}
                                </ul>
                              </div>
                            `;
                },
              }).launch();
            },
          });
        }
      }
    }

    // * if deno is not installed
    else if (!DenoVersion && pluginInstalled) {
      new StatusBarItem({
        label: "Deno Error",
        hint: "Deno is not installed",
        important: true,
        action() {
          new Dialog({
            title: "Deno",
            content: "Deno is not installed",
          }).launch();
        },
      });
    }
  }

  // * when loading workspace
  RunningConfig.on("addFolderToRunningWorkspace", ({ folderPath }) => {
    main(folderPath);
  });
}

export { entry };
