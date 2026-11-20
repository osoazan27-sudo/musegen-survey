/* identical.js — "same-flow" version. Rebuilds the long survey anatomy of the reference funnel (≈20 screens on one path):
   picture card -> profile lists -> a setting block that depends on the first pick -> milestone -> style lists -> proof-style slots
   -> star/photo slot -> song/format -> "final touches" beat -> hand-off.  Same screen order, screen types and pacing
   (pick, then Continue); every word, picture and brand element is MuseGen's own.
   Left out on purpose: the email + discount gate, the paywall and the upsells (no payment page), fake counters, fake reviews,
   fake urgency and a fake "analysis". */
(function () {
  'use strict';
  var S = window.MGSV_SHARED, byId = S.byId;

  var WORLD_IDS = ['paris', 'neon', 'street', 'ballroom'];
  var WORLDS4 = [];
  for (var w = 0; w < WORLD_IDS.length; w++) { WORLDS4.push(byId(S.WORLDS, WORLD_IDS[w])); }

  var GOALS = [
    { id: 'post', emoji: '📱', name: 'Share it on my socials', fmt: '9x16',
      brief: 'Made for short-form social: a strong first second and a clean ending that loops well.' },
    { id: 'song', emoji: '🎧', name: 'Promote my own song',
      brief: 'Shows off an original song with the lead performing it from start to finish.' },
    { id: 'gift', emoji: '🎁', name: 'Make a gift for someone',
      brief: 'A heartfelt, personal feel with warm light and close, expressive shots.' },
    { id: 'fun', emoji: '🎉', name: 'Because it’s fun',
      brief: 'Playful and a little over the top, made to be shared with friends.' },
    { id: 'band', emoji: '🎸', name: 'Show off my band or project',
      brief: 'Builds a confident artist identity with strong performance shots.' },
    { id: 'star', emoji: '🌟', name: 'Star in my own video',
      brief: 'Puts the lead front and center in every shot, like a real music video.' }
  ];

  var CHANNELS = [
    { id: 'tiktok', emoji: '🎵', name: 'TikTok', fmt: '9x16' },
    { id: 'reels', emoji: '📸', name: 'Instagram Reels', fmt: '9x16' },
    { id: 'shorts', emoji: '📲', name: 'YouTube Shorts', fmt: '9x16' },
    { id: 'youtube', emoji: '📺', name: 'YouTube', fmt: '16x9' },
    { id: 'friends', emoji: '💬', name: 'Mostly friends & family' }
  ];

  /* Setting cards: four sample scenes per world, every one a loop of an AI-generated person. */
  var LOC = {
    paris: [
      { id: 'av', name: 'Sunset avenue', clip: 'l_paris_av', brief: 'Setting: a wide sunset avenue with grand buildings and a crosswalk, golden light across the lead.' },
      { id: 'roof', name: 'Palm-tree rooftop', clip: 'l_paris_roof', brief: 'Setting: a rooftop lined with palm trees against a golden-hour skyline.' },
      { id: 'view', name: 'Golden-hour overlook', clip: 'l_paris_view', brief: 'Setting: a hilltop overlook above the city skyline at sunset.' },
      { id: 'studio', name: 'Recording studio', clip: 'l_paris_studio', brief: 'Setting: a cozy recording studio with glowing monitors and a vocal mic.' }
    ],
    neon: [
      { id: 'sky', name: 'Rainy skyline', clip: 'l_neon_sky', brief: 'Setting: a rainy rooftop with a neon skyline behind the lead.' },
      { id: 'train', name: 'Night train', clip: 'l_neon_train', brief: 'Setting: a late-night train car with passing city lights.' },
      { id: 'glow', name: 'Neon glow', clip: 'l_neon_glow', brief: 'Setting: a rain-soaked street washed in pink and blue neon.' },
      { id: 'car', name: 'Night drive', clip: 'l_neon_car', brief: 'Setting: the inside of a car at night, rain on the windows and city lights outside.' }
    ],
    street: [
      { id: 'alley', name: 'Graffiti alley', clip: 'l_street_alley', brief: 'Setting: a graffiti alley full of color, with a crew dancing behind the lead.' },
      { id: 'mural', name: 'Mural wall', clip: 'l_street_mural', brief: 'Setting: a giant fresh mural wall, spray paint in the lead’s hand.' },
      { id: 'lot', name: 'Dusk parking lot', clip: 'l_street_lot', brief: 'Setting: an open-air lot at dusk with a dance crew moving in sync.' },
      { id: 'lights', name: 'String-light courtyard', clip: 'l_street_lights', brief: 'Setting: a courtyard strung with warm lights and street art on the walls.' }
    ],
    ballroom: [
      { id: 'hall', name: 'Chandelier ballroom', clip: 'l_ball_hall', brief: 'Setting: a grand ballroom with crystal chandeliers and a mirror-bright floor.' },
      { id: 'cliff', name: 'Cliff at sunrise', clip: 'l_ball_cliff', brief: 'Setting: a rocky cliff above a sea of clouds at sunrise.' },
      { id: 'lake', name: 'Lantern lake', clip: 'l_ball_lake', brief: 'Setting: a lakeside at dusk with glowing paper lanterns in the sky.' },
      { id: 'terrace', name: 'Penthouse terrace', clip: 'l_ball_terrace', brief: 'Setting: a penthouse terrace at night with a city skyline behind.' }
    ]
  };

  var LOOK = {
    paris: [
      { id: 'field', emoji: '🧥', name: 'Olive field jacket & white tee', brief: 'The lead wears an olive field jacket over a white tee.' },
      { id: 'slip', emoji: '👗', name: 'Silk slip dress', brief: 'The lead wears a flowing silk slip dress.' },
      { id: 'trench', emoji: '🧣', name: 'Trench coat & scarf', brief: 'The lead wears a belted trench coat and a silk scarf.' },
      { id: 'denim', emoji: '👖', name: 'Denim & leather', brief: 'The lead wears a denim jacket with leather accents.' }
    ],
    neon: [
      { id: 'hoodie', emoji: '🎧', name: 'Mustard hoodie & headphones', brief: 'The lead wears a mustard hoodie with headphones around the neck.' },
      { id: 'bomber', emoji: '🧥', name: 'Black bomber jacket', brief: 'The lead wears a glossy black bomber jacket.' },
      { id: 'holo', emoji: '✨', name: 'Holographic jacket', brief: 'The lead wears a shimmering holographic jacket that catches the neon.' },
      { id: 'allblack', emoji: '🕶️', name: 'All black & shades', brief: 'The lead wears all black with sleek sunglasses.' }
    ],
    street: [
      { id: 'paint', emoji: '🎨', name: 'Paint-splattered tee', brief: 'The lead wears a paint-splattered white tee and baggy jeans.' },
      { id: 'jersey', emoji: '🏀', name: 'Oversized jersey', brief: 'The lead wears an oversized basketball jersey.' },
      { id: 'cargo', emoji: '🧢', name: 'Cap & cargo pants', brief: 'The lead wears a cap, a cropped hoodie and cargo pants.' },
      { id: 'varsity', emoji: '🏈', name: 'Varsity jacket', brief: 'The lead wears a retro varsity jacket.' }
    ],
    ballroom: [
      { id: 'red', emoji: '❤️', name: 'Red velvet gown', brief: 'The lead wears a red velvet gown.' },
      { id: 'black', emoji: '🖤', name: 'Black satin gown', brief: 'The lead wears a black satin gown with long gloves.' },
      { id: 'suit', emoji: '🤵', name: 'White tailored suit', brief: 'The lead wears a sharp white tailored suit.' },
      { id: 'sequin', emoji: '💎', name: 'Sequined gown', brief: 'The lead wears a sequined gown that sparkles under the lights.' }
    ]
  };

  var CREW = [
    { id: 'solo', emoji: '🎤', name: 'Just me', brief: 'The lead performs solo, with the camera focused on them.' },
    { id: 'dancers', emoji: '💃', name: 'A few dancers', brief: 'A small group of dancers moves around the lead.' },
    { id: 'band', emoji: '🎸', name: 'My band', brief: 'A live band plays behind the lead.' },
    { id: 'crowd', emoji: '🙌', name: 'A whole crowd', brief: 'An energetic crowd surrounds the lead.' }
  ];

  var MOOD = [
    { id: 'dreamy', emoji: '😍', name: 'Dreamy & romantic', brief: 'The mood is dreamy and romantic.' },
    { id: 'fierce', emoji: '🔥', name: 'Fierce & confident', brief: 'The mood is fierce and confident.' },
    { id: 'joy', emoji: '😄', name: 'Joyful & playful', brief: 'The mood is joyful and playful.' },
    { id: 'moody', emoji: '🌧️', name: 'Moody & emotional', brief: 'The mood is moody and emotional.' }
  ];

  var ATTITUDE = [
    { id: 'cool', emoji: '😎', name: 'Cool & effortless', brief: 'The lead is cool and effortless on camera.' },
    { id: 'diva', emoji: '👑', name: 'Total diva', brief: 'The lead performs like a total diva.' },
    { id: 'flirty', emoji: '😘', name: 'Smooth charmer', brief: 'The lead is a smooth, playful charmer.' },
    { id: 'fearless', emoji: '⚡', name: 'Fearless', brief: 'The lead is fearless and fully committed to every shot.' },
    { id: 'heart', emoji: '💖', name: 'Heartfelt', brief: 'The lead is heartfelt and sincere.' }
  ];

  var CAMERA = [
    { id: 'glide', emoji: '🎥', name: 'Smooth gliding shots', brief: 'Camera: smooth, gliding moves.' },
    { id: 'hand', emoji: '🤳', name: 'Handheld & raw', brief: 'Camera: handheld and raw.' },
    { id: 'push', emoji: '🔍', name: 'Slow push-ins', brief: 'Camera: slow push-ins on the big moments.' },
    { id: 'cuts', emoji: '✂️', name: 'Fast cuts on the beat', brief: 'Camera: fast cuts on the beat.' },
    { id: 'wide', emoji: '🎬', name: 'Big cinematic wides', brief: 'Camera: big cinematic wide frames.' }
  ];

  function defaultFmt(a) {
    var ch = byId(CHANNELS, a.channel), go = byId(GOALS, a.goal);
    return (ch && ch.fmt) || (go && go.fmt) || '9x16';
  }

  var STEPS = [
    { id: 'world', type: 'cards', title: 'Which music video world is yours?', sub: 'Pick the one that feels like your song.',
      caption: 'Sample clips — every person shown is AI-generated.', options: WORLDS4 },
    { id: 'goal', type: 'list', title: 'What do you want this video for?', sub: 'Your plan gets tuned to it.', options: GOALS },
    { id: 'channel', type: 'list', title: 'Where will you share it?', sub: 'We’ll suggest the right frame shape.', options: CHANNELS },
    { id: 'loc', type: 'cards', title: 'Where does the big moment happen?', sub: 'Pick the setting for your video.',
      caption: 'Sample scenes — every person shown is AI-generated.', optionsBy: LOC },
    { id: 'look', type: 'list', title: 'Pick the lead’s outfit', sub: 'Choose the closest look — you can fine-tune it on MuseGen.', optionsBy: LOOK },
    { id: 'crew', type: 'list', title: 'Who’s in the shot with you?', sub: 'Pick who shares the spotlight.', options: CREW },
    { id: 'mood', type: 'list', title: 'What’s the mood?', sub: 'One vibe for the whole video.', options: MOOD },
    { id: 'milestone', type: 'milestone', title: 'Nice — your world is taking shape', sub: 'Next up: the sound and the star.', button: 'Continue' },
    { id: 'genre', type: 'cards', title: 'What’s your song’s vibe?', sub: 'Pick the closest sound — it sets the pacing of your video.',
      skip: { id: 'unsure', label: 'Not sure — skip this' }, options: S.GENRES },
    { id: 'attitude', type: 'list', title: 'What’s your on-camera attitude?', sub: 'How should the lead carry themselves?', options: ATTITUDE },
    { id: 'camera', type: 'list', title: 'How should the camera move?', sub: 'Pick the style that fits the song.', options: CAMERA },
    { id: 'preview', type: 'preview', title: 'Here’s a taste of your world', sub: 'A sample clip of “{world}”. Your real video is made from your song.',
      caption: 'AI-generated sample clip.', button: 'Continue' },
    { id: 'how', type: 'how', title: 'How MuseGen works', sub: 'Three simple steps from song to video.', button: 'Continue',
      items: [
        { h: 'Add your song', t: 'Upload an MP3, WAV or M4A, pick it from Suno songs, or try one of MuseGen’s official tracks.' },
        { h: 'MuseGen’s AI agent writes the script', t: 'It usually takes 10–15 minutes. You can leave and come back — your video is saved under <b>My MVs</b>.' },
        { h: 'Preview it, then create it', t: 'You get a short preview video free. The full-length video uses credits, and if creation fails the credits are refunded.' }
      ] },
    { id: 'samples', type: 'samples', title: 'More worlds to explore', sub: 'Swipe through a few more looks.',
      caption: 'AI-generated sample clips. Your actual video is made from your song.', button: 'Continue', items: S.WORLDS },
    { id: 'lead', type: 'cards', title: 'Who’s starring in it?', sub: 'You’ll add any photo on MuseGen — nothing is uploaded on this page.', options: S.LEADS },
    { id: 'photo', type: 'photo', button: 'Continue',
      by: {
        me: { title: 'Add your photo on MuseGen', p: ['Use one clear, front-facing photo — no blur, no side angles. Your character stays consistent across shots.', 'Nothing is uploaded on this page; you’ll add the photo on MuseGen.'] },
        ai: { title: 'No photo needed', p: ['MuseGen designs one lead character and keeps them consistent across every shot.', 'Prefer to feature yourself? Use the Image to Video tab and add a photo.'] }
      } },
    { id: 'song', type: 'rows', title: 'Got a song ready?', sub: 'No song yet? Try one of MuseGen’s official tracks.', options: S.SONGS },
    { id: 'fmt', type: 'formats', title: 'Pick your video shape', sub: 'This sets the frame shape. You can still change it on MuseGen.', options: S.FORMATS, defaultFrom: defaultFmt }
  ];

  /* The text people paste into MuseGen's "Description" box (limit there: 1000 characters). */
  function buildBrief(a, fmtId) {
    var wo = byId(S.WORLDS, a.world);
    var parts = [
      wo && wo.intro,
      a.world && LOC[a.world] && (byId(LOC[a.world], a.loc) || {}).brief,
      a.world && LOOK[a.world] && (byId(LOOK[a.world], a.look) || {}).brief,
      (byId(CREW, a.crew) || {}).brief,
      (byId(MOOD, a.mood) || {}).brief,
      (byId(GOALS, a.goal) || {}).brief,
      (byId(S.GENRES, a.genre) || {}).brief,
      (byId(ATTITUDE, a.attitude) || {}).brief,
      (byId(CAMERA, a.camera) || {}).brief,
      (byId(S.LEADS, a.lead) || {}).brief,
      (byId(S.FORMATS, fmtId) || {}).brief
    ], out = [];
    for (var i = 0; i < parts.length; i++) { if (parts[i]) { out.push(parts[i]); } }
    return out.join(' ');
  }

  function picks(a, fmtId) {
    return { pl: 'survey', pl_v: 'identical', pl_world: a.world, pl_genre: a.genre, pl_star: a.lead, pl_song: a.song, pl_fmt: fmtId };
  }

  window.MGSV = {
    variant: 'identical',
    features: { autoAdvance: false, counter: false, chips: false, skipLink: false, copyAndGo: false, formatOnResult: false, resultStyle: 'full' },
    steps: STEPS,
    compose: { mode: 'stages', ms: 2400, title: 'Wrapping up your plan…',
      stages: ['Matching your picks to a Style template', 'Writing your description', 'Packing your plan'] },
    copy: S.COPY,
    buildBrief: buildBrief,
    buildSteps: S.buildSteps,
    picks: picks,
    defaultFmt: defaultFmt,
    /* tags shown under the preview on the result screen */
    tags: function (a, fmtId) {
      var wo = byId(S.WORLDS, a.world), ge = byId(S.GENRES, a.genre), le = byId(S.LEADS, a.lead), fm = byId(S.FORMATS, fmtId);
      var t = [wo.name];
      if (ge && ge.id !== 'unsure') { t.push(ge.name); }
      t.push(le.id === 'me' ? 'Starring me' : 'AI-cast lead');
      t.push(fm.ratio);
      return t;
    }
  };
})();
