/** @typedef {import('./store.mjs').State} State

/**
 * @param {State} state
 * @param {{ action: string; payload: any; }} op
 * @returns {State}
 */
export default function reducer(state, op) {
  state = Object.assign({}, state);
  const { action, payload } = op;

  switch (action) {
  case 'updateToken':
    state.token = payload;
    break;

  case 'putCrypkoThumbnailURL':
    const [crypkoID, url] = payload;
    state.crypkoThumbnailURLs[crypkoID] = url;
    break;

  case 'setCrypkos':
    state.crypkos = payload;
    break;

  default:
    break;
  }

  console.debug(state);
  return state;
}
