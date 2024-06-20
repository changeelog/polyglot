import { createSpinner } from "nanospinner";
import { PackageManager } from "../types/types";
import chalk from "chalk";
import { runCommand } from "./runCommand";
import fs from "fs/promises";
import path from "path";

interface PerformanceResult {
  total: number;
  steps: { [key: string]: number };
  memoryUsage: number;
  timestamp: number;
}

const RESULTS_FILE = path.join(process.cwd(), ".polyglot-performance.json");

export async function measurePerformance(
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner(
    "Measuring installation performance..."
  ).start();

  try {
    const result = await measureInstallationPerformance(packageManager);
    spinner.success({
      text: `Installation completed in ${result.total.toFixed(2)} seconds`,
    });

    console.log(chalk.cyan("Performance breakdown:"));
    Object.entries(result.steps).forEach(([step, time]) => {
      console.log(chalk.cyan(`  ${step}: ${time.toFixed(2)} seconds`));
    });

    console.log(
      chalk.cyan(
        `Peak memory usage: ${(result.memoryUsage / 1024 / 1024).toFixed(2)} MB`
      )
    );

    const previousResults = await loadPreviousResults();
    await savePerfomanceResult(result);

    if (previousResults.length > 0) {
      const avgTime =
        previousResults.reduce((sum, r) => sum + r.total, 0) /
        previousResults.length;
      const comparison = ((result.total - avgTime) / avgTime) * 100;
      console.log(
        chalk.cyan(
          `Compared to average: ${
            comparison > 0 ? "+" : ""
          }${comparison.toFixed(2)}%`
        )
      );
    }

    const cacheInfo = await getCacheInfo(packageManager);
    console.log(chalk.cyan(`Cache information: ${cacheInfo}`));

    if (result.total > 60) {
      console.log(
        chalk.yellow(
          "Tip: Consider using pnpm or bun for faster installations, or check for network issues."
        )
      );
    }
  } catch (error) {
    spinner.error({ text: "Performance measurement failed" });
    if (error instanceof Error) {
      console.error(chalk.red(`Error: ${error.message}`));
    }
  }
}

async function loadPreviousResults(): Promise<PerformanceResult[]> {
  try {
    const data = await fs.readFile(RESULTS_FILE, "utf8");
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

async function savePerfomanceResult(result: PerformanceResult): Promise<void> {
  const previousResults = await loadPreviousResults();
  previousResults.push({ ...result, timestamp: Date.now() });

  // Keep only the last 10 results
  const recentResults = previousResults.slice(-10);

  await fs.writeFile(RESULTS_FILE, JSON.stringify(recentResults, null, 2));
}

async function getCacheInfo(packageManager: PackageManager): Promise<string> {
  try {
    switch (packageManager) {
      case "npm":
        await runCommand(packageManager, "cache verify");
        return "NPM cache verified";
      case "yarn":
        const cacheDir = await runCommand(packageManager, "cache dir");
        return `Yarn cache directory: ${cacheDir}`;
      case "pnpm":
        const storeDir = await runCommand(packageManager, "store path");
        return `PNPM store path: ${storeDir}`;
      case "bun":
        return "Bun cache information not available";
      default:
        return "Cache information not available for this package manager";
    }
  } catch (error) {
    if (error instanceof Error) {
      return `Error getting cache info: ${error.message}`;
    }
    return "Unknown error occurred while getting cache info";
  }
}

async function measureInstallationPerformance(
  packageManager: PackageManager
): Promise<PerformanceResult> {
  const result: PerformanceResult = {
    total: 0,
    steps: {},
    memoryUsage: 0,
    timestamp: Date.now(),
  };

  const startTime = performance.now();

  // Cache cleaning step (package manager specific)
  const cleanCacheStart = performance.now();
  switch (packageManager) {
    case "npm":
      await runCommand(packageManager, "cache clean --force");
      break;
    case "yarn":
      await runCommand(packageManager, "cache clean");
      break;
    case "pnpm":
    case "bun":
      console.log(
        chalk.yellow(`Cache cleaning not available for ${packageManager}`)
      );
      break;
  }
  result.steps["Cache cleaning"] = (performance.now() - cleanCacheStart) / 1000;

  // Measure dependency resolution (package manager specific)
  const resolutionStart = performance.now();
  switch (packageManager) {
    case "npm":
      await runCommand(packageManager, "install --package-lock-only");
      break;
    case "yarn":
      await runCommand(packageManager, "install --frozen-lockfile");
      break;
    case "pnpm":
      await runCommand(packageManager, "install --lockfile-only");
      break;
    case "bun":
      console.log(
        chalk.yellow("Dependency resolution step not available for Bun")
      );
      break;
  }
  result.steps["Dependency resolution"] =
    (performance.now() - resolutionStart) / 1000;

  // Measure actual installation
  const installationStart = performance.now();
  await runCommand(packageManager, "install");
  result.steps["Package installation"] =
    (performance.now() - installationStart) / 1000;

  // Measure subsequent installation (to check cache effectiveness)
  const cachedInstallStart = performance.now();
  await runCommand(packageManager, "install");
  result.steps["Cached installation"] =
    (performance.now() - cachedInstallStart) / 1000;

  result.total = (performance.now() - startTime) / 1000;
  result.memoryUsage = process.memoryUsage().heapUsed;

  return result;
}
