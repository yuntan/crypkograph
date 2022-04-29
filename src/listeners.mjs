import Store from './store.mjs'
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
    store.dispatch('updateToken', token);
    console.log('Token is here!');
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
  const m = url.match(/^https:\/\/crypko.oss-ap-northeast-1.aliyuncs.com\/users\/\d+\/public\/crypkos\/([a-zA-Z0-9]+)\/display\/MD.jpg/);
  if (!m) { return; }

  console.log('Found Crypko thumbnail!')
  const crypkoID = m[1];
  store.dispatch('putCrypkoThumbnailURL', [crypkoID, url]);
}

/**
 * handle click on action button
 * @param {chrome.tabs.Tab} tab
 */
export async function onClicked(tab) {
  if (!store.state.token) {
    console.error('Token is null!');
    return;
  }

  const m = tab.url.match(/^https:\/\/crypko.ai\/user\/(\d+)\//);
  if (!m) {
    console.log('This is not a Crypko user page.');
    return;
  }

  const userID = m[1];
  const crypkos = await fetchAllCrypkos(userID);

  store.dispatch('putCrypkos', crypkos);

  // let url = `https://api.crypko.ai/crypkos/?ordering=-created&page=1&owner=${userID}`
  // const res = await fetch(url, )

  for (let i = 1; i <= Math.ceil(crypkos.length / 20); i++) {
    const url = `https://crypko.ai/user/${userID}/crypko?page=${i}`
    const tab = await chrome.tabs.create({ url });
    await sleep(5);
    await chrome.tabs.remove(tab.id);
  }

  const baseURL = chrome.runtime.getURL('index.html');
  const url = `${baseURL}?token=${store.state.token}&userID=${userID}`;
  await chrome.tabs.create({ url });
}

/**
 * @param {string} userID
 * @returns {Promise<Crypko[]>}
 */
async function fetchAllCrypkos(userID) {
  let url = `https://api.crypko.ai/crypkos/?owner=${userID}&ordering=-created&page=1`;
  let count = 0;
  /** @type {Crypko[]} */
  let crypkos = [];

  while (true) {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${store.state.token}` },
    });
    if (!res.ok) {
      console.error(`failed to fetch crypko count. status: ${res.status}, body: ${await res.text()}`);
      break;
    }
    /** @type {any} */
    const resJSON = await res.json()
    count = resJSON.count;

    for (let result of resJSON.results) {
      const { hash } = result;
      const res = await fetch(`https://api.crypko.ai/crypkos/${hash}`, {
        headers: { 'Authorization': `Bearer ${store.state.token}` },
      });
      if (!res.ok) {
        console.error(`failed to fetch Crypko info. status: ${res.status}, body: ${await res.text()}`);
        continue;
      }

      const { parents, children } = await res.json();

      /** @type {Crypko} */
      const crypko = {
        hash: hash,
        name: result.name,
        ownerID: result.owner.id,
        model: result.model,
        public: result.public,
        faved: result.faved,
        parents: parents.map((/** @type {any} */ parent) => parent.hash),
        children: children.map((/** @type {any} */ child) => child.hash),
      };
      crypkos.push(crypko);

      // NOTE: workaround for 429 "Request was throttled. Expected available in 1 second."
      await sleep(1);
    }
    url = resJSON.next;
    if (!url) { break; }
  }

  if (crypkos.length !== count) {
    console.error(`Crypko count unmatch. crypkos.lenght: ${crypkos.length}, count: ${count}`);
  }

  return crypkos;
}
