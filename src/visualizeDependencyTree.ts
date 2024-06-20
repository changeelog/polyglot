import path from "path";
import fs from "fs/promises";
import dependencyTree from "dependency-tree";
import chalk from "chalk";
import { createSpinner } from "nanospinner";

type PackageManager = "npm" | "yarn" | "pnpm" | "bun";

interface DependencyNode {
  [key: string]: DependencyNode | null;
}

export async function visualizeDependencyTree(
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner("Analyzing dependency tree...").start();

  try {
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf-8"));
    const entryFile = packageJson.main || "index.js";

    const tree = dependencyTree({
      filename: path.join(process.cwd(), entryFile),
      directory: process.cwd(),
      filter: (path) => path.indexOf("node_modules") === -1,
    }) as DependencyNode;

    spinner.success({ text: "Dependency tree analysis complete" });

    console.log(chalk.cyan("\nDependency Tree:"));
    const rootName = path.basename(process.cwd());
    console.log(chalk.white(formatTree(rootName, tree)));
  } catch (error) {
    spinner.error({ text: "Failed to analyze dependency tree" });
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
}

function formatTree(
  rootName: string,
  tree: DependencyNode,
  prefix: string = ""
): string {
  let output = `${prefix}${rootName}\n`;
  const entries = Object.entries(tree);

  entries.forEach(([key, value], index) => {
    const isLast = index === entries.length - 1;
    const newPrefix = prefix + (isLast ? "└── " : "├── ");
    const continuationPrefix = prefix + (isLast ? "    " : "│   ");

    const packageName = path.basename(key);
    output += newPrefix + packageName + "\n";

    if (value !== null && typeof value === "object") {
      output += formatTree(packageName, value, continuationPrefix);
    }
  });

  return output;
}
