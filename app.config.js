// Reads app.json, then drops settings for files that are not in the project yet,
// so `npx expo start` keeps working before google-services.json is added.
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const android = { ...config.android };
  if (android.googleServicesFile && !fs.existsSync(path.join(__dirname, android.googleServicesFile))) {
    delete android.googleServicesFile;
  }
  return { ...config, android };
};
