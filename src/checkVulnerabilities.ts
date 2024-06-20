import chalk from "chalk";
import { execa } from "execa";
import { createSpinner } from "nanospinner";
import type { PackageManager } from "../types/types";

export async function checkVulnerabilities(
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner("Checking for vulnerabilities...").start();
  try {
    if (packageManager === "npm") {
      await execa("npm", ["audit"]);
    } else if (packageManager === "yarn") {
      await execa("yarn", ["audit"]);
    } else if (packageManager === "pnpm") {
      await execa("pnpm", ["audit"]);
    } else if (packageManager === "bun") {
      console.log(
        chalk.yellow("Vulnerability checking is not yet supported for Bun.")
      );
      return;
    }
    spinner.success({ text: "Vulnerability check complete" });
  } catch (error) {
    spinner.error({ text: "Vulnerability check failed" });
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
  }
}
