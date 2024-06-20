#!/usr/bin/env node

import chalk from "chalk";
import inquirer from "inquirer";

import { measurePerformance } from "./measurePerformance";
import { checkLicenseCompliance } from "./checkLicenseCompliance";
import { detectPackageManager } from "./detectPackageManager";
import { generateCIConfig } from "./generateCIConfig";
import { checkVulnerabilities } from "./checkVulnerabilities";
import { updateDependencies } from "./updateDependencies";
import { analyzeUnusedDependencies } from "./analyzeUnusedDependencies";
import { updateProjectVersion } from "./updateProjectVersion";
import { runCommand } from "./runCommand";
import { visualizeDependencyTree } from "./visualizeDependencyTree";

type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

interface PackageManagerConfig {
  lockFile: string;
  command: string;
}

const packageManagers: Record<PackageManager, PackageManagerConfig> = {
  bun: { lockFile: "bun.lockb", command: "bun" },
  pnpm: { lockFile: "pnpm-lock.yaml", command: "pnpm" },
  npm: { lockFile: "package-lock.json", command: "npm" },
  yarn: { lockFile: "yarn.lock", command: "yarn" },
};

async function interactiveMode(packageManager: PackageManager): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: "list",
      name: "action",
      message: "What would you like to do?",
      choices: [
        "Install dependencies",
        "Check license compliance",
        "Update dependencies",
        "Analyze unused dependencies",
        "Check for vulnerabilities",
        "Generate CI/CD config",
        "Measure installation performance",
        "Update project version",
        "Visualize dependency tree",
        "Exit",
      ],
    },
  ]);

  switch (action) {
    case "Install dependencies":
      await runCommand(packageManager, "install");
      break;
    case "Check license compliance":
      await checkLicenseCompliance(packageManager);
      break;
    case "Update dependencies":
      await updateDependencies(packageManager);
      break;
    case "Analyze unused dependencies":
      await analyzeUnusedDependencies(packageManager);
      break;
    case "Check for vulnerabilities":
      await checkVulnerabilities(packageManager);
      break;
    case "Generate CI/CD config":
      await generateCIConfig();
      break;
    case "Measure installation performance":
      await measurePerformance(packageManager);
      break;
    case "Update project version":
      await updateProjectVersion();
      break;
    case "Visualize dependency tree":
      await visualizeDependencyTree(packageManager);
      break;
    case "Exit":
      console.log(chalk.blue("Goodbye!"));
      process.exit(0);
  }

  // After completing the action, return to the menu
  await interactiveMode(packageManager);
}

async function main() {
  const packageManager = await detectPackageManager();
  console.log(chalk.blue(`Detected package manager: ${packageManager}`));

  const args = process.argv.slice(2);

  if (args.length === 0) {
    // If no arguments provided, start interactive mode
    await interactiveMode(packageManager);
  } else {
    const command = args.join(" ");
    await runCommand(packageManager, command);
  }
}

main().catch((error) => {
  if (error instanceof Error) {
    console.error(chalk.red(`An error occurred: ${error.message}`));
  } else {
    console.error(chalk.red("An unknown error occurred"));
  }
  process.exit(1);
});
