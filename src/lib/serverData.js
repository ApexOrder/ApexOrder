export const servers = [
  {
    id: '7dtd',
    name: '7 Days to Die',
    tag: 'SURVIVAL',
    status: 'online',
    description: 'Brutal survival in a zombie-infested open world. Build, craft, and survive the blood moon hordes with your squad.',
    image: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/69a8e5c27_generated_505a873e.png',
    players: { current: 18, max: 32 },
    map: 'Navezgane',
    mods: ['Darkness Falls', 'Custom POIs', 'Vehicle Mods'],
    ip: 'play.apexorder.uk:26900',
    joinInstructions: 'Open 7 Days to Die, go to Connect to Server, and enter the IP address below. Make sure you have the required mods installed from our Downloads section.',
  },
  {
    id: 'fivem',
    name: 'FiveM RP',
    tag: 'ROLEPLAY',
    status: 'online',
    description: 'Premium roleplay experience in Los Santos. Custom scripts, active economy, and a dedicated police & EMS force.',
    image: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/e8f9654f8_generated_30634243.png',
    players: { current: 42, max: 64 },
    map: 'Los Santos',
    mods: ['Custom Vehicles', 'Economy+', 'Housing System'],
    ip: 'connect cfx.re/join/apexorder',
    joinInstructions: 'Install FiveM from fivem.net, then press F8 in-game and type the connect command below. Read our rules before your first session.',
  },
  {
    id: 'valheim',
    name: 'Valheim',
    tag: 'SURVIVAL',
    status: 'online',
    description: 'Conquer the Norse afterlife together. Custom world with extended raids, boss events, and community builds.',
    image: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/ff0cd4bb1_generated_4bdf616a.png',
    players: { current: 8, max: 16 },
    map: 'Midgard',
    mods: ['Valheim Plus', 'Epic Loot', 'Custom Enemies'],
    ip: 'play.apexorder.uk:2456',
    joinInstructions: 'Install the required Valheim Plus mod, then join using the IP and password shared in our Discord #valheim-server channel.',
  },
  {
    id: 'minecraft',
    name: 'Minecraft',
    tag: 'SANDBOX',
    status: 'online',
    description: 'Modded survival with custom plugins, land claims, economy, and regular community build events.',
    image: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/5d4963b86_generated_710294b4.png',
    players: { current: 24, max: 50 },
    map: 'Custom World',
    mods: ['Economy', 'Land Claims', 'Custom Enchants'],
    ip: 'mc.apexorder.uk',
    joinInstructions: 'Add mc.apexorder.uk to your Minecraft multiplayer server list. Java Edition 1.20+ required.',
  },
  {
    id: 'dayz',
    name: 'DayZ',
    tag: 'HARDCORE',
    status: 'online',
    description: 'Hardcore survival in the post-apocalyptic wasteland. Custom loot tables, base building, and PvP zones.',
    image: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/21ab09664_generated_9cffbae5.png',
    players: { current: 31, max: 60 },
    map: 'Chernarus',
    mods: ['Custom Weapons', 'Trader+', 'Base Building+'],
    ip: 'play.apexorder.uk:2302',
    joinInstructions: 'Search for "ApexOrder" in the DayZ server browser, or use DZSA Launcher for automatic mod installation.',
  },
  {
    id: 'coming-soon',
    name: 'More Coming Soon',
    tag: 'FUTURE',
    status: 'offline',
    description: 'We are always expanding. New game servers are in the works. Join our Discord to vote on the next title.',
    image: 'https://media.base44.com/images/public/6a300cbaaf30e01d8fac639e/1f051d805_generated_0123232c.png',
    players: { current: 0, max: 0 },
    map: 'TBA',
    mods: [],
    ip: null,
    joinInstructions: 'Stay tuned! Join our Discord to be the first to know when new servers launch.',
  },
];

export const communityRules = [
  { number: '01', title: 'Respect All Members', description: 'Treat every member with respect. No harassment, hate speech, discrimination, or personal attacks will be tolerated.' },
  { number: '02', title: 'No Cheating or Exploiting', description: 'Cheats, hacks, exploits, and unfair advantages are strictly forbidden across all servers.' },
  { number: '03', title: 'Fair Play', description: 'Play fair and within the spirit of each game. Griefing, trolling, and intentionally ruining others\' experience is not allowed.' },
  { number: '04', title: 'Follow Server Rules', description: 'Each server has specific rules. Read and follow them. Ignorance is not an excuse.' },
  { number: '05', title: 'English in Public Channels', description: 'Use English in public voice and text channels so everyone can participate in the conversation.' },
  { number: '06', title: 'No Spam or Advertising', description: 'No spamming, flooding, or advertising other communities without permission from staff.' },
  { number: '07', title: 'Listen to Staff', description: 'Moderators and admins have final say. Respect their decisions. Appeals can be filed through proper channels.' },
  { number: '08', title: 'Protect Privacy', description: 'Never share personal information about other members. Doxxing results in a permanent ban.' },
  { number: '09', title: 'Report Issues', description: 'Report rule violations, bugs, or concerns to staff through Discord tickets. Don\'t take matters into your own hands.' },
  { number: '10', title: 'Have Fun', description: 'We\'re all here for the same reason — to enjoy gaming together. Keep it fun, keep it fair, keep it legendary.' },
];

export const serverRules = {
  '7dtd': [
    'No destroying other players\' bases outside of PvP events',
    'Land claim blocks must be respected',
    'No blocking POIs or public areas',
    'Blood moon participation is encouraged but not mandatory',
  ],
  'fivem': [
    'Stay in character at all times in RP zones',
    'No random deathmatch (RDM) or vehicle deathmatch (VDM)',
    'Use /ooc for out-of-character communication',
    'New life rule: forget events leading to your death',
    'No cop-baiting or fail RP',
  ],
  'valheim': [
    'Shared resources in community chests are for everyone',
    'Mark your builds on the map',
    'No building within 50m of spawn or boss altars',
    'Coordinate boss fights in Discord',
  ],
  'minecraft': [
    'Claim your land before building',
    'No stealing from unclaimed builds',
    'PvP only in designated areas',
    'Keep the spawn area clean and accessible',
  ],
  'dayz': [
    'Safe zones are enforced — no weapons in trader areas',
    'No combat logging',
    'Base raiding allowed during raid hours only (Fri-Sun)',
    'No glitching into bases or using exploits',
  ],
};

export const downloads = [
  {
    game: '7 Days to Die',
    serverId: '7dtd',
    packs: [
      { name: 'Darkness Falls Overhaul', size: '2.4 GB', link: '#', description: 'Complete overhaul mod required to join our 7DTD server.' },
      { name: 'Custom POI Pack', size: '340 MB', link: '#', description: 'Additional points of interest for our custom map.' },
    ],
    guides: [
      { title: 'Server Setup Guide', description: 'Step-by-step guide to install mods and connect.' },
      { title: 'Darkness Falls Beginner Guide', description: 'Tips for surviving the expanded difficulty.' },
    ],
  },
  {
    game: 'FiveM',
    serverId: 'fivem',
    packs: [
      { name: 'FiveM Client', size: '—', link: 'https://fivem.net', description: 'Download the official FiveM client to play.' },
    ],
    guides: [
      { title: 'RP Quickstart Guide', description: 'Everything new players need to know about our RP server.' },
      { title: 'Character Creation Tips', description: 'Build a compelling character backstory.' },
    ],
  },
  {
    game: 'Valheim',
    serverId: 'valheim',
    packs: [
      { name: 'Valheim Plus Config', size: '12 MB', link: '#', description: 'Required mod config for our Valheim server.' },
      { name: 'Epic Loot Mod', size: '45 MB', link: '#', description: 'Adds legendary item drops and enchantments.' },
    ],
    guides: [
      { title: 'Mod Installation Guide', description: 'How to install all required Valheim mods.' },
    ],
  },
  {
    game: 'Minecraft',
    serverId: 'minecraft',
    packs: [
      { name: 'Resource Pack', size: '64 MB', link: '#', description: 'Custom textures and UI for our server.' },
    ],
    guides: [
      { title: 'Java Edition Setup', description: 'How to connect with the correct version.' },
      { title: 'Land Claim Guide', description: 'Protect your builds with our claim plugin.' },
    ],
  },
  {
    game: 'DayZ',
    serverId: 'dayz',
    packs: [
      { name: 'DZSA Launcher', size: '—', link: 'https://dayzsalauncher.com', description: 'Recommended launcher for automatic mod management.' },
      { name: 'Server Mod Collection', size: 'Auto', link: '#', description: 'All mods install automatically via Steam Workshop.' },
    ],
    guides: [
      { title: 'DayZ Beginner Guide', description: 'Survive your first day on our server.' },
      { title: 'Base Building Guide', description: 'How to build and maintain your base.' },
    ],
  },
];