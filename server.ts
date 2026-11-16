import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(process.cwd(), '.spotly_data');
const PARTNERS_FILE = path.join(DATA_DIR, 'partners.json');

interface PartnerPerkRecord {
  id: string;
  businessName: string;
  category: 'restaurant' | 'cafe' | 'shopping' | 'grocery';
  neighborhood: string;
  perkHeadline: string;
  description: string;
  promoCode: string;
  validUntil: string;
  tier: 'Neighborhood Spotlight' | 'Featured Perk Plus';
  imageUrl: string;
  isFeatured: boolean;
  createdAt: string;
}

const DEFAULT_PARTNER_PERKS: PartnerPerkRecord[] = [
  {
    id: 'perk-hearth-crumb',
    businessName: 'Hearth & Crumb Artisan Bakehouse',
    category: 'cafe',
    neighborhood: 'Local Partner Network',
    perkHeadline: '15% off morning pastry & pour-over',
    description:
      'Present this Spotly member code before 11:00 AM daily for 15% off any warm croissant or single-origin latte.',
    promoCode: 'SPOTLY15AM',
    validUntil: 'Dec 31, 2026',
    tier: 'Featured Perk Plus',
    imageUrl: '/src/assets/images/perk_artisan_bakery_1794823823533.jpg',
    isFeatured: true,
    createdAt: '2026-11-01T09:00:00.000Z',
  },
  {
    id: 'perk-olive-branch',
    businessName: 'Olive & Ember Neighborhood Bistro',
    category: 'restaurant',
    neighborhood: 'Local Partner Network',
    perkHeadline: 'Complimentary seasonal starter with dinner',
    description:
      'Enjoy a chef-selected roasted mezze plate on the house when ordering two main dishes for dine-in.',
    promoCode: 'EMBERMEZZE',
    validUntil: 'Dec 31, 2026',
    tier: 'Featured Perk Plus',
    imageUrl: '/src/assets/images/perk_bistro_table_1794823822521.jpg',
    isFeatured: true,
    createdAt: '2026-11-02T12:00:00.000Z',
  },
  {
    id: 'perk-birch-pantry',
    businessName: 'Birch & Co. Specialty Pantry',
    category: 'grocery',
    neighborhood: 'Local Partner Network',
    perkHeadline: '$5 off your first $30 pantry basket',
    description:
      'Save $5 on fresh local produce, cold-pressed olive oils, and small-batch pantry staples in store.',
    promoCode: 'BIRCH5LOCAL',
    validUntil: 'Dec 31, 2026',
    tier: 'Neighborhood Spotlight',
    imageUrl: '/src/assets/images/perk_boutique_market_1794823823585.jpg',
    isFeatured: false,
    createdAt: '2026-11-03T14:00:00.000Z',
  },
];

function ensurePartnersStore(): PartnerPerkRecord[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(PARTNERS_FILE)) {
      fs.writeFileSync(PARTNERS_FILE, JSON.stringify(DEFAULT_PARTNER_PERKS, null, 2), 'utf-8');
      return DEFAULT_PARTNER_PERKS;
    }
    const raw = fs.readFileSync(PARTNERS_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_PARTNER_PERKS;
  } catch {
    return DEFAULT_PARTNER_PERKS;
  }
}

function savePartnersStore(records: PartnerPerkRecord[]): void {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(PARTNERS_FILE, JSON.stringify(records, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to persist partner perks:', err);
  }
}

function createGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface CompactPlacePayload {
  id: string;
  name: string;
  category: string;
  rating?: number | null;
  userRatingCount?: number | null;
  priceLevel?: string | null;
  isOpen?: boolean | null;
  address?: string;
  editorialSummary?: string;
  distanceMeters?: number;
}

function buildDeterministicMatches(
  places: CompactPlacePayload[],
  tastes: string[],
  query: string
) {
  return places.map((place, index) => {
    const ratingScore = place.rating ? Math.round(place.rating * 14) : 55;
    const openBonus = place.isOpen ? 10 : 0;
    const distanceBonus =
      typeof place.distanceMeters === 'number'
        ? Math.max(0, 15 - Math.floor(place.distanceMeters / 250))
        : 5;
    const score = Math.min(99, ratingScore + openBonus + distanceBonus);

    const parts: string[] = [];
    if (place.rating && place.rating >= 4.5) {
      parts.push(`Highly rated (${place.rating.toFixed(1)})`);
    } else if (place.category) {
      parts.push(`Great local ${place.category.toLowerCase()}`);
    }
    if (place.isOpen) {
      parts.push('open right now');
    }
    if (tastes.length > 0) {
      parts.push(`fits your ${tastes[index % tastes.length]} preference`);
    } else if (query.trim()) {
      parts.push(`matches "${query.trim()}"`);
    }

    const reason =
      parts.length > 0
        ? `${parts.join(' · ')}.`
        : 'Popular nearby choice tailored to your area.';

    return {
      id: place.id,
      matchScore: score,
      matchReason: reason.charAt(0).toUpperCase() + reason.slice(1),
    };
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/maps-config', (_req, res) => {
    const apiKey =
      process.env.VITE_GOOGLE_MAPS_API_KEY ||
      process.env.GOOGLE_MAPS_API_KEY ||
      '';
    res.json({ apiKey });
  });

  app.get('/api/perks', (_req, res) => {
    const perks = ensurePartnersStore();
    res.json({ perks });
  });

  app.post('/api/partners', (req, res) => {
    const {
      businessName,
      category,
      neighborhood,
      perkHeadline,
      description,
      promoCode,
      tier,
    } = req.body ?? {};

    if (
      typeof businessName !== 'string' ||
      !businessName.trim() ||
      typeof perkHeadline !== 'string' ||
      !perkHeadline.trim()
    ) {
      res.status(400).json({ error: 'Business name and perk headline are required.' });
      return;
    }

    const validCategory: PartnerPerkRecord['category'] =
      category === 'restaurant' ||
      category === 'cafe' ||
      category === 'shopping' ||
      category === 'grocery'
        ? category
        : 'restaurant';

    const imageByCategory: Record<PartnerPerkRecord['category'], string> = {
      cafe: '/src/assets/images/perk_artisan_bakery_1794823823533.jpg',
      restaurant: '/src/assets/images/perk_bistro_table_1794823822521.jpg',
      grocery: '/src/assets/images/perk_boutique_market_1794823823585.jpg',
      shopping: '/src/assets/images/perk_boutique_market_1794823823585.jpg',
    };

    const cleanCode =
      typeof promoCode === 'string' && promoCode.trim()
        ? promoCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 16)
        : `SPOT${Math.floor(100 + Math.random() * 900)}`;

    const newRecord: PartnerPerkRecord = {
      id: `perk-${Date.now()}`,
      businessName: businessName.trim().slice(0, 80),
      category: validCategory,
      neighborhood:
        typeof neighborhood === 'string' && neighborhood.trim()
          ? neighborhood.trim().slice(0, 60)
          : 'Neighborhood Partner',
      perkHeadline: perkHeadline.trim().slice(0, 90),
      description:
        typeof description === 'string' && description.trim()
          ? description.trim().slice(0, 220)
          : 'Exclusive Spotly neighborhood partner offer. Show this code at checkout.',
      promoCode: cleanCode,
      validUntil: 'Dec 31, 2026',
      tier:
        tier === 'Featured Perk Plus'
          ? 'Featured Perk Plus'
          : 'Neighborhood Spotlight',
      imageUrl: imageByCategory[validCategory],
      isFeatured: tier === 'Featured Perk Plus',
      createdAt: new Date().toISOString(),
    };

    const existing = ensurePartnersStore();
    const updated = [newRecord, ...existing];
    savePartnersStore(updated);

    res.status(201).json({ perk: newRecord, perks: updated });
  });

  app.post('/api/personalize', async (req, res) => {
    const {
      places = [],
      tastes = [],
      query = '',
      locationLabel = 'your neighborhood',
    } = (req.body ?? {}) as {
      places: CompactPlacePayload[];
      tastes: string[];
      query: string;
      locationLabel: string;
    };

    if (!Array.isArray(places) || places.length === 0) {
      res.json({ matches: [] });
      return;
    }

    const cappedPlaces = places.slice(0, 15);
    const ai = createGeminiClient();

    if (!ai) {
      res.json({
        matches: buildDeterministicMatches(cappedPlaces, tastes, query),
      });
      return;
    }

    try {
      const prompt = `You are Spotly's concise neighborhood recommendation assistant.
Given ONLY the real businesses listed below near "${locationLabel}", score how well each place fits the user's request and taste preferences, and write a warm, easy-to-read 1-sentence reason (max 16 words) suitable for both older and younger readers.
STRICT RULES:
- Only use the exact "id" values provided.
- Never invent facts, dishes, prices, or addresses that are not implied by the place category, rating, price level, summary, or open status.
- Avoid hype words or technical jargon.

User search query: "${query || 'Best nearby spots to visit'}"
User taste preferences: ${tastes.length > 0 ? tastes.join(', ') : 'General neighborhood discovery'}

Places JSON:
${JSON.stringify(cappedPlaces)}`;

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: prompt,
        config: {
          thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                matchScore: { type: Type.INTEGER },
                matchReason: { type: Type.STRING },
              },
              required: ['id', 'matchScore', 'matchReason'],
            },
          },
        },
      });

      const rawText = (response.text ?? '[]').trim();
      const parsed = JSON.parse(rawText);
      if (Array.isArray(parsed) && parsed.length > 0) {
        res.json({ matches: parsed });
        return;
      }
      res.json({
        matches: buildDeterministicMatches(cappedPlaces, tastes, query),
      });
    } catch (error) {
      console.error('Personalize fallback triggered:', error);
      res.json({
        matches: buildDeterministicMatches(cappedPlaces, tastes, query),
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Spotly server listening on http://localhost:${PORT}`);
  });
}

startServer();
