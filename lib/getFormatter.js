import { getFormatter as getFormatterLR } from 'license-report/lib/getFormatter.js';

/**
 * Formats package information as json string with field mapping support.
 * @param {object[]} dataAsArray - array of objects with information about dependencies / devdependencies in package.json
 * @param {object} config - configuration object with field mappings
 * @returns {string} dataAsArray formatted as json string
 */
const formatAsJsonString = (dataAsArray, config) => {
  if (!config || !config.fields) {
    // Fallback to default formatting if no config
    return JSON.stringify(dataAsArray);
  }

  // Map the data according to configuration
  const mappedData = dataAsArray.map(item => {
    const mappedItem = {};

    config.fields.forEach(fieldName => {
      const fieldConfig = config[fieldName];
      let value = item[fieldName];

      // Use configured default value if field is empty or undefined
      if (fieldConfig && fieldConfig.value && (!value || value === 'n/a' || value === '')) {
        value = fieldConfig.value;
      }

      // Use configured label as field name if available
      const outputFieldName = fieldConfig && fieldConfig.label ? fieldConfig.label : fieldName;
      mappedItem[outputFieldName] = value || 'n/a';
    });

    return mappedItem;
  });

  return JSON.stringify(mappedData, null, 2);
};

/**
 * Gets the formatter function for the style given.
 * Allowed styles: 'json', 'table', 'csv', 'html', 'tree'.
 * Function signature: function(dataAsArray, config)
 * dataAsArray: array of objects with information about dependencies / devdependencies in package.json,
 * config: global configuration object
 * @param {string} style - output style to be generated
 * @returns {Function} function to format the data; signature: function(dataAsArray, config)
 */
const getFormatter = (style) => {
  let formatter;
  switch (style) {
    case 'tree':
      formatter = formatAsJsonString;
      break;
    case 'json':
      // Override the default JSON formatter to support field mapping
      formatter = formatAsJsonString;
      break;
    default:
      formatter = getFormatterLR(style);
  }

  return formatter;
};

export default getFormatter;
