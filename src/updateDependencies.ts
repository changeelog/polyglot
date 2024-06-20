import chalk from "chalk";
import { execa } from "execa";
import { createSpinner } from "nanospinner";
import type { PackageManager } from "../types/types";

export async function updateDependencies(
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner("Updating dependencies...").start();
  try {
    switch (packageManager) {
      case "npm":
        await execa("npm", ["update"]);
        break;
      case "yarn":
        await execa("yarn", ["upgrade"]);
        break;
      case "pnpm":
        await execa("pnpm", ["update"]);
        break;
      case "bun":
        await execa("bun", ["update"]);
        break;
      default:
        throw new Error(`Unsupported package manager: ${packageManager}`);
    }
    spinner.success({ text: "Dependencies updated successfully!" });
  } catch (error) {
    spinner.error({ text: "Failed to update dependencies" });
    const { message, stderr } = error as { message: string; stderr: string };
    console.error(chalk.red("Error message:", message));
    if (stderr) {
      console.error(chalk.red("Error details:", stderr));
    }
  }
}
