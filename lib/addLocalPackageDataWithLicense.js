import fs from 'fs';
import path from 'path';
import { addLocalPackageData } from 'license-report/lib/addLocalPackageData.js';

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
  // First get the standard local package data
  const localData = await addLocalPackageData(packageData, projectRootPath, fields);
  
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
