import fs from 'fs/promises'
import path from 'path'
import { PackageManager } from '../types'
import { ConfigManager } from './config'
import { logger } from './logger'

export async function detectPackageManager(): Promise<PackageManager> {
  const config = ConfigManager.getInstance().getConfig()
  const packageManagers = config.packageManagers

  for (const [manager, { lockFile }] of Object.entries(packageManagers)) {
    try {
      await fs.access(path.join(process.cwd(), lockFile))
      logger.info(`Detected package manager: ${manager}`)
      return manager as PackageManager
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code !== 'ENOENT'
      ) {
        logger.warn(
          `Unexpected error checking for ${lockFile}: ${error.message}`,
        )
      }
    }
  }

  logger.warn('No package manager detected, defaulting to npm')
  return 'npm'
}
