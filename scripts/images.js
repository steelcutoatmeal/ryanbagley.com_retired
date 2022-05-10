/* eslint-disable id-length */
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

import glob from 'glob';
import sharp from 'sharp';

// import synchronous glob
const globSync = glob.sync;
// resolve local directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// resolve assets directories
const postSrc = resolve(__dirname, '..', 'content/posts');
const mainSrc = resolve(__dirname, 'img');
const iconDist = resolve(__dirname, '..', 'static/icons');
const imgDist = resolve(__dirname, '..', 'assets/img');
// image variants for conversion
const variants = ['jpeg', 'webp', 'avif'];
const icons = [
  { name: 'favicon', size: 16 },
  { name: 'favicon', size: 32 },
  { name: 'icon', size: 120 },
  { name: 'icon', size: 152 },
  { name: 'icon', size: 167 },
  { name: 'icon', size: 180 },
  { name: 'icon', size: 256 },
  { name: 'icon', size: 512 },
];
const imgMatch = new RegExp('(.*)/([a-zA-Z_-]+).png', 'g');

/**
 * Create various size and format variants of an image.
 * @function
 * @async
 *
 * @param {string} src image to format and convert
 * @param {string} dist converted image destination directory
 *
 * @returns {Promise<void>}
 */
const fmtImage = async (src, dist) => {
  const name = src.replace(imgMatch, '$2');

  // map array to promises
  const promises = variants.map(async ext => {
    // image options
    const fileName = `${name}.${ext}`;
    const output = `${dist}/${fileName}`;
    console.info({ name, fileName, output });
    const image = sharp(src);

    // create variants
    return image
      .resize(896, undefined, {
        background: { r: 255, g: 255, b: 255, alpha: 0.0 },
        fit: 'contain',
      })
      .toFormat(ext, { progressive: true })
      .toFile(output);
  });

  try {
    await Promise.all(promises);

    console.info(`[IMG] - ${name} asset created`);
  } catch (err) {
    throw new Error(err);
  }
};

/**
 * Create various size and format variants of icons.
 * @function
 * @async
 *
 * @param {string} name file name
 * @param {number} size resize to this dimension
 *
 * @returns {Promise<void>}
 */
const fmtIcon = async (name, size) => {
  const input = resolve(mainSrc, 'favicon.png');

  // image options
  const fileName = `${name}-${size}x${size}.png`;
  const output = `${iconDist}/${fileName}`;
  const image = sharp(input);

  try {
    // create variants
    await image
      .resize(size, size, {
        background: { r: 255, g: 255, b: 255, alpha: 0.0 },
        fit: 'contain',
      })
      .toFile(output);

    console.info(`[IMG] - ${name}-${size}x${size} created`);
  } catch (err) {
    throw new Error(err);
  }
};

(async () => {
  try {
    const imgFiles = globSync('*.png', { absolute: true, cwd: mainSrc });
    const postImgFiles = globSync('**/*.png', { absolute: true, cwd: postSrc });
    const iconOps = icons.map(icon => fmtIcon(icon.name, icon.size));
    const imgOps = imgFiles.map(file => fmtImage(file, imgDist));
    const postImgOps = postImgFiles.map(file => {
      const mtchImgDist = file.replace(imgMatch, '$1');
      return fmtImage(file, mtchImgDist);
    });
    const ops = [...iconOps, ...imgOps, ...postImgOps];

    await Promise.all(ops);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
