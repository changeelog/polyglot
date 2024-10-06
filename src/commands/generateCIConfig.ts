import chalk from 'chalk'
import fs from 'fs/promises'
import inquirer from 'inquirer'
import path from 'path'
import { PackageManager } from '../types'
import { ConfigManager } from './config'
import { logger } from './logger'

export async function generateCIConfig(
  packageManager: PackageManager,
): Promise<void> {
  try {
    const { ci, nodeVersion } = await inquirer.prompt([
      {
        type: 'list',
        name: 'ci',
        message:
          'Which CI/CD platform would you like to generate a config for?',
        choices: ['GitHub Actions', 'GitLab CI', 'CircleCI', 'Travis CI'],
      },
      {
        type: 'input',
        name: 'nodeVersion',
        message: 'Which Node.js version would you like to use?',
        default: '18',
      },
    ])

    const config = ConfigManager.getInstance().getConfig()
    let ciConfig = config.ciConfigTemplates[ci]

    if (!ciConfig) {
      throw new Error(`No template found for ${ci}`)
    }

    ciConfig = ciConfig.replace(/{{nodeVersion}}/g, nodeVersion)
    ciConfig = ciConfig.replace(/{{packageManager}}/g, packageManager)

    let filename: string
    switch (ci) {
      case 'GitHub Actions':
        filename = '.github/workflows/ci.yml'
        break
      case 'GitLab CI':
        filename = '.gitlab-ci.yml'
        break
      case 'CircleCI':
        filename = '.circleci/config.yml'
        break
      case 'Travis CI':
        filename = '.travis.yml'
        break
      default:
        throw new Error(`Unsupported CI platform: ${ci}`)
    }

    const fullPath = path.join(process.cwd(), filename)
    await fs.mkdir(path.dirname(fullPath), { recursive: true })
    await fs.writeFile(fullPath, ciConfig)

    logger.info(
      chalk.green(
        `${ci} configuration file created successfully at ${filename}!`,
      ),
    )
  } catch (error) {
    if (error instanceof Error) {
      logger.error(chalk.red(`Error generating CI config: ${error.message}`))
    } else {
      logger.error(
        chalk.red('An unknown error occurred while generating CI config'),
      )
    }
  }
}
