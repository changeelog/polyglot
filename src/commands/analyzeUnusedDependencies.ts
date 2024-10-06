import chalk from 'chalk'
import { execa } from 'execa'
import { createSpinner } from 'nanospinner'
import { PackageManager } from '../types'
import { logger } from './logger'
import { runCommand } from './runCommand'

export async function analyzeUnusedDependencies(
  packageManager: PackageManager,
): Promise<void> {
  const spinner = createSpinner('Analyzing unused dependencies...').start()

  try {
    let command: string
    let args: string[]

    if (packageManager === 'npm') {
      command = 'npx'
      args = ['depcheck']
    } else if (packageManager === 'pnpm') {
      command = 'pnpm'
      args = ['exec', 'depcheck']
    } else {
      command = packageManager
      args = ['dlx', 'depcheck']
    }

    const { stdout, stderr } = await execa(command, args, { reject: false })

    spinner.success({ text: 'Analysis complete' })

    const output = stdout || stderr

    if (output.includes('No depcheck issue')) {
      logger.info(chalk.green('No unused dependencies found.'))
    } else {
      const unusedDeps = output.match(
        /Unused dependencies\n([\s\S]*?)(\n\n|\n*$)/,
      )
      const unusedDevDeps = output.match(
        /Unused devDependencies\n([\s\S]*?)(\n\n|\n*$)/,
      )

      if (unusedDeps) {
        logger.warn(chalk.yellow('Unused dependencies:'))
        logger.warn(chalk.yellow(unusedDeps[1].trim()))
      }

      if (unusedDevDeps) {
        logger.warn(chalk.yellow('\nUnused devDependencies:'))
        logger.warn(chalk.yellow(unusedDevDeps[1].trim()))
      }

      logger.info(
        chalk.blue(
          '\nConsider removing these dependencies to optimize your project.',
        ),
      )
    }
  } catch (error) {
    spinner.error({ text: 'Failed to analyze dependencies' })
    if (error instanceof Error) {
      logger.error(chalk.red(`Error: ${error.message}`))
    } else {
      logger.error(chalk.red('An unknown error occurred'))
    }
    logger.warn(
      chalk.yellow(
        'Make sure you have depcheck installed globally or in your project.',
      ),
    )
    logger.warn(
      chalk.yellow('You can install it with: npm install -g depcheck'),
    )
  }
}
