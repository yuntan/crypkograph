import Store from './store.mjs'
/** @typedef {import('./store.mjs').Crypko} Crypko */
import sleep from './sleep.mjs'

const store = new Store()

/**
 * obtain authorization token
 * @param {chrome.webRequest.WebRequestHeadersDetails} details
 */
export function onSendHeaders(details) {
  if (!details.requestHeaders) { return; }

  /** @type {string?} */
  let token = null
  for (let header of details.requestHeaders) {
    if (header.name !== 'Authorization') { continue; }

    const m = header.value.match(/^Bearer (.+)$/);
    token = m[1];
    if (token !== store.state.token) {
      store.dispatch('updateToken', token);
      console.log('Token is here!');
    }
    break;
  }

  // if (token === null) {
  //   console.log(`Token is not found. url: ${details.url}`)
  // }
}

/**
 * remember Crypko thumbnail URLs
 * @param {chrome.webRequest.WebRequestBodyDetails} details
 */
export function onBeforeRequest(details) {
  const url = details.url;
  const m = url.match(/^https:\/\/crypko.oss-ap-northeast-1.aliyuncs.com\/users\/(\d+)\/(public|private)\/crypkos\/([a-zA-Z0-9]+)\/display\/MD.jpg/);
  if (!m) { return; }

  console.debug('Found Crypko thumbnail!')
  const hash = m[3];
  store.dispatch('putCrypkoThumbnailURL', [hash, url]);
}

/**
 * handle click on action button
 * @param {chrome.tabs.Tab} tab
 */
export async function onClicked(tab) {
  const m = tab.url.match(/^https:\/\/crypko.ai\/user\/(\d+)\//);
  if (!m) {
    console.log('This is not a Crypko user page.');
    return;
  }
  const userID = m[1];

  const url = chrome.runtime.getURL('index.html');
  const extensionPageTab = await chrome.tabs.create({ url });

  await chrome.tabs.reload(tab.id);
  await sleep(5);
  if (!store.state.token) {
    console.error('Token is null!');
    return;
  }

  const crypkos = await fetchAllCrypkos(userID);

  store.dispatch('setCrypkos', crypkos);

  const tabIDs = [];
  for (let i = 1; i <= Math.ceil(crypkos.length / 20); i++) {
    const url = `https://crypko.ai/user/${userID}/crypko?page=${i}`
    const tab = await chrome.tabs.create({ url });
    tabIDs.push(tab.id);
  }

  await chrome.tabs.update(extensionPageTab.id, { active: true });
  await sleep(30);

  for (const id of tabIDs) {
    await chrome.tabs.remove(id);
  }

  store.dispatch('setReady');
}

/**
 * @param {string} userID
 * @returns {Promise<Crypko[]>}
 */
async function fetchAllCrypkos(userID) {
  let baseURL = `https://api.crypko.ai/crypkos/?owner=${userID}&ordering=-created`;
  const res = await fetch(`${baseURL}&page=1`, {
    headers: { 'Authorization': `Bearer ${store.state.token}` },
  });
  if (!res.ok) {
    console.error(`failed to fetch Crypkos. status: ${res.status}, body: ${await res.text()}`);
    return;
  }

  /** @type {CrypkosResponseJSON} */
  const resJSON = await res.json();
  const { count } = resJSON;

  let hashs = resJSON.results.map((result) => result.hash);
  
  for (let i = 2; i <= Math.ceil(count / 20); i++) {
    let res = await fetch(`${baseURL}&page=${i}`, {
      headers: { 'Authorization': `Bearer ${store.state.token}` },
    });

    if (!res.ok) {
      console.error(`failed to fetch Crypkos (page ${i}). status: ${res.status}, body: ${await res.text()}`);
      return;
    }

    /** @type {CrypkosResponseJSON} */
    const resJSON = await res.json();
    hashs = hashs.concat(
      resJSON.results.map((result) => result.hash)
    );

    await sleep(.2);
  }

  /** @type Crypko[] */
  const crypkos = [];

  for (let hash of hashs) {
    const res = await fetch(`https://api.crypko.ai/crypkos/${hash}/`, {
      headers: { 'Authorization': `Bearer ${store.state.token}` },
    });
    if (!res.ok) {
      console.error(`failed to fetch Crypko (${hash}) info. status: ${res.status}, body: ${await res.text()}`);
      continue;
    }

    /** @type {CrypkoResponseJSON} */
    const resJSON = await res.json();
    const { name, owner, model, faved, parents, children } = resJSON;

    /** @type {Crypko} */
    const crypko = {
      hash,
      name,
      ownerID: owner.id,
      model,
      faved,
      parents: parents.map((parent) => parent.hash),
      children: children.map((child) => child.hash),
    };
    crypkos.push(crypko);

    // NOTE: workaround for 429 "Request was throttled. Expected available in 1 second."
    await sleep(.2);
  }

  if (crypkos.length !== count) {
    console.error(`Crypko count unmatch. crypkos.lenght: ${crypkos.length}, count: ${count}`);
  }

  const parentAndChildHashs = crypkos.flatMap(
    (crypko) => crypko.parents.concat(crypko.children)
  );
  // const missingHashs = 

  return crypkos;
}

/**
 * @param {string} message
 * @param {chrome.runtime.MessageSender} _
* @param {(response: any) => void} sendResponse
 */
export function onMessage(message, _, sendResponse) {
  switch (message) {
    case 'getState':
      sendResponse(store.state);
      break;

    default: break;
  }
}

/**
 * @typedef {{
 *   count: number;
 *   results: CrypkosResponseJSONResult[];
 * }} CrypkosResponseJSON
 *
 * @typedef {{
 *   hash: string;
 * }} CrypkosResponseJSONResult
 *
 * @typedef {{
 *   name: string;
 *   owner: { id: string; };
 *   model: string;
 *   faved: boolean;
 *   parents: CrypkoResponseJSONParentOrChild[];
 *   children: CrypkoResponseJSONParentOrChild[];
 * }} CrypkoResponseJSON
 *
 * @typedef {{
 *   hash: string;
 * }} CrypkoResponseJSONParentOrChild
 */
