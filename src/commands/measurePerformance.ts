import { createSpinner } from 'nanospinner'
import { PackageManager, PerformanceStep } from '../types'
import { PerformanceResult } from '../interfaces'
import chalk from 'chalk'
import { runCommand } from './runCommand'
import fs from 'fs/promises'
import path from 'path'
import { ConfigManager } from './config'
import { logger } from './logger'
import { PERFORMANCE_STEPS } from '../constants'

export async function measurePerformance(
  packageManager: PackageManager,
): Promise<void> {
  const spinner = createSpinner('Measuring installation performance...').start()

  try {
    const result = await measureInstallationPerformance(packageManager)
    spinner.success({
      text: `Installation completed in ${result.total.toFixed(2)} seconds`,
    })

    logger.info(chalk.cyan('Performance breakdown:'))
    PERFORMANCE_STEPS.forEach((step) => {
      logger.info(
        chalk.cyan(`  ${step}: ${result.steps[step].toFixed(2)} seconds`),
      )
    })

    logger.info(
      chalk.cyan(
        `Peak memory usage: ${(result.memoryUsage / 1024 / 1024).toFixed(
          2,
        )} MB`,
      ),
    )

    const previousResults = await loadPreviousResults()
    await savePerformanceResult(result)

    if (previousResults.length > 0) {
      const avgTime =
        previousResults.reduce((sum, r) => sum + r.total, 0) /
        previousResults.length
      const comparison = ((result.total - avgTime) / avgTime) * 100
      logger.info(
        chalk.cyan(
          `Compared to average: ${
            comparison > 0 ? '+' : ''
          }${comparison.toFixed(2)}%`,
        ),
      )
    }

    const cacheInfo = await getCacheInfo(packageManager)
    logger.info(chalk.cyan(`Cache information: ${cacheInfo}`))

    if (result.total > 60) {
      logger.warn(
        chalk.yellow(
          'Tip: Consider using pnpm or bun for faster installations, or check for network issues.',
        ),
      )
    }
  } catch (error) {
    spinner.error({ text: 'Performance measurement failed' })
    if (error instanceof Error) {
      logger.error(chalk.red(`Error: ${error.message}`))
    }
  }
}

async function loadPreviousResults(): Promise<PerformanceResult[]> {
  const config = ConfigManager.getInstance().getConfig()
  try {
    const data = await fs.readFile(
      path.join(process.cwd(), config.performanceResultsFile),
      'utf8',
    )
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

async function savePerformanceResult(result: PerformanceResult): Promise<void> {
  const config = ConfigManager.getInstance().getConfig()
  const previousResults = await loadPreviousResults()
  previousResults.push({ ...result, timestamp: Date.now() })

  // Keep only the last N results
  const recentResults = previousResults.slice(-config.maxPerformanceResults)

  await fs.writeFile(
    path.join(process.cwd(), config.performanceResultsFile),
    JSON.stringify(recentResults, null, 2),
  )
}

async function getCacheInfo(packageManager: PackageManager): Promise<string> {
  try {
    switch (packageManager) {
      case 'npm':
        await runCommand(packageManager, 'cache verify')
        return 'NPM cache verified'
      case 'yarn':
        const cacheDir = await runCommand(packageManager, 'cache dir')
        return `Yarn cache directory: ${cacheDir}`
      case 'pnpm':
        const storeDir = await runCommand(packageManager, 'store path')
        return `PNPM store path: ${storeDir}`
      case 'bun':
        return 'Bun cache information not available'
      default:
        return 'Cache information not available for this package manager'
    }
  } catch (error) {
    if (error instanceof Error) {
      return `Error getting cache info: ${error.message}`
    }
    return 'Unknown error occurred while getting cache info'
  }
}

async function measureInstallationPerformance(
  packageManager: PackageManager,
): Promise<PerformanceResult> {
  const result: PerformanceResult = {
    total: 0,
    steps: {} as Record<PerformanceStep, number>,
    memoryUsage: 0,
    timestamp: Date.now(),
  }

  const startTime = performance.now()

  for (const step of PERFORMANCE_STEPS) {
    const stepStartTime = performance.now()
    await performStep(packageManager, step)
    result.steps[step] = (performance.now() - stepStartTime) / 1000
  }

  result.total = (performance.now() - startTime) / 1000
  result.memoryUsage = process.memoryUsage().heapUsed

  return result
}

async function performStep(
  packageManager: PackageManager,
  step: PerformanceStep,
): Promise<void> {
  const config = ConfigManager.getInstance().getConfig()
  const packageManagerConfig = config.packageManagers[packageManager]

  switch (step) {
    case 'cacheClean':
      if (packageManagerConfig.cacheCleanCommand) {
        await runCommand(packageManager, packageManagerConfig.cacheCleanCommand)
      }
      break
    case 'dependencyResolution':
      if (packageManagerConfig.resolutionCommand) {
        await runCommand(packageManager, packageManagerConfig.resolutionCommand)
      }
      break
    case 'packageInstallation':
      await runCommand(packageManager, 'install')
      break
    case 'cachedInstallation':
      await runCommand(packageManager, 'install')
      break
    default:
      throw new Error(`Unknown performance step: ${step}`)
  }
}
