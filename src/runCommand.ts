import chalk from "chalk";
import { PackageManager, PackageManagerConfig } from "../types/types";
import { execa } from "execa";

const packageManagers: Record<PackageManager, PackageManagerConfig> = {
  bun: { lockFile: "bun.lockb", command: "bun" },
  pnpm: { lockFile: "pnpm-lock.yaml", command: "pnpm" },
  npm: { lockFile: "package-lock.json", command: "npm" },
  yarn: { lockFile: "yarn.lock", command: "yarn" },
};

export async function runCommand(
  packageManager: PackageManager,
  command: string
): Promise<void> {
  const [cmd, ...args] = command.split(" ");

  try {
    await execa(packageManagers[packageManager].command, [cmd, ...args], {
      stdio: "inherit",
      shell: true,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`Error executing command: ${error.message}`));
    } else {
      console.error(
        chalk.red("An unknown error occurred while executing the command")
      );
    }
    process.exit(1);
  }
}
