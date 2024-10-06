import path from 'path'
import fs from 'fs/promises'
import licenseChecker from 'license-checker'
import chalk from 'chalk'
import { createSpinner } from 'nanospinner'
import { promisify } from 'util'
import { PackageManager } from '../types'
import { logger } from './logger'

const checkLicenses = promisify(licenseChecker.init)

interface LicenseInfo {
  licenses: string
  repository: string
  publisher: string
  email: string
  path: string
  licenseFile: string
}

const APPROVED_LICENSES = [
  'MIT',
  'Apache-2.0',
  'BSD-3-Clause',
  'BSD-2-Clause',
  'ISC',
  '0BSD',
  'CC0-1.0',
]

export async function checkLicenseCompliance(
  packageManager: PackageManager,
): Promise<void> {
  const spinner = createSpinner('Checking license compliance...').start()

  try {
    const projectDir = process.cwd()
    const licenseInfo = (await checkLicenses({
      start: projectDir,
      production: true,
      summary: true,
      excludePrivatePackages: true,
    })) as Record<string, LicenseInfo>

    const { compliant, nonCompliant } = analyzeLicenses(licenseInfo)

    spinner.success({ text: 'License compliance check complete' })

    if (nonCompliant.length === 0) {
      logger.info(chalk.green('\nAll dependencies have approved licenses.'))
    } else {
      logger.warn(
        chalk.yellow('\nSome dependencies have non-approved licenses:'),
      )
      nonCompliant.forEach(({ name, license }) => {
        logger.warn(chalk.red(`  - ${name}: ${license}`))
      })
    }

    logger.info(chalk.cyan('\nLicense summary:'))
    logger.info(
      chalk.white(
        `  Total packages: ${compliant.length + nonCompliant.length}`,
      ),
    )
    logger.info(chalk.green(`  Compliant: ${compliant.length}`))
    logger.info(chalk.red(`  Non-compliant: ${nonCompliant.length}`))

    await generateLicenseReport(compliant, nonCompliant)
  } catch (error) {
    spinner.error({ text: 'Failed to check license compliance' })
    if (error instanceof Error) {
      logger.error(chalk.red(`Error: ${error.message}`))
    }
  }
}

function analyzeLicenses(licenseInfo: Record<string, LicenseInfo>): {
  compliant: { name: string; license: string }[]
  nonCompliant: { name: string; license: string }[]
} {
  const compliant: { name: string; license: string }[] = []
  const nonCompliant: { name: string; license: string }[] = []

  Object.entries(licenseInfo).forEach(([name, info]) => {
    const licenses = info.licenses.split(';')
    const isCompliant = licenses.some((license) =>
      APPROVED_LICENSES.includes(license.trim()),
    )

    if (isCompliant) {
      compliant.push({ name, license: info.licenses })
    } else {
      nonCompliant.push({ name, license: info.licenses })
    }
  })

  return { compliant, nonCompliant }
}

async function generateLicenseReport(
  compliant: { name: string; license: string }[],
  nonCompliant: { name: string; license: string }[],
): Promise<void> {
  const reportPath = path.join(process.cwd(), 'license-compliance-report.md')
  let report = '# License Compliance Report\n\n'

  report += '## Compliant Dependencies\n\n'
  compliant.forEach(({ name, license }) => {
    report += `- ${name}: ${license}\n`
  })

  report += '\n## Non-Compliant Dependencies\n\n'
  nonCompliant.forEach(({ name, license }) => {
    report += `- ${name}: ${license}\n`
  })

  report += '\n## Summary\n\n'
  report += `- Total packages: ${compliant.length + nonCompliant.length}\n`
  report += `- Compliant: ${compliant.length}\n`
  report += `- Non-compliant: ${nonCompliant.length}\n`

  await fs.writeFile(reportPath, report)
  logger.info(
    chalk.green(`\nLicense compliance report generated: ${reportPath}`),
  )
}
