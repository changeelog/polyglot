import chalk from "chalk";
import fs from "fs/promises";
import inquirer from "inquirer";

export async function generateCIConfig(): Promise<void> {
  try {
    const { ci, nodeVersion } = await inquirer.prompt([
      {
        type: "list",
        name: "ci",
        message:
          "Which CI/CD platform would you like to generate a config for?",
        choices: ["GitHub Actions", "GitLab CI", "CircleCI", "Travis CI"],
      },
      {
        type: "input",
        name: "nodeVersion",
        message: "Which Node.js version would you like to use?",
        default: "18",
      },
    ]);

    let config = "";
    let filename = "";

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
        node-version: '${nodeVersion}'
    - run: npm ci
    - run: npm run build --if-present
    - run: npm test
`;
        filename = ".github/workflows/ci.yml";
        break;
      case "GitLab CI":
        config = `
image: node:${nodeVersion}

stages:
  - build
  - test

cache:
  paths:
    - node_modules/

install_dependencies:
  stage: build
  script:
    - npm ci

test:
  stage: test
  script:
    - npm run build --if-present
    - npm test
`;
        filename = ".gitlab-ci.yml";
        break;
      case "CircleCI":
        config = `
version: 2.1
jobs:
  build:
    docker:
      - image: cimg/node:${nodeVersion}
    steps:
      - checkout
      - run: npm ci
      - run: npm run build --if-present
      - run: npm test
`;
        filename = ".circleci/config.yml";
        break;
      case "Travis CI":
        config = `
language: node_js
node_js:
  - "${nodeVersion}"
script:
  - npm ci
  - npm run build --if-present
  - npm test
`;
        filename = ".travis.yml";
        break;
    }

    await fs.mkdir(filename.split("/").slice(0, -1).join("/"), {
      recursive: true,
    });
    await fs.writeFile(filename, config.trim());
    console.log(
      chalk.green(
        `${ci} configuration file created successfully at ${filename}!`
      )
    );
  } catch (error) {
    console.error(
      chalk.red(
        `Error generating CI config: ${
          error instanceof Error ? error.message : String(error)
        }`
      )
    );
  }
}
