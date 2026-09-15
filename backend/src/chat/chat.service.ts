import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { CoachingService } from '../coaching/coaching.service';
import { BlogService } from '../blog/blog.service';
import { VideosService } from '../videos/videos.service';
import { TestimonialsService } from '../testimonials/testimonials.service';
import { ContentService } from '../content/content.service';
import { AudienceService } from '../users/audience.service';
import { BookingsService } from '../bookings/bookings.service';

import { SendChatMessageDto } from './dto/send-chat-message.dto';
import { ChatConversationStatus } from './dto/update-chat-status.dto';
import {
  ChatConversation,
  ChatConversationDocument,
  ChatMessage,
} from './schemas/chat.schema';

/*
 * No third-party AI API here — every reply is built directly from
 * content that already lives in this database (Coaching programs,
 * Insights, Videos, Testimonials, Booking settings, Page content)
 * plus a small set of static facts that mirror the frontend (About,
 * H.R.T. framework). Keyword/token matching decides which piece of
 * real content to surface for a given message.
 *
 * Three things sit above the normal intent routing and are checked
 * first on every message, in this order:
 *   1. Crisis / safety check   — never skipped, always answered with care.
 *   2. Therapy / medical guard — keeps the bot from acting like a clinician.
 *   3. Off-topic guard         — politely declines things unrelated to the
 *                                 practice instead of guessing an answer.
 * Anything that clears those falls through to intent matching, then to a
 * cross-content search, so an unrecognised phrasing can still surface
 * something real instead of "I don't know".
 */

const FALLBACK_CONTACT_INFO = {
  email: 'hello@neusomahealing.com',
  phone: '+91 12345 67890',
  location: 'Online (Worldwide)',
  timezone: 'Asia/Kolkata',
};

const FALLBACK_SESSION_TYPES = [
  { title: 'Discovery Call', duration: '20 minutes', price: 0 },
  { title: '1:1 Coaching Session', duration: '60 minutes', price: 2500 },
  { title: 'Deep Transformation Session', duration: '90 minutes', price: 4500 },
];

const ABOUT_INFO = {
  name: 'Sakshi Kashyap',
  title:
    'Trauma-Informed Neurosomatic Coach & Certified New Code NLP Practitioner (trained through ITCA NLP)',
  summary:
    "Sakshi doesn't see people as broken — she sees human beings who found intelligent ways to adapt, protect themselves and cope with experiences that once felt overwhelming. With over 2 years of practice, she's the founder of Neusoma Healing.",
  approach: [
    'New Code NLP',
    'Nervous-System Awareness',
    'Somatic Practices',
    'Neuroscience-Informed Methods',
  ],
  stats: ['500+ Lives Supported', '800+ Coaching Sessions', '2+ Years of Practice'],
};

const HRT_FRAMEWORK = [
  {
    title: 'HEAL',
    subtitle: 'Meet the wound with compassion.',
    body: 'Recognise emotional patterns, unresolved experiences and protective responses without shame or judgment.',
  },
  {
    title: 'REGULATE',
    subtitle: 'Teach the body that it has choices.',
    body: 'Build awareness of emotional and nervous-system states so reactions do not automatically dictate behaviour.',
  },
  {
    title: 'TRANSFORM',
    subtitle: 'Create a new way of being.',
    body: 'Reframe patterns, strengthen resourceful states, rebuild self-trust and consciously create new behaviours.',
  },
];

type Intent =
  | 'greeting'
  | 'about'
  | 'coaching'
  | 'hrt_framework'
  | 'process'
  | 'is_therapy'
  | 'booking'
  | 'discovery_call'
  | 'video'
  | 'insight'
  | 'testimonial'
  | 'contact'
  | 'bot_meta'
  | 'thanks'
  | 'fallback';

const INTENT_KEYWORDS: Record<Exclude<Intent, 'fallback'>, string[]> = {
  greeting: [
    'hi', 'hello', 'hey', 'namaste', 'namaskar', 'good morning', 'good evening',
    'good afternoon', 'kaise ho', 'kaisi ho', 'kya haal',
  ],
  about: [
    'about', 'who are you', 'who is sakshi', 'sakshi', 'founder', 'your story',
    'background', 'qualification', 'credential', 'experience', 'trainer',
    'coach are you', 'sakshi kaun', 'kaun hai', 'kaun ho',
  ],
  hrt_framework: [
    'hrt', 'h.r.t', 'heal regulate transform', 'framework', 'heal.regulate.transform',
  ],
  process: [
    'how does it work', 'how does coaching work', 'first session', 'what happens',
    'process kya hai', 'kaise kaam karta', 'kaise hota hai', 'what to expect',
    'kya expect', 'session me kya hota',
  ],
  is_therapy: [
    'therapist', 'therapy', 'psychiatrist', 'psychologist', 'diagnose', 'diagnosis',
    'medicine', 'medication', 'disorder', 'mental illness', 'clinical', 'doctor',
    'treatment for', 'am i depressed', 'do i have anxiety', 'ilaj', 'dawai',
  ],
  coaching: [
    'coaching', 'program', 'programs', 'course', 'transformation', 'mid-life',
    'mid life', 'nervous system', 'nervous-system', 'services', 'offering',
    'offerings', 'kya sikhati', 'kya sikhate',
  ],
  booking: [
    'book', 'booking', 'schedule', 'appointment', 'slot', 'session', 'price',
    'cost', 'fee', 'fees', 'pricing', 'charges', 'kitna', 'paisa', 'rupaye',
    'rupees', 'webinar', 'payment', 'refund', 'cancel', 'reschedule',
    'book karna', 'session lena', 'kaise book',
  ],
  discovery_call: [
    'discovery call', 'free call', 'intro call', 'free session', 'trial call',
    'muft', 'pehla call',
  ],
  video: ['video', 'videos', 'watch', 'youtube', 'library'],
  insight: ['insight', 'insights', 'article', 'blog', 'read', 'post', 'articles'],
  testimonial: [
    'testimonial', 'testimonials', 'review', 'reviews', 'results', 'success story',
    'success stories', 'client said', 'feedback', 'kya log kehte',
  ],
  contact: [
    'contact', 'email', 'phone', 'reach', 'call you', 'location', 'where are you',
    'address', 'sampark', 'number', 'timezone', 'time zone', 'kahan ho',
  ],
  bot_meta: [
    'are you ai', 'are you a bot', 'are you human', 'is this a bot',
    'are you real', 'chatbot ho', 'bot ho kya',
  ],
  thanks: ['thank', 'thanks', 'thank you', 'bye', 'goodbye', 'dhanyavad', 'shukriya'],
};

// Anything mentioned here needs a warm, direct, non-clinical safety
// response before anything else — it overrides every other intent.
const CRISIS_KEYWORDS = [
  'suicide', 'suicidal', 'kill myself', 'end my life', 'self harm', 'self-harm',
  'hurt myself', 'want to die', 'no reason to live', 'khudkushi', 'marna chahta',
  'marna chahti', 'jaan dena',
];

// Requests that are clearly outside the scope of a coaching-practice
// website assistant. Kept intentionally narrow (specific, low-ambiguity
// phrases) so genuine site questions never get misrouted here.
const OFF_TOPIC_KEYWORDS = [
  'write code', 'write a python', 'write javascript', 'debug this', 'fix this bug',
  'html code', 'sql query', 'weather in', 'weather today', 'stock price',
  'share price', 'cricket score', 'football score', 'capital of', 'prime minister of',
  'president of', 'solve this equation', 'math problem', 'homework help',
  'write an essay on', 'write my essay', 'movie review', 'song lyrics', 'recipe for',
  'translate this to', 'who will win the election',
];

const STOPWORDS = new Set([
  'the', 'a', 'an', 'is', 'are', 'do', 'does', 'did', 'what', 'how', 'can',
  'you', 'your', 'about', 'tell', 'me', 'of', 'on', 'in', 'to', 'for', 'and',
  'i', 'my', 'with', 'this', 'that', 'it', 'be', 'have', 'has', 'or', 'any',
  'please', 'know', 'like', 'want', 'would', 'could', 'im', 'am',
]);

function tokenize(message: string): string[] {
  return message
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOPWORDS.has(word));
}

function includesAny(text: string, phrases: string[]): boolean {
  return phrases.some((phrase) => text.includes(phrase));
}

// Checked in this exact order. 'about' is deliberately near the end —
// its keyword list includes the very generic word "about", which would
// otherwise hijack phrasings like "tell me about coaching" or "what
// about pricing" before the more specific intent gets a chance.
// 'is_therapy' sits before 'coaching' so "is this therapy" isn't
// swallowed by the generic word "coaching" appearing nearby.
const INTENT_PRIORITY: Exclude<Intent, 'fallback'>[] = [
  'greeting',
  'bot_meta',
  'is_therapy',
  'hrt_framework',
  'process',
  'discovery_call',
  'coaching',
  'booking',
  'video',
  'insight',
  'testimonial',
  'contact',
  'thanks',
  'about',
];

function detectIntent(message: string): Intent {
  const text = message.toLowerCase();

  for (const intent of INTENT_PRIORITY) {
    if (INTENT_KEYWORDS[intent].some((keyword) => text.includes(keyword))) {
      return intent;
    }
  }

  return 'fallback';
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatConversation.name)
    private readonly chatModel: Model<ChatConversationDocument>,
    private readonly coachingService: CoachingService,
    private readonly blogService: BlogService,
    private readonly videosService: VideosService,
    private readonly testimonialsService: TestimonialsService,
    private readonly contentService: ContentService,
    private readonly bookingsService: BookingsService,
    private readonly audienceService: AudienceService,
  ) {}

  async sendMessage(dto: SendChatMessageDto) {
    let conversation = await this.chatModel.findOne({
      sessionId: dto.sessionId,
    });

    if (!conversation) {
      conversation = new this.chatModel({
        sessionId: dto.sessionId,
        messages: [],
        status: 'new',
      });
    }

    if (dto.name) conversation.name = dto.name;
    if (dto.email) conversation.email = dto.email;

    // Visitors who leave an email in chat join the
    // announcement list too.
    if (dto.email) {
      await this.audienceService.capture({
        email: dto.email,
        name: dto.name,
        source: 'chat',
      });
    }

    conversation.messages.push({
      role: 'user',
      text: dto.message,
      at: new Date(),
    } as ChatMessage);

    // A fresh visitor message always needs a fresh look, even if
    // admin had marked this conversation read earlier.
    conversation.status = 'new';

    const reply = await this.generateReply(dto.message);

    conversation.messages.push({
      role: 'bot',
      text: reply,
      at: new Date(),
    } as ChatMessage);

    await conversation.save();

    return {
      success: true,
      reply,
      data: {
        id: conversation._id.toString(),
        sessionId: conversation.sessionId,
      },
    };
  }

  // Live session types + timezone from the same settings the booking
  // page itself reads, so the bot never quotes stale prices. Falls
  // back to static defaults only if settings can't be loaded.
  private async getSessionInfo() {
    try {
      const config = await this.bookingsService.getPublicConfig();
      const sessionTypes = config?.data?.sessionTypes;
      const timezone = config?.data?.timezone;

      if (Array.isArray(sessionTypes) && sessionTypes.length > 0) {
        return {
          sessionTypes,
          timezone: timezone || FALLBACK_CONTACT_INFO.timezone,
        };
      }
    } catch {
      // fall through to static defaults below
    }

    return {
      sessionTypes: FALLBACK_SESSION_TYPES,
      timezone: FALLBACK_CONTACT_INFO.timezone,
    };
  }

  private formatPrice(price: number): string {
    return price > 0 ? `₹${price}` : 'Free';
  }

  private async generateReply(message: string): Promise<string> {
    const text = message.toLowerCase();

    // 1. Safety first — never skipped, never delegated to keyword search.
    if (includesAny(text, CRISIS_KEYWORDS)) {
      return this.crisisResponse();
    }

    // 2. Keep the bot in its lane: coaching, not clinical care.
    if (includesAny(text, OFF_TOPIC_KEYWORDS)) {
      return this.offTopicResponse();
    }

    const intent = detectIntent(message);

    switch (intent) {
      case 'greeting':
        return "Hi there! I'm happy to help. Ask me about Sakshi, our coaching programs, the H.R.T. framework, booking a session, videos, insights, testimonials, or how to reach us.";

      case 'bot_meta':
        return "I'm the Neusoma Healing website assistant — an automated guide built from the real content on this site, not a live person. For anything I can't answer, or for a real conversation, you can reach the team directly.";

      case 'is_therapy':
        return "Good question to ask up front: Sakshi's coaching is not therapy, and I can't offer medical or psychological diagnoses or treatment. It's trauma-informed, nervous-system-aware coaching — New Code NLP and somatic practices aimed at patterns, regulation and self-trust. If you're working with or need a licensed therapist or doctor, coaching can sit alongside that, but it isn't a replacement for it. Happy to tell you more about how the coaching itself works if that's useful.";

      case 'about':
        return `${ABOUT_INFO.name} — ${ABOUT_INFO.title}.\n\n${ABOUT_INFO.summary}\n\nHer approach draws on:\n${ABOUT_INFO.approach
          .map((a) => `• ${a}`)
          .join('\n')}\n\n${ABOUT_INFO.stats.join(' · ')}\n\nYou can read the full story on the About page.`;

      case 'hrt_framework': {
        const stages = HRT_FRAMEWORK.map(
          (s) => `• ${s.title} — ${s.subtitle}\n  ${s.body}`,
        ).join('\n');

        return `H.R.T. stands for Heal. Regulate. Transform. — the framework behind the coaching work:\n${stages}\n\nYou can see this in full on the H.R.T. Framework page, or explore how it's applied in the Coaching programs.`;
      }

      case 'process':
        return "Most journeys start with a free Discovery Call to talk through what you're looking for. From there, sessions follow the H.R.T. arc — Heal, Regulate, Transform — moving at your pace through understanding patterns, building nervous-system awareness, and creating new ways of responding. Everything is online (Zoom), personalised to you rather than a fixed script.";

      case 'coaching': {
        const programs = await this.coachingService.findAll();

        if (programs.length === 0) {
          return "We offer personalised 1:1 coaching programs. I don't have the list handy right now — please check the Coaching page or book a Discovery Call to learn more.";
        }

        const list = programs
          .slice(0, 4)
          .map((p) => `• ${p.title} — ${p.tagline}`)
          .join('\n');

        return `Here are our coaching programs:\n${list}\n\nYou can read more about any of these on the Coaching page, or book a session directly.`;
      }

      case 'discovery_call': {
        const { sessionTypes } = await this.getSessionInfo();
        const discovery = sessionTypes.find((s: any) => s.title === 'Discovery Call');
        const duration = discovery?.duration || '20 minutes';

        return `A Discovery Call is a free, no-obligation ${duration} call to talk through what you're looking for and see if coaching is the right fit. You can request one from the Book a Session page — our team will follow up to confirm a time.`;
      }

      case 'booking': {
        const { sessionTypes, timezone } = await this.getSessionInfo();

        const list = sessionTypes
          .map((s: any) => `• ${s.title} (${s.duration}) — ${this.formatPrice(s.price)}`)
          .join('\n');

        return `You can book from the "Book a Session" page. Session types:\n${list}\n\nAll sessions run online over Zoom, scheduled in ${timezone} time. For 1:1 sessions you'll share a preferred date/time and our team will confirm the final time by email.`;
      }

      case 'video': {
        const videos = await this.videosService.findAll();

        if (videos.length === 0) {
          return "We're building out our video library right now — check back soon, or head to the Videos page.";
        }

        const list = videos
          .slice(0, 4)
          .map((v) => `• ${v.title} (${v.category})`)
          .join('\n');

        return `Some videos you might like:\n${list}\n\nYou'll find the full library on the Videos page.`;
      }

      case 'insight': {
        const posts = await this.blogService.findAll();

        if (posts.length === 0) {
          return "We're publishing new articles soon — check back on the Insights page shortly.";
        }

        const list = posts
          .slice(0, 4)
          .map((p) => `• ${p.title}`)
          .join('\n');

        return `A few articles from our Insights page:\n${list}\n\nYou can read the full pieces on the Insights page.`;
      }

      case 'testimonial': {
        const testimonials = await this.testimonialsService.findAll();

        if (testimonials.length === 0) {
          return "We're adding client stories soon — check back on the site shortly.";
        }

        const list = testimonials
          .slice(0, 3)
          .map((t) => `• "${t.quote}" — ${t.name}, ${t.type}`)
          .join('\n');

        return `Here's what a few clients have shared:\n${list}\n\nMore stories are on the Testimonials section of the homepage.`;
      }

      case 'contact': {
        const { timezone } = await this.getSessionInfo();
        return `You can reach us at ${FALLBACK_CONTACT_INFO.email} or ${FALLBACK_CONTACT_INFO.phone}. All sessions are held online (${FALLBACK_CONTACT_INFO.location}), scheduled in ${timezone} time, so you can join from anywhere.`;
      }

      case 'thanks':
        return "You're very welcome! Feel free to reach out any time, or book a Discovery Call if you'd like to talk further.";

      default:
        return this.searchAllContent(message);
    }
  }

  private crisisResponse(): string {
    return "I'm really glad you reached out, and I want to make sure you get the right kind of support right now — more than I can give as a website assistant. If you're in immediate danger, please contact your local emergency number right away. In India, you can also call the KIRAN mental health helpline on 1800-599-0019 (toll-free, 24/7) or iCall on 9152987821. If you'd still like to explore coaching with Sakshi once you have that support in place, we're here — but please reach out to one of those first.";
  }

  private offTopicResponse(): string {
    return "That's outside what I can help with here — I'm built to answer questions about Neusoma Healing specifically: Sakshi, the coaching programs, the H.R.T. framework, booking a session, videos, insights or testimonials. Is there something in that space I can help you with?";
  }

  /*
   * Last resort before the generic fallback: scan every piece of
   * real content on the site (coaching programs, insights, videos,
   * testimonials, and any admin-managed page content) for a keyword
   * overlap with the message, so an unrecognised phrasing can still
   * surface something real instead of "I don't know".
   */
  private async searchAllContent(message: string): Promise<string> {
    const tokens = tokenize(message);

    if (tokens.length === 0) {
      return this.genericFallback();
    }

    const matchesToken = (haystack: string) => {
      const lower = haystack.toLowerCase();
      return tokens.some((token) => lower.includes(token));
    };

    const [programs, posts, videos, testimonials, pages] = await Promise.all([
      this.coachingService.findAll(),
      this.blogService.findAll(),
      this.videosService.findAll(),
      this.testimonialsService.findAll(),
      this.contentService.findAll().catch(() => []),
    ]);

    const matchedProgram = programs.find((p) =>
      matchesToken(`${p.title} ${p.tagline} ${p.description}`),
    );
    if (matchedProgram) {
      return `That sounds related to our "${matchedProgram.title}" program — ${matchedProgram.tagline}\n\n${matchedProgram.description}\n\nYou can read the full details on the Coaching page, or book a session to get started.`;
    }

    const matchedPost = posts.find((p) => matchesToken(`${p.title} ${p.excerpt} ${p.category}`));
    if (matchedPost) {
      return `You might find this article helpful: "${matchedPost.title}" — ${matchedPost.excerpt}\n\nYou can read the full piece on the Insights page.`;
    }

    const matchedVideo = videos.find((v) => matchesToken(`${v.title} ${v.category}`));
    if (matchedVideo) {
      return `We have a video on this: "${matchedVideo.title}" (${matchedVideo.category}). You'll find it on the Videos page.`;
    }

    const matchedTestimonial = testimonials.find((t) =>
      matchesToken(`${t.quote} ${t.type} ${t.category}`),
    );
    if (matchedTestimonial) {
      return `A client shared something similar: "${matchedTestimonial.quote}" — ${matchedTestimonial.name}, ${matchedTestimonial.type}.`;
    }

    // Any admin-managed page content (about-page edits, FAQ blocks,
    // homepage copy, etc.) — generic since `data` shape isn't fixed.
    const matchedPage = (pages as Array<{ key: string; data?: unknown }>).find((page) =>
      matchesToken(`${page.key} ${JSON.stringify(page.data ?? {})}`),
    );
    if (matchedPage) {
      return `I found something on the site related to that ("${matchedPage.key}") — it's best viewed on the page itself so nothing gets lost in translation here. Would you like me to point you to a specific section, or should I connect you with the team for details?`;
    }

    return this.genericFallback();
  }

  private genericFallback(): string {
    return "I couldn't find anything specific on that, but I can help with: Sakshi & her background (About), coaching programs, the H.R.T. framework, booking a session, videos, insights/articles, client testimonials, or how to reach us — what would you like to know?";
  }

  async findAll() {
    return this.chatModel
      .find()
      .sort({ updatedAt: -1 })
      .lean()
      .exec();
  }

  async countStats() {
    const [total, newCount] = await Promise.all([
      this.chatModel.countDocuments().exec(),
      this.chatModel.countDocuments({ status: 'new' }).exec(),
    ]);

    return { total, new: newCount };
  }

  async updateStatus(id: string, status: ChatConversationStatus) {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid conversation id.');
    }

    const updated = await this.chatModel
      .findByIdAndUpdate(id, { status }, { new: true, runValidators: true })
      .lean()
      .exec();

    if (!updated) {
      throw new NotFoundException('Conversation not found.');
    }

    return {
      success: true,
      message: 'Conversation status updated successfully.',
      data: updated,
    };
  }
}
