import { execaCommand } from 'execa'
import fs from 'fs/promises'
import path from 'path'
import lighthouse from 'lighthouse'
// TODO: don't mess with chrome-launcher
import * as chromeLauncher from 'chrome-launcher'
import { PackageManager } from '../types'
import { logger } from './logger'

interface PerformanceMetrics {
  buildTime: number
  bundleSize: number
  loadTime: number
  lighthouseScore: number
}

export async function analyzeProjectPerformance(
  packageManager: PackageManager,
): Promise<void> {
  logger.info('Starting project performance analysis...')

  const metrics = await collectMetrics(packageManager)
  displayMetrics(metrics)
  provideRecommendations(metrics)
}

async function collectMetrics(
  packageManager: PackageManager,
): Promise<PerformanceMetrics> {
  const buildTime = await measureBuildTime(packageManager)
  const bundleSize = await measureBundleSize()
  const { loadTime, lighthouseScore } = await runLighthouseAnalysis()

  return { buildTime, bundleSize, loadTime, lighthouseScore }
}

async function measureBuildTime(
  packageManager: PackageManager,
): Promise<number> {
  const startTime = Date.now()
  await execaCommand(`${packageManager} run build`)
  return (Date.now() - startTime) / 1000 // in secs
}

async function measureBundleSize(): Promise<number> {
  const buildDir = path.join(process.cwd(), 'dist') // assume build is in dist folder
  const files = await fs.readdir(buildDir)
  let totalSize = 0

  for (const file of files) {
    const stats = await fs.stat(path.join(buildDir, file))
    totalSize += stats.size
  }

  return totalSize / (1024 * 1024) // in MB
}

async function runLighthouseAnalysis(): Promise<{
  loadTime: number
  lighthouseScore: number
}> {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] })
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  }

  const runnerResult = await lighthouse('http://localhost:3000', options)
  await chrome.kill()

  const reportJson = JSON.parse(runnerResult.report)
  const loadTime = reportJson.audits['interactive'].numericValue / 1000 // in seconds
  const lighthouseScore = reportJson.categories.performance.score * 100

  return { loadTime, lighthouseScore }
}

function displayMetrics(metrics: PerformanceMetrics): void {
  logger.info('Performance Metrics:')
  logger.info(`Build Time: ${metrics.buildTime.toFixed(2)} seconds`)
  logger.info(`Bundle Size: ${metrics.bundleSize.toFixed(2)} MB`)
  logger.info(`Load Time: ${metrics.loadTime.toFixed(2)} seconds`)
  logger.info(
    `Lighthouse Performance Score: ${metrics.lighthouseScore.toFixed(0)}/100`,
  )
}

function provideRecommendations(metrics: PerformanceMetrics): void {
  logger.info('\nRecommendations:')

  if (metrics.buildTime > 60) {
    logger.warn(
      '- Consider optimizing your build process to reduce build time.',
    )
  }

  if (metrics.bundleSize > 5) {
    logger.warn(
      '- Your bundle size is large. Consider code splitting or removing unused dependencies.',
    )
  }

  if (metrics.loadTime > 3) {
    logger.warn(
      "- Improve your app's load time by optimizing assets and using lazy loading.",
    )
  }

  if (metrics.lighthouseScore < 90) {
    logger.warn(
      '- Work on improving your Lighthouse score by following their recommendations.',
    )
  }
}
