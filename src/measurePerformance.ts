import { createSpinner } from "nanospinner";
import { PackageManager } from "../types/types";
import chalk from "chalk";
import { runCommand } from "./runCommand";

export async function measurePerformance(
  packageManager: PackageManager
): Promise<void> {
  const spinner = createSpinner(
    "Measuring installation performance..."
  ).start();
  const startTime = Date.now();

  try {
    await runCommand(packageManager, "install");
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    spinner.success({
      text: `Installation completed in ${duration.toFixed(2)} seconds`,
    });

    if (duration > 60) {
      console.log(
        chalk.yellow(
          "Tip: Consider using pnpm for faster installations, or check for network issues."
        )
      );
    }
  } catch (error) {
    spinner.error({ text: "Performance measurement failed" });
    if (error instanceof Error) {
      console.error(chalk.red(error.message));
    }
  }
}
