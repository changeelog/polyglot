import chalk from "chalk";
import { execa } from "execa";
import { createSpinner } from "nanospinner";
import type { PackageManager } from "../types/types";

export async function analyzeUnusedDependencies(
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner("Analyzing unused dependencies...").start();
  try {
    const { stdout } = await execa("npx", ["depcheck"]);
    spinner.success({ text: "Analysis complete" });
    console.log(chalk.green(stdout));
  } catch (error) {
    spinner.error({ text: "Failed to analyze dependencies" });
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
  }
}
