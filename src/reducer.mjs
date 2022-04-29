import './types.mjs'

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

  case 'putCrypkos':
    state.crypkos = state.crypkos.concat(payload);
    break;

  default:
    break;
  }

  console.debug(state);
  return state;
}
