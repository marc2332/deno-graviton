import { fileMatches } from "./handlers";
import { parse } from "yaml";
import fs from "fs-extra";
import path from "path";

export const velociraptor = (dir: string, base: any) => {
  fileMatches.forEach(async (file) => {
    const matchFile = path.join(dir, file);

    if (fs.existsSync(matchFile)) {
      const fileData = await fs.readFile(matchFile, "UTF-8");
      const fileJSON =
        file.includes("yaml") || file.includes("yml")
          ? await parse(fileData)
          : JSON.parse(fileData);

      base = { ...base, ...fileJSON };
    }
  });

  return base;
};
