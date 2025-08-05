import createDebugMessages from 'debug';
import { getRegistryAccessData } from './getRegistryAccessDataPatched.js';

const debug = createDebugMessages(
  'license-report:getPackageDataFromRepository-patched',
);

/**
 * Patched version of getPackageDataFromRepository that uses our fixed getRegistryAccessData
 */
export async function getPackageDataFromRepository(
  packageName,
  packageVersion,
  npmrc,
) {
  debug('Getting package data for %s@%s', packageName, packageVersion);

  try {
    const registryData = getRegistryAccessData(packageName, npmrc);

    const response = await fetch(`${registryData.uri}${packageName}`, {
      headers: registryData.authToken
        ? {
            Authorization: `Bearer ${registryData.authToken}`,
          }
        : {},
    });

    if (!response.ok) {
      debug('Failed to fetch package data: %s', response.statusText);
      return null;
    }

    const data = await response.json();
    const versionData = data.versions?.[packageVersion];

    if (!versionData) {
      debug('Version %s not found for package %s', packageVersion, packageName);
      return null;
    }

    return {
      name: packageName,
      version: packageVersion,
      description: versionData.description,
      homepage: versionData.homepage,
      repository: versionData.repository,
      license: versionData.license,
      author: versionData.author,
    };
  } catch (error) {
    debug('Error fetching package data: %s', error.message);
    return null;
  }
}
