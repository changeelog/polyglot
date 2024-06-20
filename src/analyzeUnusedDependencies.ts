import chalk from "chalk";
import { execa } from "execa";
import { createSpinner } from "nanospinner";
import type { PackageManager } from "../types/types";

export async function analyzeUnusedDependencies(
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner("Analyzing unused dependencies...").start();

  try {
    let command: string;
    let args: string[];

    if (packageManager === "npm") {
      command = "npx";
      args = ["depcheck"];
    } else if (packageManager === "pnpm") {
      command = "pnpm";
      args = ["exec", "depcheck"];
    } else {
      command = packageManager;
      args = ["dlx", "depcheck"];
    }

    const { stdout, stderr } = await execa(command, args, { reject: false });

    spinner.success({ text: "Analysis complete" });

    // Process output even if the command "failed"
    const output = stdout || stderr;

    if (output.includes("No depcheck issue")) {
      console.log(chalk.green("No unused dependencies found."));
    } else {
      const unusedDeps = output.match(
        /Unused dependencies\n([\s\S]*?)(\n\n|\n*$)/
      );
      const unusedDevDeps = output.match(
        /Unused devDependencies\n([\s\S]*?)(\n\n|\n*$)/
      );

      if (unusedDeps) {
        console.log(chalk.yellow("Unused dependencies:"));
        console.log(chalk.yellow(unusedDeps[1].trim()));
      }

      if (unusedDevDeps) {
        console.log(chalk.yellow("\nUnused devDependencies:"));
        console.log(chalk.yellow(unusedDevDeps[1].trim()));
      }

      console.log(
        chalk.blue(
          "\nConsider removing these dependencies to optimize your project."
        )
      );
    }
  } catch (error) {
    spinner.error({ text: "Failed to analyze dependencies" });
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    } else {
      console.error(chalk.red("An unknown error occurred"));
    }
    console.log(
      chalk.yellow(
        "Make sure you have depcheck installed globally or in your project."
      )
    );
    console.log(
      chalk.yellow("You can install it with: npm install -g depcheck")
    );
  }
}
