import clsx from "clsx";
import {
  BeakerIcon,
  FaceSmileIcon,
  FireIcon,
  GlobeAmericasIcon,
  HeartIcon,
  HomeModernIcon,
  LightBulbIcon,
  MoonIcon,
  MusicalNoteIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  SwatchIcon,
  WifiIcon,
} from "@heroicons/react/24/outline";

const heroHighlights = [
  {
    title: "Thoughtful textures",
    description: "Memory foam, washable boucle, and cool-to-touch slate keep every paw pampered.",
    icon: SparklesIcon,
  },
  {
    title: "Holistic comfort",
    description: "Circadian lighting, aroma therapy, and soundscapes shift with your pup's energy.",
    icon: SunIcon,
  },
  {
    title: "Effortless care",
    description: "Hidden storage, smart cleaning, and wellness monitoring give you peace of mind.",
    icon: ShieldCheckIcon,
  },
];

const layoutZones = [
  {
    title: "Cloud Nine Lounge",
    description:
      "A sunken cuddle pit with temperature-reactive gel memory foam, reinforced bolsters, and a built-in treat drawer for slow-release rewards.",
    icon: HomeModernIcon,
    layout: "col-span-2 row-span-2",
    gradient: "from-brand-cream via-white to-brand-bubble/40",
  },
  {
    title: "Adventure Nook",
    description:
      "Modular climbing shelves with replaceable natural fiber scratch pads and scent discovery cubes that rotate weekly.",
    icon: GlobeAmericasIcon,
    layout: "col-span-2",
    gradient: "from-brand-sunshine/60 via-brand-bubble/40 to-brand-lavender/40",
  },
  {
    title: "Hydro Bar",
    description:
      "Filtered triple-bowl station with gentle bubbling hydration, collagen broth dispenser, and smart reminders to refresh.",
    icon: BeakerIcon,
    layout: "row-span-2",
    gradient: "from-brand-mint/40 via-white to-brand-blue/40",
  },
  {
    title: "Serenity Suite",
    description:
      "Sound-dampening den lined with eucalyptus infused linens, heartbeat-mimicking pillow, and amber night glow.",
    icon: MoonIcon,
    gradient: "from-brand-lavender/40 via-white to-brand-bubble/30",
  },
  {
    title: "Play Pulse Corridor",
    description:
      "Interactive runway with pressure-responsive paw lights, agility tunnels, and treat-confetti bursts for celebratory zoomies.",
    icon: FireIcon,
    layout: "col-span-2",
    gradient: "from-brand-bubble/50 via-brand-sunshine/50 to-brand-mint/40",
  },
];

const amenities = [
  {
    title: "Sensory spa",
    icon: HeartIcon,
    description:
      "Aromatherapy diffusers blend chamomile, lavender, and vetiver with real-time adjustments based on heart rate and mood cues.",
    highlights: [
      "Steam-free micro-mist for coat hydration",
      "Warm stone wall with kneadable texture",
      "Calming pheromone halos hidden in the crown moulding",
    ],
  },
  {
    title: "Atmospheric storytelling",
    icon: MusicalNoteIcon,
    description:
      "Directional soundscapes and kinetic lighting evolve from sunrise vitality to twilight lullabies to mirror a perfect day in the park.",
    highlights: [
      "360º audio with curated playlists",
      "Adaptive skylight ceiling projecting gentle skies",
      "Interactive shadow play wall for nose-boops",
    ],
  },
  {
    title: "Smart stewardship",
    icon: WifiIcon,
    description:
      "Invisible sensors watch for wellness cues, track naps, and automatically prep the room for your pup's favorite rituals.",
    highlights: [
      "Self-cleaning turf tray with UV refresh",
      "Air quality tuning with whisper-quiet filtration",
      "Companion app timeline and celebration reels",
    ],
  },
];

const palette = [
  {
    name: "Moonlit Marshmallow",
    hex: "#F8F6F1",
    finish: "Matte limewash walls",
    description: "Softens daylight and reflects a warm, calming glow across plush textures.",
  },
  {
    name: "Bubble Sorbet",
    hex: "#FF66C4",
    finish: "High-sheen lacquer accents",
    description: "Playful pops outlining cabinetry, lighting trims, and the agility runway.",
  },
  {
    name: "Aurora Mint",
    hex: "#31D8AF",
    finish: "Powder-coated steel",
    description: "Used for modular shelving, swing arm lamps, and tech housings.",
  },
  {
    name: "Sunrise Amber",
    hex: "#FFD166",
    finish: "Velvet drapery + floor pillows",
    description: "Keeps the room radiant while framing the serenity suite.",
  },
];

const experiences = [
  {
    time: "7:30",
    label: "Golden hour wake up",
    description:
      "Soft sunrise wash lights activate while the hydro bar dispenses warm broth and the soundtrack cues birdsong.",
    icon: SunIcon,
  },
  {
    time: "13:00",
    label: "Play pulse",
    description:
      "Adventure Nook cycles new scents, agility pods illuminate, and the treat confetti bursts celebrate completed quests.",
    icon: FireIcon,
  },
  {
    time: "18:45",
    label: "Serenity ritual",
    description:
      "Lights dip to amber, aromatherapy shifts to lavender, and heartbeat pillows sync to a resting rhythm for cuddle time.",
    icon: MoonIcon,
  },
];

const wellbeing = [
  {
    title: "Clean air cocoon",
    description:
      "Triple filtration with plant-based bio walls and CO₂ sensing ensures the freshest, allergen-free sniffs.",
  },
  {
    title: "Sustainable luxury",
    description:
      "Every textile is recycled, vegan, and machine washable so indulgence never compromises care.",
  },
  {
    title: "Joyful cohabitation",
    description:
      "Sliding acoustic partitions let you join the fun or grant independence without sacrificing style.",
  },
];

export const metadata = {
  title: "The Ultimate Dog Room | Scruffy Butts",
  description: "Design vision for the most joyful, immersive dog room experience imaginable.",
};

export default function DogRoomPage() {
  return (
    <div className="relative pb-24">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-32 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full bg-brand-bubble/25 blur-[180px]" />
        <div className="absolute bottom-0 left-12 h-[22rem] w-[22rem] rounded-full bg-brand-mint/25 blur-[160px]" />
        <div className="absolute right-12 top-1/3 h-[24rem] w-[24rem] rounded-full bg-brand-sunshine/20 blur-[140px]" />
      </div>

      <section className="relative px-6 pt-20">
        <div className="mx-auto max-w-6xl">
          <div className="relative overflow-hidden rounded-[3.5rem] bg-white/95 p-10 text-brand-navy shadow-soft sm:p-16">
            <div className="absolute -top-20 right-16 h-40 w-40 rounded-full bg-brand-bubble/20 blur-3xl" />
            <div className="absolute -bottom-24 left-12 h-48 w-48 rounded-full bg-brand-mint/30 blur-3xl" />
            <div className="relative grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-start">
              <div className="space-y-8">
                <span className="inline-flex items-center gap-2 rounded-full bg-brand-bubble/10 px-5 py-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-bubble">
                  Dog room of dreams
                </span>
                <div className="space-y-5">
                  <h1 className="text-4xl font-black leading-tight sm:text-5xl lg:text-6xl">
                    The ultimate sanctuary where design, wellness, and play collide for your pup.
                  </h1>
                  <p className="text-lg text-brand-navy/80 sm:text-xl">
                    Imagine a space crafted like a boutique hotel suite—responsive lighting, curated textures, and immersive play zones, all choreographed to celebrate every wiggle, nap, and zoomie.
                  </p>
                </div>
                <div className="flex flex-wrap gap-4">
                  <button className="rounded-full bg-brand-bubble px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-white shadow-lg shadow-brand-bubble/40 transition hover:-translate-y-0.5 hover:bg-brand-bubbleDark">
                    Plan my pup’s paradise
                  </button>
                  <button className="rounded-full border border-brand-navy/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-brand-navy transition hover:-translate-y-0.5 hover:border-brand-navy/40">
                    Download concept kit
                  </button>
                </div>
              </div>
              <div className="glass-panel relative rounded-[2.75rem] border-white/40 bg-white/80 p-8 shadow-soft">
                <div className="space-y-6">
                  {heroHighlights.map(({ title, description, icon: Icon }) => (
                    <div key={title} className="flex gap-4">
                      <span className="mt-1 grid h-12 w-12 place-items-center rounded-2xl bg-brand-bubble/15 text-brand-bubble">
                        <Icon className="h-6 w-6" aria-hidden="true" />
                      </span>
                      <div>
                        <h2 className="text-lg font-semibold">{title}</h2>
                        <p className="text-sm text-brand-navy/70">{description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-24 px-6">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-12 lg:grid-cols-[1.15fr_1fr] lg:items-start">
            <div className="space-y-6 rounded-[3rem] bg-white/90 p-10 text-brand-navy shadow-soft">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-brand-bubble">
                Layout philosophy
              </span>
              <h2 className="text-3xl font-black sm:text-4xl">
                Zoning every wag: a multi-sensory floor plan tuned for dog happiness.
              </h2>
              <p className="text-brand-navy/75">
                We choreograph the room into experiential pockets—elevating rest, sparking curiosity, hydrating joyfully, and protecting sensory wellbeing. Modular partitions glide silently so each moment can expand, quiet, or energize on demand.
              </p>
              <ul className="grid gap-4 text-brand-navy/70 sm:grid-cols-2">
                <li className="rounded-2xl bg-brand-bubble/10 px-5 py-4 text-sm font-semibold">
                  <span className="block text-xs uppercase tracking-[0.3em] text-brand-bubble/80">Flow</span>
                  Curved circulation keeps paws moving without hard corners.
                </li>
                <li className="rounded-2xl bg-brand-mint/10 px-5 py-4 text-sm font-semibold">
                  <span className="block text-xs uppercase tracking-[0.3em] text-brand-mint/80">Wellness</span>
                  Smart climate zoning adapts to nap, play, and grooming modes.
                </li>
                <li className="rounded-2xl bg-brand-sunshine/10 px-5 py-4 text-sm font-semibold">
                  <span className="block text-xs uppercase tracking-[0.3em] text-brand-sunshine/80">Joy</span>
                  Immersive playscapes rotate with new adventures every week.
                </li>
                <li className="rounded-2xl bg-brand-lavender/10 px-5 py-4 text-sm font-semibold">
                  <span className="block text-xs uppercase tracking-[0.3em] text-brand-lavender/80">Calm</span>
                  Acoustic cocoons and heartbeat pillows reset anxious pups.
                </li>
              </ul>
            </div>
            <div className="grid auto-rows-[160px] grid-cols-2 gap-4 text-brand-navy md:grid-cols-3">
              {layoutZones.map(({ title, description, icon: Icon, layout, gradient }) => (
                <article
                  key={title}
                  className={clsx(
                    "relative overflow-hidden rounded-[2rem] border border-white/40 bg-gradient-to-br p-6 shadow-soft transition hover:-translate-y-1",
                    layout,
                    gradient ? `bg-gradient-to-br ${gradient}` : "bg-white"
                  )}
                >
                  <div className="absolute inset-0 bg-white/20 mix-blend-overlay" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div>
                      <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-brand-bubble">
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                      <p className="mt-2 text-sm text-brand-navy/70">{description}</p>
                    </div>
                    <div className="mt-4 h-1 w-16 rounded-full bg-white/60" />
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-24 px-6">
        <div className="mx-auto max-w-6xl space-y-12">
          <div className="grid gap-6 text-brand-navy lg:grid-cols-[1fr_1.2fr] lg:items-center">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-bubble">
                Immersive amenities
              </span>
              <h2 className="text-3xl font-black sm:text-4xl">Every sense smiled upon.</h2>
              <p className="text-brand-navy/75">
                From the moment paws cross the threshold, the room responds with spa-grade indulgence. Lighting, scent, and acoustics harmonize in real time with wellness tech that fades into the background.
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {amenities.map(({ title, description, icon: Icon, highlights }) => (
                <article key={title} className="flex h-full flex-col rounded-[2.5rem] bg-white/90 p-8 text-brand-navy shadow-soft">
                  <span className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-bubble/15 text-brand-bubble">
                    <Icon className="h-6 w-6" aria-hidden="true" />
                  </span>
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-3 text-sm text-brand-navy/70">{description}</p>
                  <ul className="mt-6 space-y-2 text-sm text-brand-navy/70">
                    {highlights.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand-bubble" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>

          <div className="rounded-[3rem] bg-white/90 p-10 text-brand-navy shadow-soft">
            <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:items-center">
              <div className="space-y-6">
                <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-brand-bubble">
                  Material palette
                </span>
                <h2 className="text-3xl font-black sm:text-4xl">A color story inspired by gelato skies.</h2>
                <p className="text-brand-navy/75">
                  Soft neutrals cradle bold sorbet hues, allowing statement elements to sparkle without overwhelming the senses. Every finish is scratch-tested, easy to clean, and luxe enough for humans to envy.
                </p>
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                {palette.map((swatch) => (
                  <article key={swatch.name} className="flex flex-col overflow-hidden rounded-[2rem] border border-white/60 bg-white/80 shadow-inner">
                    <div className="h-28" style={{ backgroundColor: swatch.hex }} />
                    <div className="space-y-2 px-6 py-5">
                      <span className="text-xs font-semibold uppercase tracking-[0.32em] text-brand-navy/50">{swatch.hex}</span>
                      <h3 className="text-lg font-semibold">{swatch.name}</h3>
                      <p className="text-sm text-brand-navy/65">{swatch.finish}</p>
                      <p className="text-sm text-brand-navy/60">{swatch.description}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-24 px-6">
        <div className="mx-auto max-w-6xl rounded-[3rem] bg-gradient-to-br from-brand-lavender/90 via-brand-bubble/90 to-brand-blue/90 p-10 shadow-soft">
          <div className="grid gap-12 lg:grid-cols-[1.1fr_1fr] lg:items-center">
            <div className="space-y-6 text-white">
              <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.3em] text-white/70">
                Daily rhythm
              </span>
              <h2 className="text-3xl font-black sm:text-4xl">An orchestrated journey from sunrise wiggles to moonlit snuggles.</h2>
              <p className="text-white/80">
                Smart cues guide your pup through peaks of play and valleys of rest, ensuring they leave the room balanced, fulfilled, and blissfully tired.
              </p>
              <dl className="grid gap-4 text-white/85 sm:grid-cols-3">
                {experiences.map(({ time, label, description, icon: Icon }) => (
                  <div key={label} className="rounded-2xl bg-white/15 p-5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-semibold uppercase tracking-[0.3em] text-white/80">{time}</span>
                      <Icon className="h-5 w-5 text-white/70" aria-hidden="true" />
                    </div>
                    <dt className="mt-3 text-lg font-semibold text-white">{label}</dt>
                    <dd className="mt-2 text-sm text-white/75">{description}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="space-y-4 rounded-[2.5rem] bg-white/10 p-8 text-white/85 backdrop-blur-lg">
              <div className="flex items-start gap-3">
                <SwatchIcon className="h-6 w-6 text-white" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Moodboard moments</h3>
                  <p className="text-sm text-white/75">
                    Layered boucle throws, iridescent pawprint glass, and sculptural bone-inspired sconces give the room its couture soul.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FaceSmileIcon className="h-6 w-6 text-white" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Human happy place</h3>
                  <p className="text-sm text-white/75">
                    Lounge steps double as conversation seating so you can sip tea while your best friend romps in style.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <LightBulbIcon className="h-6 w-6 text-white" aria-hidden="true" />
                <div>
                  <h3 className="text-lg font-semibold text-white">Future friendly tech</h3>
                  <p className="text-sm text-white/75">
                    Energy usage, cleaning schedules, and enrichment suggestions surface in your app with celebratory pup highlight reels.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative mt-24 px-6">
        <div className="mx-auto max-w-5xl space-y-10 rounded-[3rem] bg-white/95 p-12 text-brand-navy shadow-soft">
          <h2 className="text-center text-3xl font-black sm:text-4xl">Wellbeing woven into every stitch.</h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {wellbeing.map((item) => (
              <article key={item.title} className="rounded-[2rem] bg-brand-cream/60 p-6 text-center">
                <h3 className="text-lg font-semibold text-brand-navy">{item.title}</h3>
                <p className="mt-3 text-sm text-brand-navy/70">{item.description}</p>
              </article>
            ))}
          </div>
          <div className="flex flex-col items-center gap-4">
            <p className="text-center text-brand-navy/70">
              Ready to craft the most joyful dog room on the planet? Let’s bring this concept to life with bespoke finishes, curated tech, and endless tail wags.
            </p>
            <button className="rounded-full bg-brand-mint px-8 py-3 text-sm font-semibold uppercase tracking-[0.25em] text-brand-navy shadow-lg shadow-brand-mint/40 transition hover:-translate-y-0.5 hover:bg-brand-mint/90">
              Book a design consultation
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
