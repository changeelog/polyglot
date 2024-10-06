import chalk from 'chalk'
import inquirer from 'inquirer'
import fs from 'fs/promises'
import semver from 'semver'
import path from 'path'
import { execaCommand } from 'execa'
import { logger } from './logger'

export async function updateProjectVersion(): Promise<void> {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'))
    const currentVersion = packageJson.version

    if (!currentVersion) {
      throw new Error('No version found in package.json')
    }

    const { versionIncrement } = await inquirer.prompt([
      {
        type: 'list',
        name: 'versionIncrement',
        message: `Current version is ${currentVersion}. How would you like to increment it?`,
        choices: [
          { name: 'Patch', value: 'patch' },
          { name: 'Minor', value: 'minor' },
          { name: 'Major', value: 'major' },
          { name: 'Custom', value: 'custom' },
        ],
      },
    ])

    let newVersion: string
    if (versionIncrement === 'custom') {
      const { customVersion } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customVersion',
          message: 'Enter custom version:',
          validate: (input: string) =>
            semver.valid(input)
              ? true
              : 'Please enter a valid semantic version',
        },
      ])
      newVersion = customVersion
    } else {
      newVersion =
        semver.inc(currentVersion, versionIncrement as semver.ReleaseType) ||
        currentVersion
    }

    packageJson.version = newVersion
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2))
    logger.info(chalk.green(`Version updated to ${newVersion}`))

    const { createTag } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createTag',
        message: 'Do you want to create a git tag for this version?',
        default: true,
      },
    ])

    if (createTag) {
      try {
        await execaCommand('git add package.json')
        await execaCommand(`git commit -m "Bump version to ${newVersion}"`)
        await execaCommand(
          `git tag -a v${newVersion} -m "Version ${newVersion}"`,
        )
        logger.info(chalk.green(`Git tag v${newVersion} created`))
      } catch (error) {
        logger.error(chalk.red('Failed to create git tag'))
        if (error instanceof Error) {
          logger.error(error.message)
        }
      }
    }
  } catch (error) {
    logger.error(chalk.red('Failed to update project version'))
    if (error instanceof Error) {
      logger.error(error.message)
    }
  }
}
