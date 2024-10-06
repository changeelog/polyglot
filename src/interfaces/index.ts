import { PackageManager, LogLevel, PerformanceStep } from '../types'

export interface PackageManagerConfig {
  lockFile: string
  command: string
  cacheCleanCommand?: string
  resolutionCommand?: string
}

export interface PerformanceResult {
  total: number
  steps: Record<PerformanceStep, number>
  memoryUsage: number
  timestamp: number
}

export interface Logger {
  log: (level: LogLevel, message: string) => void
  debug: (message: string) => void
  info: (message: string) => void
  warn: (message: string) => void
  error: (message: string) => void
}

export interface Config {
  packageManagers: Record<PackageManager, PackageManagerConfig>
  performanceResultsFile: string
  maxPerformanceResults: number
  ciConfigTemplates: Record<string, string>
}
