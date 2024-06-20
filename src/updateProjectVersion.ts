import chalk from "chalk";
import { execa } from "execa";
import inquirer from "inquirer";
import fs from "fs/promises";

export async function updateProjectVersion(): Promise<void> {
  const packageJson = JSON.parse(await fs.readFile("package.json", "utf-8"));
  const currentVersion = packageJson.version;

  const { newVersion } = await inquirer.prompt([
    {
      type: "input",
      name: "newVersion",
      message: `Current version is ${currentVersion}. Enter new version:`,
      default: currentVersion,
    },
  ]);

  packageJson.version = newVersion;
  await fs.writeFile("package.json", JSON.stringify(packageJson, null, 2));
  console.log(chalk.green(`Version updated to ${newVersion}`));

  const { createTag } = await inquirer.prompt([
    {
      type: "confirm",
      name: "createTag",
      message: "Do you want to create a git tag for this version?",
      default: true,
    },
  ]);

  if (createTag) {
    try {
      await execa("git", [
        "tag",
        `-a`,
        `v${newVersion}`,
        `-m`,
        `Version ${newVersion}`,
      ]);
      console.log(chalk.green(`Git tag v${newVersion} created`));
    } catch (error) {
      console.error(chalk.red("Failed to create git tag"));
      if (error instanceof Error) {
        console.error(error.message);
      }
    }
  }
}