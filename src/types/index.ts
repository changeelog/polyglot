export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'bun'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export type CommandFunction = (
  packageManager: PackageManager,
  ...args: any[]
) => Promise<void>

export type PerformanceStep =
  | 'cacheClean'
  | 'dependencyResolution'
  | 'packageInstallation'
  | 'cachedInstallation'
