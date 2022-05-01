/**
 * @typedef {{
 *   hash: string;
 *   name: string;
 *   ownerID: string;
 *   model: string;
 *   faved: boolean;
 *   parents: string[];
 *   children: string[];
 * }} Crypko
 *
 * @typedef {{
 *   token: string?;
 *   crypkoThumbnailURLs: { [crypkoHash: string]: string };
 *   crypkos: Crypko[];
 * }} State
 *
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
