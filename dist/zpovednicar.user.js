// ==UserScript==
// @name         Zpovědničář
// @description  Doplňková funkcionalita stránek pro všechny smutné lidičky a pro ty, kdo jim chtějí pomoci
// @license      http://www.wtfpl.net/about/
// @version      1.0
// @author       Evžen Huml
// @supportURL   https://www.zpovednice.eu/profil.php?kdo=71138
// @homepageURL  https://www.zpovednicar.cz/
// @updateURL    https://www.zpovednicar.cz/userscripts/zpovednicar.meta.js
// @downloadURL  https://www.zpovednicar.cz/userscripts/zpovednicar.user.js
// @namespace    zpovednicar.cz
// @include      /^https:\/\/(www\.)?(zpovednice\.(cz|eu)|spovednica\.sk)(\/?|\/(index|detail|profil|kniha|stat|zpovperl)\.php(\?.*)?)$/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=www.zpovednice.eu
// @resource     CSS_TINGLE https://cdnjs.cloudflare.com/ajax/libs/tingle/0.16.0/tingle.min.css
// @resource     CSS_TABBY  https://cdn.jsdelivr.net/gh/cferdinandi/tabby@12/dist/css/tabby-ui.min.css
// @resource     CSS_MODAL  https://cdn.zpovednicar.cz/userscripts/css/daypilot-modal-3.16.1.min.css
// @resource     CSS_PICKER https://cdn.jsdelivr.net/gh/mdbassit/Coloris@latest/dist/coloris.min.css
// @resource     CSS_CUSTOM https://cdn.zpovednicar.cz/userscripts/css/zpovednicar-0.8.9.min.css
// @require      https://cdn.jsdelivr.net/npm/dexie@3.2.2/dist/dexie.min.js
// @require      https://cdn.jsdelivr.net/npm/dexie-observable@3.0.0-beta.11/dist/dexie-observable.min.js
// @require      https://cdnjs.cloudflare.com/ajax/libs/tingle/0.16.0/tingle.min.js
// @require      https://cdn.jsdelivr.net/gh/cferdinandi/tabby@12/dist/js/tabby.polyfills.min.js
// @require      https://cdn.zpovednicar.cz/userscripts/js/daypilot-modal-3.16.1.min.js
// @require      https://cdn.zpovednicar.cz/userscripts/js/papaparse-5.0.2.min.js
// @require      https://cdn.zpovednicar.cz/userscripts/js/FileSaver-2.0.4.min.js
// @require      https://cdn.jsdelivr.net/gh/mdbassit/Coloris@latest/dist/coloris.min.js
// @require      https://cdn.zpovednicar.cz/userscripts/js/zpovednicar-0.9.min.js
// @run-at       document-start
// @grant        GM_getResourceText
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_addValueChangeListener
// @noframes
// ==/UserScript==