import fs from 'fs';
import path from 'path';
import { addLocalPackageData } from 'license-report/lib/addLocalPackageData.js';

/**
 * Parses license strings that may contain multiple licenses separated by OR, AND, etc.
 * Examples: "(BSD-3-Clause OR GPL-2.0)", "MIT OR Apache-2.0", "ISC"
 * @param {string} licenseString - The license string to parse
 * @returns {Array<string>} - Array of individual licenses
 */
const parsePossibleLicenses = (licenseString) => {
    if (!licenseString || licenseString === 'n/a') {
        return [];
    }

    // Remove parentheses and normalize
    let normalized = licenseString.replace(/[()]/g, '').trim();
    
    // Split by common separators (OR, AND, |, &, +)
    // Use regex to split on various separators while preserving license names
    const separators = /\s+(?:OR|AND|\||\&|\+)\s+/i;
    const licenses = normalized.split(separators)
        .map(license => license.trim())
        .filter(license => license.length > 0);
    
    // If no separators found, return the original license as single item
    if (licenses.length === 0) {
        return [licenseString.trim()];
    }
    
    return licenses;
};

/**
 * Extracts license text from common license file names in a package directory
 * @param {string} packagePath - Path to the package directory
 * @returns {string} - The license text or 'n/a' if not found
 */
const extractLicenseText = (packagePath) => {
    const commonLicenseFiles = [
        'LICENSE',
        'LICENSE.txt',
        'LICENSE.md',
        'license',
        'license.txt',
        'license.md',
        'LICENCE',
        'LICENCE.txt',
        'LICENCE.md',
        'licence',
        'licence.txt',
        'licence.md'
    ];

    for (const fileName of commonLicenseFiles) {
        const licenseFilePath = path.join(packagePath, fileName);
        try {
            if (fs.existsSync(licenseFilePath)) {
                const licenseText = fs.readFileSync(licenseFilePath, 'utf8');
                // Clean up the text - remove excessive whitespace but preserve structure
                return licenseText.trim().replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n');
            }
        } catch (error) {
            // If we can't read the file, continue to next one
            console.warn(`Warning: Could not read license file ${licenseFilePath}: ${error.message}`);
        }
    }

    return 'n/a';
};

/**
 * Enhanced version of addLocalPackageData that also extracts license text
 * @param {object} packageData - Package data object
 * @param {string} projectRootPath - Root path of the project
 * @param {array} fields - Fields to include
 * @returns {object} - Enhanced package data with license text
 */
export const addLocalPackageDataWithLicense = async (packageData, projectRootPath, fields) => {
    // Store original license type before calling addLocalPackageData
    const originalLicenseType = packageData.licenseType;
    
    // First get the standard local package data
    const localData = await addLocalPackageData(packageData, projectRootPath, fields);

    // Add possibleLicenses if it's in the requested fields
    if (fields && fields.includes('possibleLicenses')) {
        // Use the license type from localData (which comes from package.json) or the original input
        const licenseType = localData.licenseType || originalLicenseType || 'n/a';
        const possibleLicenses = parsePossibleLicenses(licenseType);
        localData.possibleLicenses = possibleLicenses;
        
        // Update licenseType to be the first license if multiple licenses exist
        if (possibleLicenses.length > 0) {
            localData.licenseType = possibleLicenses[0];
        }
    }

    // Add license text if it's in the requested fields
    if (fields && fields.includes('licenseText')) {
        // Try to find the package in node_modules
        const packageName = packageData.name;
        let packagePath = null;

        // Handle scoped packages (e.g., @protobufjs/aspromise)
        const normalizedPackageName = packageName.startsWith('@') ? packageName : packageName;

        // Check common locations for the package
        const possiblePaths = [
            path.join(projectRootPath, 'node_modules', normalizedPackageName),
            path.join(projectRootPath, '..', 'node_modules', normalizedPackageName),
            path.join(projectRootPath, '..', '..', 'node_modules', normalizedPackageName),
            // Also try looking in current directory node_modules
            path.join(process.cwd(), 'node_modules', normalizedPackageName)
        ];

        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                packagePath = possiblePath;
                break;
            }
        }

        if (packagePath) {
            const licenseText = extractLicenseText(packagePath);
            localData.licenseText = licenseText;
        } else {
            localData.licenseText = 'n/a';
        }
    }

    return localData;
};

export default addLocalPackageDataWithLicense;
