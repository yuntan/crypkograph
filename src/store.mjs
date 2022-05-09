import reducer from './reducer.mjs'

/**
 * @typedef {{
 *   token: string?;
 *   crypkoThumbnailURLs: { [crypkoHash: string]: string };
 *   crypkos: Crypko[];
*    ready: boolean;
 * }} State
 *
 * @typedef {{
 *   hash: string;
 *   name: string;
 *   ownerID: string;
 *   model: string;
 *   faved: boolean;
 *   parents: string[];
 *   children: string[];
 * }} Crypko
*/

export default class Store {
  /** @type {State} */
  #state = initialState()

  get state() {
    return this.#state
  }

  /**
   * @param {string} action
   * @param {any} payload
   */
  dispatch(action, payload) {
    this.#state = reducer(this.#state, { action, payload });
  }
}

/**
 * @returns {State}
 */
function initialState() {
  return {
    token: null,
    crypkoThumbnailURLs: {},
    crypkos: [],
    ready: false,
  };
}
