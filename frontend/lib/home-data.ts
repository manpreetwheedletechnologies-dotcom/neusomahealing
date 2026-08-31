export const patterns = [
  ["01", "Overthinking", "When your mind never seems to switch off."],
  ["02", "Self-doubt", "Knowing you want change, but questioning yourself."],
  ["03", "Fear", "Old protective responses showing up in new situations."],
  ["04", "Overwhelm", "When everything feels like too much at once."],
  ["05", "Burnout", "Giving so much that there is little left for you."],
  ["06", "People-pleasing", "Losing yourself while trying to keep others comfortable."],
  ["07", "Limiting beliefs", "Stories about yourself that may no longer fit."],
  ["08", "Life transitions", "Standing between who you were and who you are becoming."]
] as const;

export const framework = [
  { number: "01", title: "HEAL", subtitle: "Meet the wound with compassion.", body: "Recognise emotional patterns, unresolved experiences and protective responses without shame or judgment." },
  { number: "02", title: "REGULATE", subtitle: "Teach the body that it has choices.", body: "Build awareness of emotional and nervous-system states so reactions do not automatically dictate behaviour." },
  { number: "03", title: "TRANSFORM", subtitle: "Create a new way of being.", body: "Reframe patterns, strengthen resourceful states, rebuild self-trust and consciously create new behaviours." }
] as const;

export const journey = [
  ["SURVIVAL", "Old patterns", "Fear · Overwhelm"],
  ["SAFETY", "Awareness", "Compassion · Regulation"],
  ["SELF-TRUST", "Understanding", "Confidence · Resources"],
  ["CHOICE", "New responses", "New behaviours · Possibilities"],
  ["TRANSFORMATION", "Conscious living", "Freedom · Meaningful change"]
] as const;

export const coaching = [
  {
    title: "1:1 Transformation Coaching",
    text: "Personalised coaching for understanding patterns, building self-awareness and creating new choices.",
    image: "/images/coaching-1-1-transformation.jpg",
  },
  {
    title: "Mid-Life Transformation",
    text: "For women navigating major personal, emotional or identity transitions.",
    image: "/images/coaching-mid-life-transformation.jpg",
  },
  {
    title: "Nervous-System Aware Coaching",
    text: "Focused on recognising emotional states, building regulation capacity and developing conscious responses.",
    image: "/images/coaching-nervous-system-aware.jpg",
  },
  {
    title: "H.R.T. Transformation Journey",
    text: "A deeper structured coaching experience based around Heal → Regulate → Transform.",
    image: "/images/coaching-hrt-transformation.jpg",
  },
];

export const videos = [
  {
    title: "Understanding Your Emotional Patterns",
    video: "/videos/one.mp4",
  },
  {
    title: "Nervous System 101: States & Regulation",
    video: "/videos/two.mp4",
  },
  {
    title: "Heal. Regulate. Transform. Explained",
    video: "/videos/three.mp4",
  },
  {
    title: "From Reaction to Response",
    video: "/videos/four.mp4",
  },
];

export const testimonials = [
  ["Neha S.", "Mid-Life Transformation", "I finally feel more like myself. The work helped me slow down, understand what was happening within me and respond differently."],
  ["Anita M.", "1:1 Coaching Client", "The H.R.T. journey helped me see my patterns with compassion instead of judgment. That changed how I show up every day."],
  ["Priya K.", "Nervous-System Coaching", "I feel calmer, clearer and much more able to choose my response instead of being pulled by the old pattern."]
] as const;
