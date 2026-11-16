import React, { useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';
import type { PartnerPerk } from '../types';

interface PartnerSpotlightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPartnerCreated: (perks: PartnerPerk[]) => void;
}

export const PartnerSpotlightModal: React.FC<PartnerSpotlightModalProps> = ({
  isOpen,
  onClose,
  onPartnerCreated,
}) => {
  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<PartnerPerk['category']>('restaurant');
  const [neighborhood, setNeighborhood] = useState('');
  const [perkHeadline, setPerkHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [tier, setTier] = useState<PartnerPerk['tier']>('Featured Perk Plus');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const estimatedImpressions =
    tier === 'Featured Perk Plus' ? '12,500+ monthly views' : '4,800+ monthly views';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!businessName.trim() || !perkHeadline.trim()) {
      setError('Please enter your business name and a perk headline.');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          category,
          neighborhood,
          perkHeadline,
          description,
          promoCode,
          tier,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Could not publish spotlight.');
      }

      if (Array.isArray(data.perks)) {
        onPartnerCreated(data.perks);
      }

      setSuccessMessage(
        `${businessName.trim()} is now live in Featured Local Perks.`
      );
      setBusinessName('');
      setNeighborhood('');
      setPerkHeadline('');
      setDescription('');
      setPromoCode('');
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Unable to save partner spotlight.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="partner-modal-title"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-950 sm:p-8"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">
              Spotly for Local Business
            </p>
            <h2
              id="partner-modal-title"
              className="mt-1 font-display text-2xl font-bold text-slate-950 dark:text-white"
            >
              Launch a Partner Spotlight
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close partner modal"
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div>
            <span className="block text-sm font-semibold text-slate-900 dark:text-white">
              Select Spotlight Tier
            </span>
            <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: 'Neighborhood Spotlight',
                    price: '$49/mo',
                    note: 'Listed in Featured Local Perks & neighborhood browse',
                  },
                  {
                    id: 'Featured Perk Plus',
                    price: '$129/mo',
                    note: 'Priority card placement & top neighborhood reach',
                  },
                ] as const
              ).map((opt) => {
                const active = tier === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTier(opt.id)}
                    className={`rounded-2xl border p-4 text-left transition-colors cursor-pointer ${
                      active
                        ? 'border-rose-600 bg-rose-50/60 dark:border-rose-400 dark:bg-rose-950/30'
                        : 'border-slate-200 bg-white hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-display text-sm font-bold text-slate-950 dark:text-white">
                        {opt.id}
                      </span>
                      <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
                        {opt.price}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                      {opt.note}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              Estimated local visibility: {estimatedImpressions}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="partner-name"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Business Name
              </label>
              <input
                id="partner-name"
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g., Maple Street Books"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="partner-category"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Category
              </label>
              <select
                id="partner-category"
                value={category}
                onChange={(e) =>
                  setCategory(e.target.value as PartnerPerk['category'])
                }
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              >
                <option value="restaurant">Restaurant</option>
                <option value="cafe">Cafe & Bakery</option>
                <option value="shopping">Local Boutique / Shop</option>
                <option value="grocery">Grocery & Market</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label
                htmlFor="partner-headline"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Perk Offer Headline
              </label>
              <input
                id="partner-headline"
                type="text"
                required
                value={perkHeadline}
                onChange={(e) => setPerkHeadline(e.target.value)}
                placeholder="e.g., 20% off weekend brunch"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label
                htmlFor="partner-code"
                className="block text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                Promo Code (Optional)
              </label>
              <input
                id="partner-code"
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="e.g., MAPLE20"
                className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm uppercase text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="partner-neighborhood"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Neighborhood / Street
            </label>
            <input
              id="partner-neighborhood"
              type="text"
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              placeholder="e.g., Downtown Market District"
              className="mt-1.5 min-h-[44px] w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 text-sm text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label
              htmlFor="partner-desc"
              className="block text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              Offer Details
            </label>
            <textarea
              id="partner-desc"
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Share simple redemption details for local visitors..."
              className="mt-1.5 w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm text-slate-900 focus:border-rose-500 focus:bg-white focus:outline-none dark:border-slate-700 dark:bg-slate-900 dark:text-white"
            />
          </div>

          {error && (
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
              {error}
            </p>
          )}

          {successMessage && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm font-medium text-emerald-800 dark:border-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{successMessage}</span>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 cursor-pointer"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="min-h-[44px] rounded-xl bg-rose-600 px-5 py-2 text-sm font-semibold text-white hover:bg-rose-700 disabled:opacity-60 transition-colors cursor-pointer"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Spotlight Perk'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
