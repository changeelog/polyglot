import fs from 'fs/promises'
import path from 'path'
import { Config } from '../interfaces'
import { DEFAULT_CONFIG } from '../constants'

export class ConfigManager {
  private static instance: ConfigManager
  private config: Config

  private constructor() {
    this.config = DEFAULT_CONFIG
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  public async loadConfig(
    configPath: string = '.polyglot-pm.json',
  ): Promise<void> {
    try {
      const configFile = await fs.readFile(
        path.join(process.cwd(), configPath),
        'utf-8',
      )
      const userConfig = JSON.parse(configFile)
      this.config = { ...this.config, ...userConfig }
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        error.code !== 'ENOENT'
      ) {
        throw error
      }
      // If file doesn't exist, use default config
    }
  }

  public getConfig(): Config {
    return this.config
  }

  public async saveConfig(
    configPath: string = '.polyglot-pm.json',
  ): Promise<void> {
    await fs.writeFile(
      path.join(process.cwd(), configPath),
      JSON.stringify(this.config, null, 2),
    )
  }

  public updateConfig(newConfig: Partial<Config>): void {
    this.config = { ...this.config, ...newConfig }
  }
}
