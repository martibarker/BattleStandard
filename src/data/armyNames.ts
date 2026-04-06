/**
 * Faction-specific army name generators.
 * Each faction exposes a `generate()` function that returns a flavourful random name.
 */

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

// ---------------------------------------------------------------------------
// The Empire of Man
// ---------------------------------------------------------------------------

const EMPIRE_SURNAMES = [
  'Von Altenhof', 'Von Braüner', 'Von Kleist', 'Von Kessler', 'Von Raukov',
  'Von Bildhofen', 'Von Krieglitz', 'Holt', 'Steiner', 'Richter',
  'Brauer', 'Werner', 'Sturm', 'Müller', 'Schmidt', 'Wagner',
  'Bauer', 'Koch', 'Hoffmann', 'Schäfer', 'Neumann', 'Schwarz',
  'Grünwald', 'Eisenhardt', 'Krüger', 'Hammerfell', 'Stahlberg',
];

const EMPIRE_PROVINCES = [
  'Reikland', 'Nuln', 'Altdorf', 'Talabheim', 'Middenheim',
  'Wissenland', 'Averland', 'Stirland', 'Ostermark', 'Hochland',
  'Nordland', 'Ostland', 'Wurtbad', 'the Reikwald', 'Carroburg',
];

const EMPIRE_REGIMENT_TYPES = [
  'Greatswords', 'Halberdiers', 'Swordsmen', 'Handgunners',
  'Crossbowmen', 'Knights', 'Pistoliers', 'Outriders',
  'Free Company', 'State Troops', 'Reiksguard',
  'Demigryph Knights', 'Artillery Train', 'Irregulars',
];

const EMPIRE_ADJECTIVES = [
  'Iron', 'Golden', 'Silver', 'Righteous', 'Holy', 'Glorious',
  'Eternal', 'Resolute', 'Stalwart', 'Faithful', 'Steel',
  'Thunder', 'Crimson', 'Black', 'White', 'Scarlet',
  'Hammer', 'Blazing', 'Blessed', 'Undaunted',
];

const EMPIRE_NOUNS = [
  'Host', 'Guard', 'Legion', 'Company', 'Vanguard',
  'Brotherhood', 'Order', 'Warband', 'Cohort', 'Retinue',
];

const EMPIRE_TITLES = [
  'General', 'Elector Count', 'Marshal', 'Grand Master',
  'Captain-General', 'Herr', 'Ritter', 'Hauptmann',
];

function generateEmpireName(): string {
  const format = Math.floor(Math.random() * 4);
  switch (format) {
    case 0:
      // Von Kleist's 2nd Greatswords of Reikland
      return `${pick(EMPIRE_SURNAMES)}'s ${ordinal(Math.ceil(Math.random() * 5))} ${pick(EMPIRE_REGIMENT_TYPES)} of ${pick(EMPIRE_PROVINCES)}`;
    case 1:
      // The Iron Halberdiers of Middenheim
      return `The ${pick(EMPIRE_ADJECTIVES)} ${pick(EMPIRE_REGIMENT_TYPES)} of ${pick(EMPIRE_PROVINCES)}`;
    case 2:
      // The Stalwart Host of Nuln
      return `The ${pick(EMPIRE_ADJECTIVES)} ${pick(EMPIRE_NOUNS)} of ${pick(EMPIRE_PROVINCES)}`;
    case 3:
    default:
      // Captain-General Richter's Altdorf Guard
      return `${pick(EMPIRE_TITLES)} ${pick(EMPIRE_SURNAMES)}'s ${pick(EMPIRE_PROVINCES)} ${pick(EMPIRE_NOUNS)}`;
  }
}

// ---------------------------------------------------------------------------
// Kingdom of Bretonnia
// ---------------------------------------------------------------------------

const BRET_SURNAMES = [
  'De Garamont', 'De Montfort', 'De Quenelles', 'De Brionne', 'Du Clos',
  'De Lisle', 'Du Bois', 'De la Roche', 'De Sangreal', 'De Courcy',
  'De Montclair', 'De Beaumont', 'De Carcassonne', 'Du Lac', 'De Bordeleaux',
  'De Bastonne', 'De Lyonesse', 'De Parravon', 'De Malhon', 'Du Massif',
];

const BRET_DUKEDOMS = [
  'Quenelles', 'L\'Anguille', 'Gisoreux', 'Carcassonne', 'Lyonesse',
  'Bordeleaux', 'Brionne', 'Aquitaine', 'Parravon', 'Montfort',
  'Bastonne', 'Couronne', 'Artois', 'Mousillon',
];

const BRET_REGIMENT_TYPES = [
  'Knights Errant', 'Knights of the Realm', 'Questing Knights',
  'Grail Knights', 'Pegasus Knights', 'Battle Pilgrims',
  'Men-at-Arms', 'Peasant Levy', 'Mounted Yeomen',
];

const BRET_ADJECTIVES = [
  'Noble', 'Valiant', 'Sacred', 'Blessed', 'Gallant', 'Virtuous',
  'Righteous', 'Pious', 'Honourable', 'Holy', 'Glorious', 'Undaunted',
  'Chivalrous', 'Devoted', 'Steadfast',
];

const BRET_NOUNS = [
  'Host', 'Crusade', 'Errantry', 'Brotherhood', 'Order',
  'Vanguard', 'Retinue', 'Company', 'Warband', 'Fellowship',
];

const BRET_TITLES = [
  'Duke', 'Baron', 'Paladin', 'Lord', 'Chevalier', 'Knight-Errant',
];

function generateBretonnaName(): string {
  const format = Math.floor(Math.random() * 4);
  switch (format) {
    case 0:
      // Baron De Montfort's Lyonesse Crusade
      return `${pick(BRET_TITLES)} ${pick(BRET_SURNAMES)}'s ${pick(BRET_DUKEDOMS)} ${pick(BRET_NOUNS)}`;
    case 1:
      // The Valiant Knights of the Realm of Carcassonne
      return `The ${pick(BRET_ADJECTIVES)} ${pick(BRET_REGIMENT_TYPES)} of ${pick(BRET_DUKEDOMS)}`;
    case 2:
      // The Sacred Errantry of Bastonne
      return `The ${pick(BRET_ADJECTIVES)} ${pick(BRET_NOUNS)} of ${pick(BRET_DUKEDOMS)}`;
    case 3:
    default:
      // De Sangreal's 3rd Knights Errant of Quenelles
      return `${pick(BRET_SURNAMES)}'s ${ordinal(Math.ceil(Math.random() * 5))} ${pick(BRET_REGIMENT_TYPES)} of ${pick(BRET_DUKEDOMS)}`;
  }
}

// ---------------------------------------------------------------------------
// High Elf Realms
// ---------------------------------------------------------------------------

const HEF_NAMES = [
  'Tharion', 'Aerisyn', 'Valarien', 'Calenith', 'Idranel',
  'Merethi', 'Aethril', 'Larendar', 'Caelisthar', 'Veranthos',
  'Elaraneth', 'Sylvaris', 'Talorien', 'Aerethis', 'Calidris',
];

const HEF_CITIES = [
  'Lothern', 'Caledor', 'Chrace', 'Cothique', 'Ellyrion',
  'Eataine', 'Avelorn', 'Tiranoc', 'Nagarythe', 'Saphery',
  'Yvresse', 'Ulthuan', 'the Shrine of Asuryan',
];

const HEF_REGIMENT_TYPES = [
  'Spearmen', 'Archers', 'Silver Helms', 'Dragon Princes',
  'Lion Guard', 'Phoenix Guard', 'White Lions', 'Swordmasters',
  'Shadow Warriors', 'Ellyrion Reavers',
];

const HEF_ADJECTIVES = [
  'Ancient', 'Noble', 'Radiant', 'Exalted', 'Silver', 'Gilded',
  'Eternal', 'Sacred', 'Proud', 'Sunlit', 'Glorious', 'Undying',
];

const HEF_NOUNS = [
  'Host', 'Guard', 'Kindred', 'Legion', 'Vanguard',
  'Brotherhood', 'Company', 'Fellowship',
];

const HEF_TITLES = [
  'Prince', 'Archmage', 'Noble', 'Commander', 'Lord', 'Highborn',
];

function generateHighElfName(): string {
  const format = Math.floor(Math.random() * 4);
  switch (format) {
    case 0:
      return `${pick(HEF_TITLES)} ${pick(HEF_NAMES)}'s ${pick(HEF_CITIES)} ${pick(HEF_NOUNS)}`;
    case 1:
      return `The ${pick(HEF_ADJECTIVES)} ${pick(HEF_REGIMENT_TYPES)} of ${pick(HEF_CITIES)}`;
    case 2:
      return `The ${pick(HEF_ADJECTIVES)} ${pick(HEF_NOUNS)} of ${pick(HEF_CITIES)}`;
    case 3:
    default:
      return `${pick(HEF_NAMES)}'s ${ordinal(Math.ceil(Math.random() * 5))} ${pick(HEF_REGIMENT_TYPES)} of ${pick(HEF_CITIES)}`;
  }
}

// ---------------------------------------------------------------------------
// Wood Elf Realms
// ---------------------------------------------------------------------------

const WEF_NAMES = [
  'Araloth', 'Yeneth', 'Ceithin-Har', 'Naieth', 'Sildahn',
  'Coeddil', 'Scarloc', 'Drycha', 'Atharti', 'Shadowfast',
  'Modryn', 'Cythral', 'Wybeline', 'Talsyn', 'Aerandir',
];

const WEF_GLADES = [
  'Athel Loren', 'the Wildwood', 'the Oak of Ages', 'Talsyn',
  'Atharti', 'Yeneth', 'Cythral', 'Modryn', 'Sildahn', 'Wybeline',
  'the Eternal Glade', 'the Branchwraith\'s Glade',
];

const WEF_REGIMENT_TYPES = [
  'Glade Guard', 'Glade Riders', 'Wild Riders', 'Wardancers',
  'Waywatchers', 'Dryads', 'Tree Kin', 'Scouts',
];

const WEF_ADJECTIVES = [
  'Ancient', 'Eternal', 'Wild', 'Shadowed', 'Moonlit', 'Swift',
  'Verdant', 'Sylvan', 'Dusk-sworn', 'Dawn-lit', 'Untamed',
];

const WEF_NOUNS = [
  'Host', 'Hunt', 'Kindred', 'Conclave', 'Warband',
  'Assembly', 'Wardens', 'Fellowship',
];

const WEF_TITLES = [
  'Glade Lord', 'Spellweaver', 'Branchwych', 'Glade Captain',
  'Shadowdancer', 'Treeman Ancient',
];

function generateWoodElfName(): string {
  const format = Math.floor(Math.random() * 4);
  switch (format) {
    case 0:
      return `${pick(WEF_TITLES)} ${pick(WEF_NAMES)}'s ${pick(WEF_NOUNS)} of ${pick(WEF_GLADES)}`;
    case 1:
      return `The ${pick(WEF_ADJECTIVES)} ${pick(WEF_REGIMENT_TYPES)} of ${pick(WEF_GLADES)}`;
    case 2:
      return `The ${pick(WEF_ADJECTIVES)} ${pick(WEF_NOUNS)} of ${pick(WEF_GLADES)}`;
    case 3:
    default:
      return `${pick(WEF_NAMES)}'s ${pick(WEF_ADJECTIVES)} ${pick(WEF_NOUNS)}`;
  }
}

// ---------------------------------------------------------------------------
// Dwarfen Mountain Holds
// ---------------------------------------------------------------------------

const DWARF_SURNAMES = [
  'Ironhammer', 'Grimstone', 'Copperbeard', 'Boldtusk', 'Stonemantle',
  'Greybeard', 'Durinson', 'Bryndarson', 'Ungrimson', 'Thordaksson',
  'Kazadorsson', 'Rockfist', 'Deepdelver', 'Ironvault', 'Oathkeeper',
];

const DWARF_HOLDS = [
  'Karaz-a-Karak', 'Karak Kadrin', 'Karak Eight Peaks', 'Karak Azul',
  'Zhufbar', 'Barak Varr', 'Karak Hirn', 'Karak Norn',
  'Karak Izor', 'Karak Zorn', 'Karak Drazh',
];

const DWARF_REGIMENT_TYPES = [
  'Hammerers', 'Ironbreakers', 'Irondrakes', 'Quarrellers',
  'Thunderers', 'Miners', 'Slayers', 'Longbeards',
  'Warriors', 'Gyrocopter Squadron',
];

const DWARF_ADJECTIVES = [
  'Iron', 'Granite', 'Ancient', 'Honoured', 'Oathbound',
  'Steadfast', 'Unyielding', 'Eternal', 'Resolute', 'Grudge-sworn',
];

const DWARF_NOUNS = [
  'Throng', 'Hold', 'Brotherhood', 'Grudge Company',
  'Clan', 'Kinband', 'Warband', 'Legion',
];

const DWARF_TITLES = [
  'King', 'Thane', 'Runesmith', 'High Engineer',
  'Longbeard Elder', 'Slayer King',
];

function generateDwarfName(): string {
  const format = Math.floor(Math.random() * 4);
  switch (format) {
    case 0:
      return `${pick(DWARF_TITLES)} ${pick(DWARF_SURNAMES)}'s ${pick(DWARF_HOLDS)} ${pick(DWARF_NOUNS)}`;
    case 1:
      return `The ${pick(DWARF_ADJECTIVES)} ${pick(DWARF_REGIMENT_TYPES)} of ${pick(DWARF_HOLDS)}`;
    case 2:
      return `The ${pick(DWARF_ADJECTIVES)} ${pick(DWARF_NOUNS)} of ${pick(DWARF_HOLDS)}`;
    case 3:
    default:
      return `${pick(DWARF_SURNAMES)}'s ${ordinal(Math.ceil(Math.random() * 5))} ${pick(DWARF_REGIMENT_TYPES)} of ${pick(DWARF_HOLDS)}`;
  }
}

// ---------------------------------------------------------------------------
// Orc & Goblin Tribes
// ---------------------------------------------------------------------------

const ORC_NAMES = [
  'Urzag', 'Wurrk', 'Skragga', 'Grubmaw', 'Grotsnag',
  'Bogrot', 'Muzgash', 'Skullbasha', 'Bigtoof', 'Skarfang',
  'Zarbag', 'Grimtusk', 'Duffskull', 'Nazgrok', 'Gorgrot',
];

const ORC_TRIBES = [
  'Da Bonecruncha Tribe', 'Da Ironskulls', 'Da Bloodfang Boyz',
  'Da Red Eye Mob', 'Da Broken Tusk Clan', 'Da Bad Moon Tribe',
  'Da Crooked Fang Boys', 'Da Skullkrumpa Horde', 'Da Grimfang Boyz',
  'Da Waaagh!',
];

const ORC_REGIMENT_TYPES = [
  'Boyz', 'Big \'Uns', 'Arrer Boyz', 'Savage Orcs',
  'Black Orcs', 'Wolf Riders', 'Spider Riders',
  'Night Goblins', 'Forest Goblins', 'Squig Herd',
];

const ORC_ADJECTIVES = [
  'Da Big', 'Da Stompin\'', 'Da Krushin\'', 'Da Smashin\'',
  'Da Bloodthirsty', 'Da Rampaging', 'Da Unstoppable',
];

const ORC_NOUNS = [
  'Waaagh!', 'Horde', 'Mob', 'Rabble', 'Warband',
  'Stompers', 'Krumpers',
];

const ORC_TITLES = [
  'Warboss', 'Big Boss', 'Warchief', 'Great Shaman',
  'Black Orc Boss',
];

function generateOrcName(): string {
  const format = Math.floor(Math.random() * 4);
  switch (format) {
    case 0:
      return `${pick(ORC_TITLES)} ${pick(ORC_NAMES)}'s ${pick(ORC_NOUNS)}`;
    case 1:
      return `${pick(ORC_TRIBES)}`;
    case 2:
      return `${pick(ORC_ADJECTIVES)} ${pick(ORC_REGIMENT_TYPES)} of ${pick(ORC_NAMES)}`;
    case 3:
    default:
      return `${pick(ORC_TITLES)} ${pick(ORC_NAMES)}'s ${pick(ORC_ADJECTIVES)} ${pick(ORC_NOUNS)}`;
  }
}

// ---------------------------------------------------------------------------
// Warriors of Chaos
// ---------------------------------------------------------------------------

const CHAOS_NAMES = [
  'Vordrek', 'Kalgrath', 'Valkara', 'Thurak', 'Narvald',
  'Skjarl', 'Volgrath', 'Hrothgar', 'Valdris', 'Karnak',
  'Ulfrik', 'Morkar', 'Skaeling', 'Vorghast', 'Drakar',
];

const CHAOS_GODS = [
  'Khorne', 'Tzeentch', 'Nurgle', 'Slaanesh',
  'the Dark Gods', 'Chaos Undivided',
];

const CHAOS_ORIGINS = [
  'Norsca', 'the Chaos Wastes', 'the Frozen North',
  'the Norse Peaks', 'the Blighted Isle', 'Troll Country',
];

const CHAOS_REGIMENT_TYPES = [
  'Chaos Warriors', 'Chaos Knights', 'Marauders', 'Chosen',
  'Forsaken', 'Chaos Ogres', 'Warhounds',
];

const CHAOS_ADJECTIVES = [
  'Crimson', 'Iron', 'Bloodied', 'Doomed', 'Savage', 'Fell',
  'Wrathful', 'Cursed', 'Infernal', 'Dark', 'Eternal', 'Burning',
];

const CHAOS_NOUNS = [
  'Host', 'Horde', 'Warband', 'Legion', 'Chosen',
  'Reavers', 'Vanguard', 'Ravagers',
];

const CHAOS_TITLES = [
  'Chaos Lord', 'Exalted Hero', 'Sorcerer Lord',
  'Daemon Prince', 'Warleader', 'Champion',
];

function generateChaosName(): string {
  const format = Math.floor(Math.random() * 4);
  switch (format) {
    case 0:
      return `${pick(CHAOS_TITLES)} ${pick(CHAOS_NAMES)}'s ${pick(CHAOS_ADJECTIVES)} ${pick(CHAOS_NOUNS)}`;
    case 1:
      return `The ${pick(CHAOS_ADJECTIVES)} ${pick(CHAOS_REGIMENT_TYPES)} of ${pick(CHAOS_GODS)}`;
    case 2:
      return `The ${pick(CHAOS_ADJECTIVES)} ${pick(CHAOS_NOUNS)} of ${pick(CHAOS_ORIGINS)}`;
    case 3:
    default:
      return `${pick(CHAOS_NAMES)}'s ${pick(CHAOS_NOUNS)} of ${pick(CHAOS_GODS)}`;
  }
}

// ---------------------------------------------------------------------------
// Beastmen Brayherds
// ---------------------------------------------------------------------------

const BEAST_NAMES = [
  'Gorthar', 'Kraavox', 'Ungrul Four-Horn', 'Morghur', 'Targrul',
  'Skrag', 'Grothnar', 'Vaarkul', 'Bolgrak', 'Druul',
  'Thurvak', 'Morghast', 'Ravok', 'Skulkrak', 'Durgul',
];

const BEAST_FORESTS = [
  'the Drakwald', 'the Dark Forest', 'the Gloaming Wood',
  'the Unlit Forest', 'the Wildwood', 'the Beastwood',
  'the Forest of Shadows', 'Athel Loren\'s Edge',
];

const BEAST_REGIMENT_TYPES = [
  'Gors', 'Ungors', 'Bestigors', 'Minotaurs',
  'Centigors', 'Razorgors', 'Chaos Hounds',
];

const BEAST_ADJECTIVES = [
  'Dark', 'Savage', 'Moon-blessed', 'Wild', 'Frenzied',
  'Horned', 'Fell', 'Blood-mad', 'Cursed', 'Rampaging', 'Primordial',
];

const BEAST_NOUNS = [
  'Brayherd', 'Horde', 'Warband', 'Gor-kindred',
  'Ambush', 'Host', 'Ravagers',
];

const BEAST_TITLES = [
  'Beastlord', 'Great Bray-Shaman', 'Wargor',
  'Doombull', 'Gorebull',
];

function generateBeastmenName(): string {
  const format = Math.floor(Math.random() * 4);
  switch (format) {
    case 0:
      return `${pick(BEAST_TITLES)} ${pick(BEAST_NAMES)}'s ${pick(BEAST_ADJECTIVES)} ${pick(BEAST_NOUNS)}`;
    case 1:
      return `The ${pick(BEAST_ADJECTIVES)} ${pick(BEAST_REGIMENT_TYPES)} of ${pick(BEAST_FORESTS)}`;
    case 2:
      return `The ${pick(BEAST_ADJECTIVES)} ${pick(BEAST_NOUNS)} of ${pick(BEAST_FORESTS)}`;
    case 3:
    default:
      return `${pick(BEAST_NAMES)}'s ${pick(BEAST_ADJECTIVES)} ${pick(BEAST_REGIMENT_TYPES)}`;
  }
}

// ---------------------------------------------------------------------------
// Tomb Kings of Khemri
// ---------------------------------------------------------------------------

const TOMB_NAMES = [
  'Amenhotep', 'Kheparak', 'Userkara', 'Ramhati', 'Setephret',
  'Thutmose', 'Amunset', 'Neferkhara', 'Khatepra', 'Phakthis',
  'Zarkhesh', 'Imrathep', 'Nephrekh', 'Akenaten', 'Mentukhara',
];

const TOMB_CITIES = [
  'Khemri', 'Quatar', 'Numas', 'Zandri', 'Lybaras',
  'Mahrak', 'Lahmia', 'Bhagar', 'Ka-Sabar', 'Bel Aliad',
];

const TOMB_REGIMENT_TYPES = [
  'Skeleton Warriors', 'Skeleton Archers', 'Skeleton Horsemen',
  'Skeleton Chariots', 'Tomb Guard', 'Ushabti',
  'Carrion', 'Necropolis Knights',
];

const TOMB_ADJECTIVES = [
  'Ancient', 'Eternal', 'Cursed', 'Undying', 'Vengeful',
  'Immortal', 'Timeless', 'Risen', 'Deathless', 'Desiccated',
];

const TOMB_NOUNS = [
  'Host', 'Legion', 'Phalanx', 'Guard',
  'Vanguard', 'Throng', 'Army',
];

const TOMB_TITLES = [
  'Tomb King', 'High Liche Priest', 'Warden',
  'Great King', 'Tomb Prince',
];

function generateTombKingsName(): string {
  const format = Math.floor(Math.random() * 4);
  switch (format) {
    case 0:
      return `${pick(TOMB_TITLES)} ${pick(TOMB_NAMES)}'s ${pick(TOMB_ADJECTIVES)} ${pick(TOMB_NOUNS)} of ${pick(TOMB_CITIES)}`;
    case 1:
      return `The ${pick(TOMB_ADJECTIVES)} ${pick(TOMB_REGIMENT_TYPES)} of ${pick(TOMB_CITIES)}`;
    case 2:
      return `The ${pick(TOMB_ADJECTIVES)} ${pick(TOMB_NOUNS)} of ${pick(TOMB_CITIES)}`;
    case 3:
    default:
      return `${pick(TOMB_NAMES)}'s ${pick(TOMB_ADJECTIVES)} ${pick(TOMB_REGIMENT_TYPES)}`;
  }
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const GENERATORS: Record<string, () => string> = {
  'empire-of-man': generateEmpireName,
  'kingdom-of-bretonnia': generateBretonnaName,
  'high-elf-realms': generateHighElfName,
  'wood-elf-realms': generateWoodElfName,
  'dwarfen-mountain-holds': generateDwarfName,
  'orc-and-goblin-tribes': generateOrcName,
  'warriors-of-chaos': generateChaosName,
  'beastmen-brayherds': generateBeastmenName,
  'tomb-kings-of-khemri': generateTombKingsName,
};

export function generateArmyName(factionId: string): string {
  const gen = GENERATORS[factionId];
  return gen ? gen() : 'New Army';
}
