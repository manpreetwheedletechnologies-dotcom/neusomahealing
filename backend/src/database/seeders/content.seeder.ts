import { getModelToken } from '@nestjs/mongoose';
import { NestFactory } from '@nestjs/core';
import { Model } from 'mongoose';

import { AppModule } from '../../app.module';

import {
  Testimonial,
  TestimonialDocument,
} from '../../testimonials/schemas/testimonial.schema';

import { Video, VideoDocument } from '../../videos/schemas/video.schema';

import {
  CoachingProgram,
  CoachingProgramDocument,
} from '../../coaching/schemas/coaching-program.schema';

import { Post, PostDocument } from '../../blog/schemas/post.schema';

/*
 * This is the same content that used to live as hardcoded
 * arrays in the frontend (lib/site-data.ts, lib/home-data.ts).
 * Now that every public page reads from the DB, those arrays
 * are dead unless this data actually exists in Mongo — this
 * script puts it there, once.
 *
 * Video/image values are frontend public paths (e.g.
 * "/videos/one.mp4"), matching files that already ship in
 * frontend/public — nothing is uploaded to the backend here,
 * the DB just stores the path string.
 */

const testimonialsSeed = [
  {
    name: 'Neha S.',
    type: 'Mid-Life Transformation',
    category: 'Life Transitions',
    quote:
      "Sakshi's compassionate approach helped me understand patterns I didn't even know were running my life. I feel more like myself, calmer, stronger and more confident.",
    order: 1,
    featured: true,
    published: true,
  },
  {
    name: 'Anita M.',
    type: '1:1 Coaching Client',
    category: 'Self-Trust',
    quote:
      'The H.R.T. journey is truly life-changing. I learned to regulate my emotions and respond instead of react. It has created so much ease in my life.',
    order: 2,
    featured: true,
    published: true,
  },
  {
    name: 'Priya K.',
    type: 'Nervous System Coaching',
    category: 'Emotional Healing',
    quote:
      "I finally feel safe within myself. This work isn't just coaching, it's a transformation.",
    order: 3,
    featured: true,
    published: true,
  },
  {
    name: 'Ritu D.',
    type: '1:1 Coaching Client',
    category: 'Relationships',
    quote:
      'Understanding my own nervous system changed the way I show up in every relationship in my life, especially with the people closest to me.',
    order: 4,
    featured: false,
    published: true,
  },
  {
    name: 'Kavita S.',
    type: 'Mid-Life Transformation',
    category: 'Life Transitions',
    quote:
      'I came in feeling stuck and overwhelmed. I left with real tools, more self-trust and a completely new relationship with change.',
    order: 5,
    featured: false,
    published: true,
  },
  {
    name: 'Meera J.',
    type: 'H.R.T. Journey',
    category: 'Self-Trust',
    quote:
      'Sakshi held space for me without judgment. That safety alone made it possible to finally look at patterns I had avoided for years.',
    order: 6,
    featured: false,
    published: true,
  },
];

const coachingSeed = [
  {
    slug: '1-1-transformation-coaching',
    title: '1:1 Transformation Coaching',
    tagline: 'Personalised. Compassionate. Transformational.',
    description:
      'A personalised coaching journey to help you understand your patterns, regulate your nervous system and create meaningful change.',
    details: ['6–12 Sessions', '45–60 Minutes per Session', 'Online (Zoom)', 'Personalised to You'],
    explore: [
      'Understand your patterns',
      'Reframe limiting beliefs',
      'Regulate your inner world',
      'Build self-trust',
      'Live with greater freedom',
    ],
    expect:
      'A safe, supportive space to explore what matters most to you. Together we will identify patterns, build awareness and create new ways of thinking, feeling and responding.',
    image: '/images/coaching-1-1-transformation.jpg',
    order: 1,
    published: true,
  },
  {
    slug: 'mid-life-transformation',
    title: 'Mid-Life Transformation',
    tagline: 'For women ready to meet the next chapter.',
    description:
      'Support for women navigating major personal, emotional or identity transitions, with space to rediscover who you are becoming.',
    details: ['8–12 Sessions', '60 Minutes per Session', 'Online (Zoom)', 'Personalised to You'],
    explore: [
      'Understand this season of change',
      'Reframe limiting beliefs',
      'Reconnect with your identity',
      'Build self-trust',
      'Move forward with clarity',
    ],
    expect:
      'A safe, supportive space to explore what matters most to you as you move through transition. Together we will identify patterns, build awareness and create new ways of thinking, feeling and responding.',
    image: '/images/coaching-mid-life-transformation.jpg',
    order: 2,
    published: true,
  },
  {
    slug: 'nervous-system-aware-coaching',
    title: 'Nervous-System-Aware Coaching',
    tagline: 'Regulation-focused. Practical. Grounded.',
    description:
      'Focused on recognising emotional and nervous-system states, building regulation capacity and developing conscious responses.',
    details: ['6–10 Sessions', '45–60 Minutes per Session', 'Online (Zoom)', 'Personalised to You'],
    explore: [
      'Understand your nervous system',
      'Recognise your states',
      'Build regulation capacity',
      'Build self-trust',
      'Respond instead of react',
    ],
    expect:
      'A safe, supportive space to explore what your body has been carrying. Together we will identify patterns, build awareness and create new ways of thinking, feeling and responding.',
    image: '/images/coaching-nervous-system-aware.jpg',
    order: 3,
    published: true,
  },
  {
    slug: 'hrt-transformation-journey',
    title: 'H.R.T. Transformation Journey',
    tagline: 'A deeper, structured path of change.',
    description:
      'A deeper structured coaching experience built on the full arc of Heal → Regulate → Transform.',
    details: ['12–16 Sessions', '60 Minutes per Session', 'Online (Zoom)', 'Personalised to You'],
    explore: [
      'Understand your patterns',
      'Regulate your nervous system',
      'Reframe limiting beliefs',
      'Build self-trust',
      'Consciously create new behaviours',
    ],
    expect:
      'A safe, supportive space to move through the full H.R.T. arc at your own pace. Together we will identify patterns, build awareness and create new ways of thinking, feeling and responding.',
    image: '/images/coaching-hrt-transformation.jpg',
    order: 4,
    published: true,
  },
];

// Only 4 real video files ship in frontend/public/videos — reused
// across entries. Admin can swap in real paths per-video any time
// from the admin panel (Video URL / public path field).
const videoFiles = ['/videos/one.mp4', '/videos/two.mp4', '/videos/three.mp4', '/videos/four.mp4'];

const videosSeed = [
  {
    title: 'Understanding Your Emotional Patterns',
    description:
      'A gentle look at the emotional patterns that quietly run in the background of daily life, and how to begin noticing them.',
    url: videoFiles[0],
    category: 'Emotional Healing',
    duration: '04:45',
    featured: true,
    published: true,
  },
  {
    title: 'Nervous System 101: States & Regulation',
    description:
      'An introduction to the nervous system states that shape how you think, feel and react — and how regulation creates choice.',
    url: videoFiles[1],
    category: 'Nervous System',
    duration: '08:12',
    featured: true,
    published: true,
  },
  {
    title: 'Heal. Regulate. Transform. Explained',
    description:
      'A walkthrough of the H.R.T. framework — the three-stage arc behind the coaching work.',
    url: videoFiles[2],
    category: 'H.R.T. Framework',
    duration: '07:30',
    featured: true,
    published: true,
  },
  {
    title: 'From Reaction to Response',
    description:
      'What it actually takes to move from an automatic reaction to a conscious, chosen response.',
    url: videoFiles[3],
    category: 'Nervous System',
    duration: '05:39',
    featured: true,
    published: true,
  },
  {
    title: 'Self-Trust: Rebuilding from Within',
    description: 'On rebuilding a relationship with yourself that you can actually rely on.',
    url: videoFiles[0],
    category: 'Emotional Healing',
    duration: '06:15',
    featured: false,
    published: true,
  },
  {
    title: 'Overwhelm to Inner Calm',
    description: 'Simple, grounded ways to move out of overwhelm and back into your body.',
    url: videoFiles[1],
    category: 'Reflections',
    duration: '07:56',
    featured: false,
    published: true,
  },
  {
    title: 'Mid-Life Is Not a Crisis',
    description: 'Reframing mid-life as a season of becoming, not a crisis to survive.',
    url: videoFiles[2],
    category: 'Mid-Life',
    duration: '06:20',
    featured: false,
    published: true,
  },
  {
    title: 'Why Do the Same Patterns Keep Returning?',
    description: 'Recurring patterns explained as protective strategies rather than failures.',
    url: videoFiles[3],
    category: 'H.R.T. Framework',
    duration: '05:12',
    featured: false,
    published: true,
  },
  {
    title: 'Building Regulation & Safety',
    description: 'Practical ways to build a felt sense of safety in the body over time.',
    url: videoFiles[0],
    category: 'Nervous System',
    duration: '06:48',
    featured: false,
    published: true,
  },
];

const insightsSeed = [
  {
    slug: 'why-do-the-same-patterns-keep-returning',
    title: 'Why Do the Same Patterns Keep Returning?',
    category: 'Emotional Healing',
    readTime: '6 min read',
    excerpt:
      'Recurring patterns are not failures. They are protective strategies that once kept you safe, and understanding them is the first step toward choice.',
    content:
      "Recurring patterns are not failures. They are protective strategies that once kept you safe, built at a time when you had fewer resources and fewer choices than you do now.\n\nWhen a pattern shows up again — the same argument, the same shutdown, the same way of disappearing from yourself — it can feel like proof that nothing has changed. But patterns are not proof of failure. They are proof that a part of you learned, a long time ago, that this response worked.\n\nThe work is not to force the pattern away through willpower. It is to build enough safety and awareness that the pattern is no longer the only option available to you. From there, choice becomes possible.",
    author: 'Sakshi Kashyap',
    published: true,
  },
  {
    slug: 'the-nervous-system-and-emotional-overwhelm',
    title: 'The Nervous System and Emotional Overwhelm',
    category: 'Nervous System',
    readTime: '7 min read',
    excerpt:
      'Awareness is the first step toward regulation. A gentle look at how your nervous system shapes the way you think, feel and react.',
    content:
      'Awareness is the first step toward regulation. This article explores the four primary nervous-system states — fight, flight, freeze and fawn — and how recognising them in real time creates the space for a different response.',
    author: 'Sakshi Kashyap',
    published: true,
  },
  {
    slug: 'mid-life-is-not-a-crisis-its-a-transition',
    title: "Mid-Life Is Not a Crisis. It's a Transition.",
    category: 'Mid-Life',
    readTime: '5 min read',
    excerpt:
      "Reframing mid-life as a season of becoming rather than a crisis to survive, with room for grief and possibility both.",
    content:
      "Mid-life gets called a crisis so often that the word starts to feel inevitable. But what if it's better understood as a transition — a season with its own grief, its own possibility, and its own questions about who you are becoming next?\n\nTransitions ask something different of us than crises do. A crisis asks you to survive it. A transition asks you to meet it — with curiosity about what wants to emerge, rather than urgency to make it stop.\n\nThere is room here for both the grief of what's ending and the genuine excitement of what's next. Neither one cancels the other out.",
    author: 'Sakshi Kashyap',
    published: true,
  },
  {
    slug: 'from-people-pleasing-to-self-trust',
    title: 'From People-Pleasing to Self-Trust',
    category: 'Self-Trust',
    readTime: '6 min read',
    excerpt:
      'Losing yourself while keeping others comfortable is a pattern, not a personality trait — and patterns can be gently unlearned.',
    content:
      "Losing yourself while keeping others comfortable is a pattern, not a personality trait — and patterns, unlike traits, can be gently unlearned.\n\nPeople-pleasing usually starts as a smart adaptation: agreeing kept the peace, anticipating others' needs kept you safe, and shrinking your own preferences meant one less thing to manage. Over time, though, the adaptation becomes the default — even in relationships where it's no longer needed.\n\nRebuilding self-trust starts small: noticing a genuine preference before overriding it, tolerating the discomfort of someone else's disappointment, and practising staying present with yourself even when it would be easier to disappear.",
    author: 'Sakshi Kashyap',
    published: true,
  },
  {
    slug: 'how-compassion-changes-everything',
    title: 'How Compassion Changes Everything',
    category: 'Emotional Healing',
    readTime: '4 min read',
    excerpt:
      'Meeting yourself with compassion instead of judgment changes not just how you feel, but what becomes possible next.',
    content:
      "Meeting yourself with compassion instead of judgment changes not just how you feel in a given moment, but what becomes possible next.\n\nJudgment keeps you locked in place, arguing with what already happened. Compassion doesn't excuse the pattern, but it does something judgment can't: it makes it safe enough to actually look at.\n\nAnd once something can be looked at honestly, without flinching, it can finally begin to shift.",
    author: 'Sakshi Kashyap',
    published: true,
  },
  {
    slug: 'small-shifts-big-transformations',
    title: 'Small Shifts, Big Transformations',
    category: 'Relationships',
    readTime: '5 min read',
    excerpt:
      'How small, consistent shifts in awareness ripple outward into the relationships that matter most to you.',
    content:
      "How small, consistent shifts in awareness ripple outward into the relationships that matter most to you.\n\nTransformation rarely arrives as one dramatic moment. More often, it's a hundred small shifts — noticing a reaction half a second sooner, choosing a different word, staying present for one more breath before responding.\n\nNone of those shifts look like much on their own. But relationships are made of exactly these small moments, repeated — which is exactly why small shifts create such real change over time.",
    author: 'Sakshi Kashyap',
    published: true,
  },
];

async function seedContent() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  try {
    const testimonialModel = app.get<Model<TestimonialDocument>>(
      getModelToken(Testimonial.name),
    );
    const videoModel = app.get<Model<VideoDocument>>(getModelToken(Video.name));
    const coachingModel = app.get<Model<CoachingProgramDocument>>(
      getModelToken(CoachingProgram.name),
    );
    const postModel = app.get<Model<PostDocument>>(getModelToken(Post.name));

    await seedCollection(testimonialModel, testimonialsSeed, 'testimonials');
    await seedCollection(videoModel, videosSeed, 'videos');
    await seedCollection(coachingModel, coachingSeed, 'coaching programs');
    await seedCollection(postModel, insightsSeed, 'insights');

    console.log('Content seeding complete.');
  } finally {
    await app.close();
  }
}

async function seedCollection(
  model: Model<any>,
  docs: Record<string, unknown>[],
  label: string,
) {
  const existingCount = await model.countDocuments();

  if (existingCount > 0) {
    console.log(`Skipped ${label}: ${existingCount} document(s) already exist.`);
    return;
  }

  await model.insertMany(docs);
  console.log(`Seeded ${label}: ${docs.length} document(s) created.`);
}

seedContent().catch((error) => {
  console.error('Content seeding failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
