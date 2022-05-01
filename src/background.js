import {
  onBeforeRequest, onSendHeaders, onClicked, onMessage,
} from './listeners.mjs';

chrome.webRequest.onBeforeRequest.addListener(onBeforeRequest, {
  urls: ['https://crypko.oss-ap-northeast-1.aliyuncs.com/*'],
});

chrome.webRequest.onSendHeaders.addListener(onSendHeaders, {
  urls: ['https://api.crypko.ai/*'],
}, ['requestHeaders']);

chrome.action.onClicked.addListener(onClicked);

chrome.runtime.onMessage.addListener(onMessage);
