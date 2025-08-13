import createDebugMessages from 'debug';
import semver from 'semver';
import { getRegistryAccessData } from './getRegistryAccessDataPatched.js';

const debug = createDebugMessages(
  'license-report:addPackageDataFromRepository-patched',
);

/**
 * Patched version of addPackageDataFromRepository that uses our fixed getRegistryAccessData
 * Collects the data for a single package from the repository (link, installedFrom, remoteVersion) and
 * add it to the given object.
 * @param {object} packageEntry - object with information about 1 package with data from the local package.json added
 * @param {object} npmrc - object with npm configuration data to use
 * @returns {object} with all Information about the package
 */
export async function addPackageDataFromRepository(packageEntry, npmrc) {
  const notAvailableText = 'n/a';
  let definedVersion = packageEntry.version;

  debug('Processing package %s@%s', packageEntry.fullName, definedVersion);

  let json = {};
  let installedFrom = notAvailableText;
  let installedVersion = definedVersion;
  let lastModified = '';

  const fullPackageName = packageEntry.fullName;

  // test if this is a locally installed package
  const linkVersionRegex =
    /^(http|https|file|git|git\+ssh|git\+https|github):.+/i;

  if (!linkVersionRegex.test(definedVersion)) {
    try {
      // Use our patched getRegistryAccessData
      const registryData = getRegistryAccessData(fullPackageName, npmrc);

      const response = await fetch(`${registryData.uri}${fullPackageName}`, {
        headers: registryData.authToken
          ? {
            Authorization: `Bearer ${registryData.authToken}`,
          }
          : {},
      });

      if (response.ok) {
        json = await response.json();

        if (json.versions) {
          const versions = Object.keys(json.versions);
          const installedVersionData = json.versions[installedVersion];

          if (installedVersionData !== undefined) {
            installedFrom = installedVersionData._resolved || notAvailableText;
          } else {
            installedFrom = notAvailableText;
          }

          // Get the right remote version for this package
          let version = semver.maxSatisfying(versions, definedVersion, {
            includePrerelease: true,
          });
          if (version === null) {
            version = semver.valid(definedVersion);
            if (version === null) {
              version = definedVersion;
            }
          }

          // Get the latest version
          const latest = semver.maxSatisfying(versions, '*', {
            includePrerelease: false,
          });
          if (latest && json.versions[latest] && json.versions[latest].time) {
            lastModified = json.versions[latest].time;
          } else if (json.time && json.time.modified) {
            lastModified = json.time.modified;
          }

          packageEntry.remoteVersion = version.toString();
          packageEntry.latestRemoteVersion = latest || notAvailableText;
          packageEntry.latestRemoteModified = lastModified;
        }
      } else {
        debug(
          'Failed to fetch package data for %s: %s',
          fullPackageName,
          response.statusText,
        );
      }
    } catch (error) {
      debug(
        'Error fetching package data for %s: %s',
        fullPackageName,
        error.message,
      );
    }
  } else {
    // Handle link versions
    installedFrom = definedVersion;
    packageEntry.remoteVersion = notAvailableText;
    packageEntry.latestRemoteVersion = notAvailableText;
    packageEntry.latestRemoteModified = '';
  }

  packageEntry.link = installedFrom;
  packageEntry.installedFrom = installedFrom;
  packageEntry.installedVersion = installedVersion;
  packageEntry.comment = packageEntry.remoteVersion;

  // Clean up temporary properties
  delete packageEntry.alias;
  delete packageEntry.fullName;
  delete packageEntry.scope;
  delete packageEntry.version;

  return packageEntry;
}
