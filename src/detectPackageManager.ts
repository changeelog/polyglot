import fs from "fs/promises";
import path from "path";
import type { PackageManager, PackageManagerConfig } from "../types/types";

const packageManagers: Record<PackageManager, PackageManagerConfig> = {
  bun: { lockFile: "bun.lockb", command: "bun" },
  pnpm: { lockFile: "pnpm-lock.yaml", command: "pnpm" },
  npm: { lockFile: "package-lock.json", command: "npm" },
  yarn: { lockFile: "yarn.lock", command: "yarn" },
};

export async function detectPackageManager(): Promise<PackageManager> {
  for (const [manager, config] of Object.entries(packageManagers)) {
    try {
      await fs.access(path.join(process.cwd(), config.lockFile));
      return manager as PackageManager;
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ("code" in error && error.code !== "ENOENT") {
          console.warn(
            `Unexpected error checking for ${config.lockFile}: ${error.message}`
          );
        }
      } else {
        console.warn(
          `Unexpected non-Error object thrown when checking for ${config.lockFile}`
        );
      }
    }
  }
  return "npm"; // Default to npm if no lockfile is found
}
