/* eslint-disable id-length */
const { basename, dirname, extname, resolve } = require('path');

const glob = require('glob');
const sharp = require('sharp');

// import synchronous glob
const globSync = glob.sync;
// resolve assets directories
const postDist = resolve(__dirname, '..', 'content/posts');
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

/**
 * Create various size and format variants of an image.
 * @function
 * @async
 *
 * @param {string} src image to format and convert
 *
 * @returns {Promise<void>}
 */
const fmtImage = async src => {
  const dist = dirname(src);
  const name = basename(src, extname(src));

  // map array to promises
  const promises = variants.map(async ext => {
    // image options
    const fileName = `${name}.${ext}`;
    const output = `${dist}/${fileName}`;
    const image = sharp(src);

    // create variants
    return image
      .resize(1440, undefined, {
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
  const input = resolve(iconDist, 'favicon.png');

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
    const imgFiles = globSync('*.png', { absolute: true, cwd: imgDist });
    const postImgFiles = globSync('**/*.png', {
      absolute: true,
      cwd: postDist,
    });
    const iconOps = icons.map(icon => fmtIcon(icon.name, icon.size));
    const imgOps = imgFiles.map(file => fmtImage(file));
    const postImgOps = postImgFiles.map(file => fmtImage(file));
    const ops = [...iconOps, ...imgOps, ...postImgOps];

    await Promise.all(ops);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
