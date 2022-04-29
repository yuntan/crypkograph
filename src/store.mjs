import './types.mjs'
import reducer from './reducer.mjs'

export default class Store {
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
  };
}
