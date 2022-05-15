const { resolve } = require('path');

const glob = require('glob');
const { replaceInFile } = require('replace-in-file');

const globSync = glob.sync;

// Glob options. Pass directory to search and files to ignore
const cwd = resolve(__dirname, '..', 'public');
const ignore = ['sw*.js'];

// Find all JS, CSS, and font files in rendered output
(async () => {
  console.info('[INFO]', 'Generating cache list for Service Worker.');

  // create matched files array
  const files = globSync('**/*.{js,css,woff,woff2}', { cwd, ignore });
  const newFiles = files.map(toCache => `'/${toCache}'`).toString();

  // find and replace options; add files to cache array
  const replaceOptions = {
    files: resolve(cwd, 'sw*.js'),
    from: [/=\s?\["staticAssets"\]/g],
    to: [`=[${newFiles}]`],
  };

  try {
    await replaceInFile(replaceOptions);

    console.info('[SUCCESS]', 'Service Worker updated.');
  } catch (error) {
    throw new Error(`${error}`);
  }
})();
