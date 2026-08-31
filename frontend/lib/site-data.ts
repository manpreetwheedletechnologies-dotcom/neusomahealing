// Shared content for inner pages (About, H.R.T. Framework, Coaching, Videos,
// Insights, Testimonials, Book a Session, Contact). Kept separate from
// home-data.ts so the homepage is never touched by changes here.

export const stats = [
  ["500+", "Lives Transformed"],
  ["800+", "Coaching Sessions"],
  ["5+", "Years of Practice"],
  ["100%", "Compassionate Commitment"],
] as const;

export const philosophy = [
  ["Compassionate", "♡"],
  ["Trauma-informed", "◈"],
  ["Nervous-system aware", "✳"],
  ["Transformational", "✦"],
] as const;

export const approach = [
  "New Code NLP",
  "Emotional Intelligence",
  "Cognitive Reframing",
  "Nervous System-Aware Coaching",
] as const;

export type CoachingProgram = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  details: string[];
  explore: string[];
  expect: string;
};

export const coachingPrograms: CoachingProgram[] = [
  {
    slug: "1-1-transformation-coaching",
    title: "1:1 Transformation Coaching",
    tagline: "Personalised. Compassionate. Transformational.",
    description:
      "A personalised coaching journey to help you understand your patterns, regulate your nervous system and create meaningful change.",
    details: ["6–12 Sessions", "45–60 Minutes per Session", "Online (Zoom)", "Personalised to You"],
    explore: [
      "Understand your patterns",
      "Reframe limiting beliefs",
      "Regulate your inner world",
      "Build self-trust",
      "Live with greater freedom",
    ],
    expect:
      "A safe, supportive space to explore what matters most to you. Together we will identify patterns, build awareness and create new ways of thinking, feeling and responding.",
  },
  {
    slug: "mid-life-transformation",
    title: "Mid-Life Transformation",
    tagline: "For women ready to meet the next chapter.",
    description:
      "Support for women navigating major personal, emotional or identity transitions, with space to rediscover who you are becoming.",
    details: ["8–12 Sessions", "60 Minutes per Session", "Online (Zoom)", "Personalised to You"],
    explore: [
      "Understand this season of change",
      "Reframe limiting beliefs",
      "Reconnect with your identity",
      "Build self-trust",
      "Move forward with clarity",
    ],
    expect:
      "A safe, supportive space to explore what matters most to you as you move through transition. Together we will identify patterns, build awareness and create new ways of thinking, feeling and responding.",
  },
  {
    slug: "nervous-system-aware-coaching",
    title: "Nervous-System-Aware Coaching",
    tagline: "Regulation-focused. Practical. Grounded.",
    description:
      "Focused on recognising emotional and nervous-system states, building regulation capacity and developing conscious responses.",
    details: ["6–10 Sessions", "45–60 Minutes per Session", "Online (Zoom)", "Personalised to You"],
    explore: [
      "Understand your nervous system",
      "Recognise your states",
      "Build regulation capacity",
      "Build self-trust",
      "Respond instead of react",
    ],
    expect:
      "A safe, supportive space to explore what your body has been carrying. Together we will identify patterns, build awareness and create new ways of thinking, feeling and responding.",
  },
  {
    slug: "hrt-transformation-journey",
    title: "H.R.T. Transformation Journey",
    tagline: "A deeper, structured path of change.",
    description:
      "A deeper structured coaching experience built on the full arc of Heal → Regulate → Transform.",
    details: ["12–16 Sessions", "60 Minutes per Session", "Online (Zoom)", "Personalised to You"],
    explore: [
      "Understand your patterns",
      "Regulate your nervous system",
      "Reframe limiting beliefs",
      "Build self-trust",
      "Consciously create new behaviours",
    ],
    expect:
      "A safe, supportive space to move through the full H.R.T. arc at your own pace. Together we will identify patterns, build awareness and create new ways of thinking, feeling and responding.",
  },
];

export const videoCategories = ["All", "H.R.T. Framework", "Nervous System", "Emotional Healing", "Mid-Life", "Reflections"] as const;

export const allVideos = [
  { title: "Understanding Your Emotional Patterns", duration: "04:45", category: "Emotional Healing" },
  { title: "Nervous System 101: States & Regulation", duration: "08:12", category: "Nervous System" },
  { title: "Heal. Regulate. Transform. Explained", duration: "07:30", category: "H.R.T. Framework" },
  { title: "From Reaction to Response", duration: "05:39", category: "Nervous System" },
  { title: "Self-Trust: Rebuilding from Within", duration: "06:15", category: "Emotional Healing" },
  { title: "Overwhelm to Inner Calm", duration: "07:56", category: "Reflections" },
  { title: "Mid-Life Is Not a Crisis", duration: "06:20", category: "Mid-Life" },
  { title: "Why Do the Same Patterns Keep Returning?", duration: "05:12", category: "H.R.T. Framework" },
  { title: "Building Regulation & Safety", duration: "06:48", category: "Nervous System" },
] as const;

export const insightCategories = ["All", "Emotional Healing", "Nervous System", "Mid-Life", "Relationships", "Self-Trust"] as const;

export const insights = [
  {
    slug: "why-do-the-same-patterns-keep-returning",
    title: "Why Do the Same Patterns Keep Returning?",
    category: "Emotional Healing",
    date: "May 12, 2024",
    readTime: "6 min read",
    excerpt:
      "Recurring patterns are not failures. They are protective strategies that once kept you safe, and understanding them is the first step toward choice.",
  },
  {
    slug: "the-nervous-system-and-emotional-overwhelm",
    title: "The Nervous System and Emotional Overwhelm",
    category: "Nervous System",
    date: "May 3, 2024",
    readTime: "7 min read",
    excerpt:
      "Awareness is the first step toward regulation. A gentle look at how your nervous system shapes the way you think, feel and react.",
  },
  {
    slug: "mid-life-is-not-a-crisis-its-a-transition",
    title: "Mid-Life Is Not a Crisis. It's a Transition.",
    category: "Mid-Life",
    date: "Apr 20, 2024",
    readTime: "5 min read",
    excerpt:
      "Reframing mid-life as a season of becoming rather than a crisis to survive, with room for grief and possibility both.",
  },
  {
    slug: "from-people-pleasing-to-self-trust",
    title: "From People-Pleasing to Self-Trust",
    category: "Self-Trust",
    date: "Apr 10, 2024",
    readTime: "6 min read",
    excerpt:
      "Losing yourself while keeping others comfortable is a pattern, not a personality trait — and patterns can be gently unlearned.",
  },
  {
    slug: "how-compassion-changes-everything",
    title: "How Compassion Changes Everything",
    category: "Emotional Healing",
    date: "Apr 1, 2024",
    readTime: "4 min read",
    excerpt:
      "Meeting yourself with compassion instead of judgment changes not just how you feel, but what becomes possible next.",
  },
  {
    slug: "small-shifts-big-transformations",
    title: "Small Shifts, Big Transformations",
    category: "Relationships",
    date: "Mar 25, 2024",
    readTime: "5 min read",
    excerpt:
      "How small, consistent shifts in awareness ripple outward into the relationships that matter most to you.",
  },
] as const;

export const nervousSystemStates = [
  { title: "Fight", text: "Feel threatened, angry or defensive." },
  { title: "Flight", text: "Feel anxious, overwhelmed or need to escape." },
  { title: "Freeze", text: "Feel stuck, numb or unable to act." },
  { title: "Fawn", text: "People-please or lose yourself to keep peace." },
] as const;

export const nervousSystemTopics = [
  "What is the Nervous System?",
  "States of the Nervous System",
  "Why We React Automatically",
  "From Reaction to Response",
  "Building Regulation & Safety",
] as const;

export const testimonialsFull = [
  {
    name: "Neha S.",
    type: "Mid-Life Transformation",
    category: "Life Transitions",
    quote:
      "Sakshi's compassionate approach helped me understand patterns I didn't even know were running my life. I feel more like myself, calmer, stronger and more confident.",
  },
  {
    name: "Anita M.",
    type: "1:1 Coaching Client",
    category: "Self-Trust",
    quote:
      "The H.R.T. journey is truly life-changing. I learned to regulate my emotions and respond instead of react. It has created so much ease in my life.",
  },
  {
    name: "Priya K.",
    type: "Nervous System Coaching",
    category: "Emotional Healing",
    quote:
      "I finally feel safe within myself. This work isn't just coaching, it's a transformation.",
  },
  {
    name: "Ritu D.",
    type: "1:1 Coaching Client",
    category: "Relationships",
    quote:
      "Understanding my own nervous system changed the way I show up in every relationship in my life, especially with the people closest to me.",
  },
  {
    name: "Kavita S.",
    type: "Mid-Life Transformation",
    category: "Life Transitions",
    quote:
      "I came in feeling stuck and overwhelmed. I left with real tools, more self-trust and a completely new relationship with change.",
  },
  {
    name: "Meera J.",
    type: "H.R.T. Journey",
    category: "Self-Trust",
    quote:
      "Sakshi held space for me without judgment. That safety alone made it possible to finally look at patterns I had avoided for years.",
  },
] as const;

export const testimonialFilters = ["All", "Self-Trust", "Emotional Healing", "Life Transitions", "Relationships"] as const;

export const contactInfo = {
  email: "hello@neusomahealing.com",
  phone: "+91 12345 67890",
  location: "Online (Worldwide)",
};

export const sessionTypes = [
  { title: "Discovery Call", duration: "20 minutes" },
  { title: "1:1 Coaching Session", duration: "60 minutes" },
  { title: "Deep Transformation Session", duration: "90 minutes" },
] as const;
