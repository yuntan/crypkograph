/**
 * @param {number} seconds
* @returns {Promise<void>}
 */
export default async function sleep(seconds) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve()
    }, seconds * 1000);
  });
}
