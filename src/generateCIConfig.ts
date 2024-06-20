import chalk from "chalk";
import fs from "fs/promises";
import inquirer from "inquirer";

export async function generateCIConfig(): Promise<void> {
  const { ci } = await inquirer.prompt([
    {
      type: "list",
      name: "ci",
      message: "Which CI/CD platform would you like to generate a config for?",
      choices: ["GitHub Actions", "GitLab CI", "CircleCI", "Travis CI"],
    },
  ]);

  let config = "";
  switch (ci) {
    case "GitHub Actions":
      config = `
name: CI

on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v2
    - name: Use Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '14'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test
`;
      break;
    // configurations for other CI platforms later
  }

  await fs.writeFile(`.${ci.toLowerCase().replace(" ", "-")}.yml`, config);
  console.log(chalk.green(`${ci} configuration file created successfully!`));
}
