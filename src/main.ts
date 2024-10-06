#!/usr/bin/env node

import chalk from 'chalk'
import inquirer from 'inquirer'

import { measurePerformance } from './commands/measurePerformance'
import { checkLicenseCompliance } from './commands/checkLicenseCompliance'
import { detectPackageManager } from './commands/detectPackageManager'
import { generateCIConfig } from './commands/generateCIConfig'
import { analyzeUnusedDependencies } from './commands/analyzeUnusedDependencies'
import { updateProjectVersion } from './commands/updateProjectVersion'
import { runCommand } from './commands/runCommand'
import { PackageManager } from './types'
import { logger } from './commands/logger'
import { ConfigManager } from './commands/config'

async function interactiveMode(packageManager: PackageManager): Promise<void> {
  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'What would you like to do?',
      choices: [
        'Install dependencies',
        'Check license compliance',
        'Update dependencies',
        'Analyze unused dependencies',
        'Check for vulnerabilities',
        'Generate CI/CD config',
        'Measure installation performance',
        'Update project version',
        'Visualize dependency tree',
        'Exit',
      ],
    },
  ])

  switch (action) {
    case 'Install dependencies':
      await runCommand(packageManager, 'install')
      break
    case 'Check license compliance':
      await checkLicenseCompliance(packageManager)
      break
    case 'Analyze unused dependencies':
      await analyzeUnusedDependencies(packageManager)
      break
    case 'Generate CI/CD config':
      await generateCIConfig(packageManager)
      break
    case 'Measure installation performance':
      await measurePerformance(packageManager)
      break
    case 'Update project version':
      await updateProjectVersion()
      break
    case 'Exit':
      logger.info(chalk.blue('Goodbye!'))
      process.exit(0)
  }

  // After completing the action, return to the menu
  await interactiveMode(packageManager)
}

async function main() {
  try {
    await ConfigManager.getInstance().loadConfig()
    const packageManager = await detectPackageManager()
    logger.info(chalk.blue(`Detected package manager: ${packageManager}`))

    const args = process.argv.slice(2)

    if (args.length === 0) {
      // If no arguments provided, start interactive mode
      await interactiveMode(packageManager)
    } else {
      const command = args.join(' ')
      await runCommand(packageManager, command)
    }
  } catch (error) {
    if (error instanceof Error) {
      logger.error(chalk.red(`An error occurred: ${error.message}`))
    } else {
      logger.error(chalk.red('An unknown error occurred'))
    }
    process.exit(1)
  }
}

main()
