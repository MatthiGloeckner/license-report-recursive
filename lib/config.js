import path from 'node:path';
import url from 'node:url';
import fs from 'node:fs';

import rc from 'rc';

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));

// Load external config file if specified via --config parameter
let externalConfig = {};
const configIndex = process.argv.indexOf('--config');
if (configIndex !== -1 && configIndex + 1 < process.argv.length) {
  const configPath = process.argv[configIndex + 1];
  try {
    if (fs.existsSync(configPath)) {
      const configData = fs.readFileSync(configPath, 'utf8');
      externalConfig = JSON.parse(configData);
    }
  } catch (error) {
    console.warn(`Warning: Failed to load config file ${configPath}: ${error.message}`);
  }
}

const defaultConfig = {
  /*
    default is 'create recursive list'
  */
  recurse: true,

  /*
    possible outputs:

    json || table || csv || html || tree
  */
  output: 'json',

  /*
    if output is html
  */
  html: {
    cssFile: path.resolve(__dirname, '..', 'defaultHtmlStyle.css'),

    // passed directly to tableify (see: https://github.com/kessler/node-tableify)
    tableify: {},
  },

  /*
    if output is csv
  */
  delimiter: ',',

  /*
    escape fields containing delimiter character if output is csv
  */
  escapeCsvFields: false,

  /*
    export deps or dev deps. falsy -> output everything
    possible values (as csv without whitespace):
    prod || dev || opt || peer
  */
  only: null,

  /*
    npm registry url
  */
  registry: 'https://registry.npmjs.org/',

  /*
    use .npmrc file to find the registry for scoped packages;
    if no .npmrc file exists or when no registry is defined
    for a scope, the entry 'registry' in the config file is used;
    the path to the .npmrc file can be defined with a --npmrc
    config setting
  */
  useNpmrc: false,

  /*
    name of the environment variable holding the access token for private npm registries
  */
  npmTokenEnvVar: 'NPM_TOKEN',

  /*
    an array of package names that will be excluded from the report
  */
  exclude: [],

  /*
    fields participating in the report and their order
  */
  fields: [
    'department',
    'relatedTo',
    'name',
    'alias',
    'licensePeriod',
    'material',
    'licenseType',
    'link',
    'definedVersion',
    'installedVersion',
    'remoteVersion',
    'author',
  ],

  department: {
    value: 'kessler',
    label: 'department',
  },
  relatedTo: {
    value: 'stuff',
    label: 'related to',
  },
  licensePeriod: {
    value: 'perpetual',
    label: 'license period',
  },
  material: {
    value: 'material',
    label: 'material / not material',
  },
  name: {
    value: '',
    label: 'name',
  },
  alias: {
    value: '',
    label: 'alias',
  },
  licenseType: {
    value: 'n/a',
    label: 'license type',
  },
  link: {
    value: 'n/a',
    label: 'link',
  },
  installedFrom: {
    value: 'n/a',
    label: 'installed from',
  },
  remoteVersion: {
    value: '',
    label: 'remote version',
  },
  installedVersion: {
    value: 'n/a',
    label: 'installed version',
  },
  definedVersion: {
    value: 'n/a',
    label: 'defined version',
  },
  latestRemoteVersion: {
    value: 'n/a',
    label: 'latest remote version',
  },
  latestRemoteModified: {
    value: 'n/a',
    label: 'latest remote modified',
  },
  author: {
    value: 'n/a',
    label: 'author',
  },
  comment: {
    value: '',
    label: 'comment',
  },
  requires: {
    value: '',
    label: 'requires',
  },
  dependencyLoop: {
    value: '',
    label: 'dependencyLoop',
  },
  licenseText: {
    value: 'n/a',
    label: 'license text',
  },
  possibleLicenses: {
    value: [],
    label: 'possible licenses',
  },

  httpRetryOptions: {
    limit: 5,
  },
  httpTimeoutOptions: {
    request: 30000,
  },
};

// Merge external config with default config and rc config
const rcConfig = rc('license-report-recurse', defaultConfig);
const finalConfig = { ...rcConfig, ...externalConfig };

export default finalConfig;
