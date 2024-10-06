import { execa, Options } from 'execa'
import { PackageManager } from '../types'
import { ConfigManager } from './config'
import { logger } from './logger'

export async function runCommand(
  packageManager: PackageManager,
  command: string,
  args: string[] = [],
  options: Options = {},
): Promise<string> {
  const config = ConfigManager.getInstance().getConfig()
  const packageManagerConfig = config.packageManagers[packageManager]

  if (!packageManagerConfig) {
    throw new Error(`Unsupported package manager: ${packageManager}`)
  }

  const fullCommand = `${packageManagerConfig.command} ${command}`
  logger.debug(`Running command: ${fullCommand} ${args.join(' ')}`)

  try {
    const { stdout } = await execa(
      packageManagerConfig.command,
      [command, ...args],
      {
        stdio: 'pipe',
        ...options,
      },
    )

    if (stdout === undefined) {
      return ''
    }

    return stdout.toString()
  } catch (error) {
    if (error instanceof Error) {
      logger.error(`Error executing command: ${error.message}`)
      throw error
    }
    throw new Error('An unknown error occurred while executing the command')
  }
}
