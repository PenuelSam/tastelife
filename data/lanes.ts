/**
 * Content for the three lane pages (/fashion-design, /styling, /modeling).
 *
 * Media lives in /public/lanes/<slug>/ and is referenced from the site root,
 * e.g. public/lanes/styling/look.jpg → "/lanes/styling/look.jpg".
 * Items without `src` show a placeholder block until you add a file.
 *
 * Items fill the 14-slot scatter layout in components/lane/layout.ts in order,
 * repeating it for more than 14.
 */

export type LaneSlug = "fashion-design" | "styling" | "modeling";

export type LaneItem = {
  /** URL segment: /<lane>/<id> */
  id: string;
  /** Shown as [num] */
  num: string;
  kind: "image" | "video" | "card";
  src?: string;
  /** Videos: still shown before playback. */
  poster?: string;
  /** Videos: short muted loop for the gallery tile (5–8s, 720p, no audio). */
  clip?: string;
  alt: string;
  title: string;
  meta: string;
  /** Optional line above the credit, e.g. the comp card's agency. */
  date?: string;
  credit: string;
  description: string;
  /** The two-style name at the bottom of the detail panel. */
  nameScript: string;
  nameCaps: string;
  /** The media's proportions, e.g. "3 / 4". Landscape frames keep them in the grid. */
  aspect: string;
};

export type Lane = {
  slug: LaneSlug;
  title: string;
  /** How the hero title breaks on mobile. */
  titleLines: string[];
  items: LaneItem[];
};

// Desktop aspect ratios of the 14 scatter slots (see components/lane/layout.ts).
const ASPECTS = ["3 / 4", "2 / 3", "4 / 5", "1 / 1", "3 / 4", "2 / 3", "4 / 5", "3 / 2", "3 / 4", "2 / 3", "1 / 1", "3 / 4", "3 / 4", "4 / 5"];

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * A run of photos (or a film) from one project; every frame shares its caption.
 * `files` are names in public/lanes/<lane>/ with their proportions, e.g.
 * ["look.jpg", "3 / 4"]. Films are "<name>.mp4" with "<name>-poster.jpg" and
 * "<name>-clip.mp4" beside them. Landscape frames keep their shape in the grid.
 */
type Series = {
  files: [file: string, aspect: string][];
  title: string;
  meta: string;
  credit: string;
  description: string;
  nameScript: string;
  nameCaps: string;
};

function seriesItems(lane: LaneSlug, series: Series[], firstNum = 1): LaneItem[] {
  const items: LaneItem[] = [];
  for (const s of series) {
    s.files.forEach(([file, aspect], i) => {
      const num = pad(firstNum + items.length);
      const src = `/lanes/${lane}/${file}`;
      const isVideo = file.endsWith(".mp4");
      const base = src.replace(/\.mp4$/, "");
      const count = s.files.length > 1 ? ` (${i + 1} of ${s.files.length})` : "";
      items.push({
        id: num,
        num,
        kind: isVideo ? "video" : "image",
        src,
        poster: isVideo ? `${base}-poster.jpg` : undefined,
        clip: isVideo ? `${base}-clip.mp4` : undefined,
        alt: `${s.title}, ${s.credit}${isVideo ? ", film" : ""}${count}`,
        title: s.title,
        meta: s.meta,
        credit: s.credit,
        description: s.description,
        nameScript: s.nameScript,
        nameCaps: s.nameCaps,
        aspect,
      });
    });
  }
  return items;
}

/* ---------- Fashion design ---------- */
const fashionItems = seriesItems("fashion-design", [
  {
    files: [["blnde-custom-piece.jpg", "2 / 3"]],
    title: "Custom piece for Blnde",
    meta: "Custom piece",
    credit: "Designed for Blnde",
    description: "A custom piece I designed for Blnde.",
    nameScript: "Custom piece",
    nameCaps: "Blnde",
  },
  ...[1, 2, 3, 4, 5].map((n) => ({
    files: [[`tls-experimental-00${n}.jpg`, [1, 2, 4].includes(n) ? "4 / 3" : "3 / 4"]] as [string, string][],
    title: `Experimental piece 00${n}`,
    meta: "Tastelife Studio (TLS)",
    credit: "Designed for Tastelife Studio (TLS)",
    description: `Experimental piece 00${n} for my brand, Tastelife Studio (TLS).`,
    nameScript: "Experimental piece",
    nameCaps: `00${n}`,
  })),
  {
    files: [["kyla-session.jpg", "3 / 4"]],
    title: "Styling session with Kyla",
    meta: "Styling session",
    credit: "With Kyla",
    description: "A styling session with Kyla.",
    nameScript: "Styling session",
    nameCaps: "Kyla",
  },
  {
    files: [["undocumented-dress-skirt.jpg", "3 / 4"]],
    title: "Undocumented dress / skirt",
    meta: "Dress / skirt",
    credit: "Designed by me",
    description: "An undocumented dress / skirt I designed.",
    nameScript: "Dress / skirt",
    nameCaps: "Undocumented",
  },
]);

/* ---------- Styling ---------- */
const temifatade = {
  title: "Temifatade editorial",
  meta: "Editorial",
  credit: "Styled @_temifatade · Shot by @shawn.ik_",
  description: "I styled @_temifatade for an editorial shoot, shot by @shawn.ik_.",
  nameScript: "Editorial",
  nameCaps: "Temifatade",
};

const stylingItems = seriesItems("styling", [
  {
    files: [
      ["biker-girl-1.jpg", "4 / 5"],
      ["biker-girl-2.jpg", "4 / 5"],
      ["biker-girl-3.jpg", "4 / 5"],
    ],
    title: "Biker girl",
    meta: "Editorial · The Source",
    credit: "Styled Ashley Okoli (@ashh.ok) · The Source",
    description: "Biker girl: I styled Ashley Okoli (@ashh.ok) for an editorial shoot featured in her book, The Source.",
    nameScript: "Biker girl",
    nameCaps: "Ashley Okoli",
  },
  { files: [["temifatade-film-1.mp4", "16 / 9"]], ...temifatade, meta: "Editorial film" },
  {
    files: [
      ["the-source-1.jpg", "4 / 5"],
      ["the-source-2.jpg", "4 / 5"],
      ["the-source-3.jpg", "4 / 5"],
    ],
    title: "The Source",
    meta: "Editorial · The Source",
    credit: "Styled Ashley Okoli (@ashh.ok) · The Source",
    description: "I styled Ashley Okoli (@ashh.ok) for an editorial shoot featured in The Source book.",
    nameScript: "The Source",
    nameCaps: "Ashley Okoli",
  },
  {
    files: [
      ["temifatade-1.jpg", "3 / 4"],
      ["temifatade-2.jpg", "9 / 16"],
      ["temifatade-3.jpg", "9 / 16"],
    ],
    ...temifatade,
  },
  { files: [["temifatade-film-2.mp4", "16 / 9"]], ...temifatade, meta: "Editorial film" },
  {
    files: [
      ["steffaura-1.jpg", "16 / 9"],
      ["steffaura-2.jpg", "16 / 9"],
    ],
    title: "Steffaura editorial",
    meta: "Editorial",
    credit: "Styled @_steffaura_ · Shot by @shawn.ik_",
    description: "I styled @_steffaura_ for an editorial shoot by @shawn.ik_.",
    nameScript: "Editorial",
    nameCaps: "Steffaura",
  },
  {
    files: [["jobojones-1.jpg", "9 / 16"]],
    title: "Styling session with Jobojones",
    meta: "Styling session",
    credit: "With @mrjonesjobo",
    description: "A styling session with @mrjonesjobo.",
    nameScript: "Styling session",
    nameCaps: "Jobojones",
  },
]);

/* ---------- Modeling: the comp card ([00]) plus editorials ---------- */
const compCard: LaneItem = {
  id: "00",
  num: "00",
  kind: "card",
  alt: "Comp card",
  title: "Comp card",
  meta: "Stats · Measurements",
  date: "[Agency]",
  credit: "Comp card",
  description: "[availability]",
  nameScript: "Taiwo",
  nameCaps: "Adeoshun",
  aspect: ASPECTS[0],
};

const meraki = {
  title: "Muse for @merakibyonome",
  meta: "Muse",
  credit: "Muse for @merakibyonome",
  description: "Muse for @merakibyonome.",
  nameScript: "Muse for",
  nameCaps: "Merakibyonome",
};

const modelingItems = [
  compCard,
  ...seriesItems("modeling", [
    {
      files: [
        ["denim-after-dark-1.jpg", "3 / 4"],
        ["denim-after-dark-2.jpg", "3 / 4"],
        ["denim-after-dark-3.jpg", "3 / 4"],
        ["denim-after-dark-4.jpg", "3 / 4"],
        ["denim-after-dark-5.jpg", "4 / 5"],
        ["denim-after-dark-6.jpg", "4 / 5"],
      ],
      title: "Denim after dark",
      meta: "Shoot",
      credit: "Shot by @iyinoluwasokunbi",
      description: "Denim after dark, a shoot shot by @iyinoluwasokunbi.",
      nameScript: "Denim",
      nameCaps: "After dark",
    },
    { files: [["meraki-muse-film.mp4", "9 / 16"]], ...meraki },
    {
      files: [
        ["meraki-muse-1.jpg", "3 / 4"],
        ["meraki-muse-2.jpg", "3 / 4"],
        ["meraki-muse-3.jpg", "3 / 4"],
        ["meraki-muse-4.jpg", "3 / 4"],
      ],
      ...meraki,
    },
    {
      files: [
        ["la-fille-en-rouge-1.jpg", "2 / 3"],
        ["la-fille-en-rouge-2.jpg", "2 / 3"],
        ["la-fille-en-rouge-3.jpg", "4 / 3"],
      ],
      title: "La fille en rouge",
      meta: "Muse",
      credit: "Muse for @merakibyonome",
      description: "La fille en rouge: muse for @merakibyonome.",
      nameScript: "La fille",
      nameCaps: "En rouge",
    },
    {
      files: [
        ["fall-back-in-your-arms-1.jpg", "3 / 2"],
        ["fall-back-in-your-arms-2.jpg", "3 / 2"],
        ["fall-back-in-your-arms-3.jpg", "3 / 2"],
        ["fall-back-in-your-arms-4.jpg", "4 / 3"],
        ["fall-back-in-your-arms-5.jpg", "3 / 2"],
      ],
      title: "Fall Back in Your Arms",
      meta: "Video vixen · Music visual",
      credit: "Joeboy, Wizard Chan and Braye",
      description: "Video vixen for the visual of “Fall Back in Your Arms” by Joeboy, Wizard Chan and Braye.",
      nameScript: "Video vixen",
      nameCaps: "Fall back in your arms",
    },
    {
      files: [
        ["femi-johnson-bts-1.jpg", "3 / 4"],
        ["femi-johnson-bts-2.jpg", "4 / 3"],
      ],
      title: "Music visual BTS",
      meta: "Behind the scenes",
      credit: "Short music visual by Femi Johnson",
      description: "A behind-the-scenes shot from a short music visual by Femi Johnson.",
      nameScript: "Behind the scenes",
      nameCaps: "Femi Johnson",
    },
    {
      files: [
        ["crack-is-whack-1.jpg", "3 / 2"],
        ["crack-is-whack-2.jpg", "3 / 2"],
        ["crack-is-whack-3.jpg", "3 / 2"],
      ],
      title: "Crack is whack",
      meta: "Editorial",
      credit: "Shot by @shawn.ik_",
      description: "Crack is whack, an editorial shoot by @shawn.ik_.",
      nameScript: "Editorial",
      nameCaps: "Crack is whack",
    },
  ]),
];

export const lanes: Record<LaneSlug, Lane> = {
  "fashion-design": { slug: "fashion-design", title: "Fashion Design", titleLines: ["Fashion", "Design"], items: fashionItems },
  styling: { slug: "styling", title: "Styling", titleLines: ["Styling"], items: stylingItems },
  modeling: { slug: "modeling", title: "Modeling", titleLines: ["Modeling"], items: modelingItems },
};

/**
 * Items that are shown: anything with a photo or film, plus the comp card.
 * Placeholder items (no src yet) stay hidden until you add their media.
 */
export function visibleItems(lane: Lane): LaneItem[] {
  return lane.items.filter((item) => item.kind === "card" || Boolean(item.src));
}

/** Fashion → Styling → Modeling → Fashion Design */
export const nextLane: Record<LaneSlug, LaneSlug> = {
  "fashion-design": "styling",
  styling: "modeling",
  modeling: "fashion-design",
};

/** Comp card stats shown in the card's detail panel. */
export const compCardStats: [label: string, value: string][] = [
  ["Height", "5’5”"],
  ["Bust", "34 in"],
  ["Waist", "24 in"],
  ["Hips", "34 in"],
  ["Shoes", "40"],
  ["Hair/Eyes", "Black / Brown"],
];

export const BOOKING_EMAIL = "tastelifeis@gmail.com";
