/* config.js — the only file you normally need to edit. No build step needed for these values: edit it inside dist/<variant>/assets/ or here and run `node build.js`. */
window.MGPL = {
  /* Where the final button goes. Keep the promo slug (rb00_1music): MuseGen's server reads it, sets the
     ttclid / promo-code cookies, then 307-redirects to /mv-generation with the full query string intact. */
  destination: 'https://www.musegen.ai/mv-generation/rb00_1music',

  /* Quiet second link, shown only to people who said they'd "try an official track". */
  songMakerUrl: 'https://www.musegen.ai/ai-song-maker',

  /* Forward every incoming query param (utm_*, ttclid, …) to the destination, byte for byte. */
  forwardQuery: true,

  /* Also append the picks as pl=survey&pl_v=<variant>&pl_world=…&pl_genre=…&pl_star=…&pl_song=…&pl_fmt=…
     (MuseGen ignores them in its first-landing cookie; GA/other tools can still read them from the URL). */
  appendPicks: true,

  /* Analytics. An empty string means OFF — nothing third-party loads and nothing is sent anywhere.
     Even when ids are set, nothing loads for visitors whose browser sends Global Privacy Control (GPC). */
  tiktokPixel: '',   /* e.g. 'YOUR_PIXEL_CODE'. Fires custom events PL_Start / PL_Step / PL_Pick / PL_Result / PL_Copy / PL_Cta / PL_Format */
  ga4: '',           /* e.g. 'G-XXXXXXXXXX' */

  /* US privacy: when a pixel/GA id is set, show a "Your Privacy Choices" footer link pointing here
     (musegen.ai's privacy page currently has no California/CCPA section — put the opt-out page URL here once it exists). */
  privacyChoicesUrl: ''
};
