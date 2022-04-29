/**
 * @typedef {{
 *   hash: string;
 *   name: string;
 *   ownerID: string;
 *   model: string;
 *   public: boolean;
 *   faved: boolean;
 *   parents: [string, string];
 *   children: string[];
 * }} Crypko
 *
 * @typedef {{
 *   token: string?;
 *   crypkoThumbnailURLs: { [crypkoID: string]: string };
 *   crypkos: Crypko[];
 * }} State
 */
