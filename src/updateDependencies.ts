import chalk from "chalk";
import { execa } from "execa";
import { createSpinner } from "nanospinner";
import type { PackageManager } from "../types/types";

export async function updateDependencies(
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner("Updating dependencies...").start();
  try {
    if (packageManager === "npm") {
      await execa("npm", ["update"]);
    } else if (packageManager === "yarn") {
      await execa("yarn", ["upgrade"]);
    } else if (packageManager === "pnpm") {
      await execa("pnpm", ["update"]);
    } else if (packageManager === "bun") {
      await execa("bun", ["update"]);
    }
    spinner.success({ text: "Dependencies updated successfully!" });
  } catch (error) {
    spinner.error({ text: "Failed to update dependencies" });
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
  }
}
