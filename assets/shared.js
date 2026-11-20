/* shared.js — option data and product facts used by BOTH survey variants. American English.
   Product facts (checked against musegen.ai on 2026-11-13, re-checked 2026-11-17) are listed in README.md > "Claims table".
   Nothing here is invented social proof: no user counts, no ratings, no countdowns, no discounts.
   Every picture on the page is a short looping clip of an AI-generated person (assets/clips/<id>.mp4 + <id>.jpg poster). */
(function () {
  'use strict';

  /* World cards are our own names; `tpl` is the closest real "Style template" inside MuseGen (names as shown on the MV page).
     `clip` = square grid loop, `tall` = 2:3 loop used by previews. `intro` is the theme line used when a variant asks more
     questions about the setting; `brief` is the full one-sentence scene used when it does not. All wording is our own. */
  var WORLDS = [
    { id: 'paris', name: 'Paris Sunset', clip: 'w_paris_sq', tall: 'w_paris_tall', tpl: 'Paris dusk',
      intro: 'Theme: Paris Sunset — warm golden light and romantic energy.',
      brief: 'Golden-hour Paris: a sunlit avenue, the Eiffel Tower framing the shot, the lead singing straight to camera with big, joyful energy.' },
    { id: 'neon', name: 'Neon Rain', clip: 'w_neon_sq', tall: 'w_neon_tall', tpl: 'Rainy Night in Tokyo',
      intro: 'Theme: Neon Rain — pink and blue neon, rain and nighttime city energy.',
      brief: 'A neon city at night: pink and blue lights, a mic in hand, headphones around the neck, close-ups and slow push-ins on every chorus.' },
    { id: 'beach', name: 'Beach Road Trip', clip: 'w_beach_sq', tall: 'w_beach_tall', tpl: 'Road Trip in Camper Van',
      intro: 'Theme: Beach Road Trip — ocean light, warm tones and free-spirited energy.',
      brief: 'A beach road trip: a vintage camper van at golden hour, an acoustic guitar, ocean light, warm close-ups and easy, free-spirited motion.' },
    { id: 'street', name: 'Street Crew', clip: 'w_street_sq', tall: 'w_street_tall', tpl: 'Street Youth',
      intro: 'Theme: Street Crew — colorful, rhythmic and full of movement.',
      brief: 'A street crew in a graffiti alley: the lead dancing with friends, colorful murals, hard cuts on the beat, handheld energy.' },
    { id: 'rooftop', name: 'Rooftop Party', clip: 'w_pool_sq', tall: 'w_pool_tall', tpl: 'Penthouse',
      intro: 'Theme: Rooftop Party — string lights, a glowing skyline and party swagger.',
      brief: 'A rooftop party at night: palm trees, string lights, a glowing skyline, the lead singing to the crowd with swagger.' },
    { id: 'ballroom', name: 'Ballroom Diva', clip: 'w_ballroom_sq', tall: 'w_ballroom_tall', tpl: 'Diva in Black Gown',
      intro: 'Theme: Ballroom Diva — elegant, glamorous and dramatically lit.',
      brief: 'A grand ballroom: crystal chandeliers, a vintage microphone, a velvet gown, slow and elegant camera moves around the lead.' }
  ];

  /* The vibe names follow MuseGen's own genre groups (AI Song Maker); the last two real groups are merged into one card. */
  var GENRES = [
    { id: 'pop', name: 'Pop & Vocals', clip: 'g_pop',
      brief: 'Bright, catchy pop energy — keep the lead’s face and expressions front and center.' },
    { id: 'hiphop', name: 'Hip-Hop & Rap', clip: 'g_hiphop',
      brief: 'Hip-hop swagger — confident posture and rhythmic cuts that land on the beat.' },
    { id: 'edm', name: 'EDM & Electronic', clip: 'g_edm',
      brief: 'Electronic build-and-drop energy — let the visuals surge on the drops.' },
    { id: 'lofi', name: 'Lo-Fi & Chill Beats', clip: 'g_lofi',
      brief: 'Lo-fi calm — soft light, slow pacing and cozy details.' },
    { id: 'soul', name: 'Jazz & Soul', clip: 'g_soul',
      brief: 'Jazz and soul warmth — intimate, smoky and unhurried.' },
    { id: 'cine', name: 'Cinematic & Orchestral', clip: 'g_cine',
      brief: 'Cinematic score — epic scale, dramatic lighting and an emotional arc.' },
    { id: 'unsure', name: 'Not sure', hidden: true,
      brief: 'Let the pacing and mood follow the song.' }
  ];

  var LEADS = [
    { id: 'me', name: 'Me', sub: 'Add 1 photo', clip: 's_me', tab: 'Image to Video',
      brief: 'One lead character based on my uploaded photo, looking the same in every shot.' },
    { id: 'ai', name: 'AI-cast lead', sub: 'No photo needed', clip: 's_ai', tab: 'Music to Video',
      brief: 'One AI-designed lead character who stays consistent across every shot.' }
  ];

  var SONGS = [
    { id: 'file', name: 'I have a song file', desc: 'Upload an MP3, WAV or M4A.', clip: 'm_file' },
    { id: 'suno', name: 'It’s on Suno', desc: 'Pick it from “Suno songs”.', clip: 'm_suno' },
    { id: 'official', name: 'Not yet — I’ll try a track', desc: 'MuseGen has ready-made official tracks you can preview.', clip: 'm_official' }
  ];

  var FORMATS = [
    { id: '9x16', name: 'Vertical 9:16', desc: 'TikTok · Reels · Shorts', ratio: '9:16', clip: 'f_vert', shape: 'v',
      brief: 'Vertical 9:16 framing for TikTok, Reels and Shorts.' },
    { id: '16x9', name: 'Widescreen 16:9', desc: 'YouTube', ratio: '16:9', clip: 'f_wide', shape: 'w',
      brief: 'Widescreen 16:9 framing.' }
  ];

  function byId(list, id) {
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) { return list[i]; } }
    return null;
  }

  /* The three "what to tap on MuseGen" steps, tailored to the answers. Strings are constants (safe to inject). */
  function buildSteps(a, fmtId) {
    var wo = byId(WORLDS, a.world), le = byId(LEADS, a.lead), fm = byId(FORMATS, fmtId) || FORMATS[0];
    var music = {
      file: 'Tap <b>Upload music</b> and add your MP3, WAV or M4A.',
      suno: 'Tap <b>Suno songs</b> and pick your track.',
      official: 'Tap <b>Choose music</b> → <b>Official music</b> and preview a track you like.'
    }[a.song];
    var lead = a.lead === 'me'
      ? 'Stay on <b>Image to Video</b> and tap <b>Upload photo</b> — use a clear, front-facing photo (no blur, no side angles).'
      : 'Switch to the <b>Music to Video</b> tab — no photo needed.';
    var look = 'Tap <b>Style template</b> and look for “' + wo.tpl + '” (the closest match) — or paste the description above into <b>Description</b>. Set <b>Ratio</b> to ' + fm.ratio + ', then tap <b>Generate Script</b>.';
    return [
      { h: 'Add your music', t: music },
      { h: le.id === 'me' ? 'Add your photo' : 'Skip the photo', t: lead },
      { h: 'Set the look & go', t: look }
    ];
  }

  /* Result-page copy that is identical in both variants (every product claim is in README.md > Claims table). */
  var COPY = {
    composeTitle: 'Putting your plan together…',
    recapLabels: ['World', 'Vibe', 'Star', 'Song', 'Format'],
    resultKicker: 'Your plan is ready',
    previewCaption: 'AI-generated sample clip — MuseGen makes your actual video from your song.',
    briefTitle: 'Your description',
    briefHint: 'Paste this into the Description box on MuseGen — you can edit it there.',
    stepsTitle: 'Three steps on MuseGen',
    expectTitle: 'What to expect',
    expect: [
      'You’ll be asked to sign in before you generate (Google sign-in is available).',
      'MuseGen’s AI agent writes the script first — usually 10–15 minutes. You can leave and come back; it’s saved under <b>My MVs</b>.',
      'You get a short preview video free. The full-length video uses credits, and if creation fails the credits are refunded.'
    ],
    ctaMain: 'Make my music video',
    ctaSub: 'Free to start · sign in to generate',
    songMakerPrompt: 'Rather write a brand-new song first?',
    songMakerLink: 'Try the AI Song Maker →',
    fine: 'AI-generated people and video. You must be 13 or older to use MuseGen. Free creations are for personal use — commercial rights come with a paid membership. Memberships renew automatically until you cancel in your account.',
    copy: 'Copy description', copied: 'Copied ✓', copyFailed: 'Selected — copy it', startOver: 'Start over',
    motionPause: 'Pause animations', motionPlay: 'Play animations'
  };

  window.MGSV_SHARED = {
    WORLDS: WORLDS, GENRES: GENRES, LEADS: LEADS, SONGS: SONGS, FORMATS: FORMATS, COPY: COPY,
    byId: byId, buildSteps: buildSteps
  };
})();
