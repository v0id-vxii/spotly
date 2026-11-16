import React, { useState } from 'react';
import { Check, Copy, Sparkles, Tag } from 'lucide-react';
import type { PartnerPerk } from '../types';

interface PerksAndSpotlightSectionProps {
  perks: PartnerPerk[];
  claimedPerkIds: string[];
  onClaimPerk: (perk: PartnerPerk) => void;
  onOpenPartnerModal: () => void;
}

export const PerksAndSpotlightSection: React.FC<PerksAndSpotlightSectionProps> = ({
  perks,
  claimedPerkIds,
  onClaimPerk,
  onOpenPartnerModal,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const handleCopyCode = async (perk: PartnerPerk) => {
    try {
      await navigator.clipboard.writeText(perk.promoCode);
      setCopiedId(perk.id);
      window.setTimeout(() => setCopiedId(null), 2000);
    } catch {
      setCopiedId(perk.id);
    }
  };

  return (
    <div className="space-y-14">
      <section id="perks" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400">
              Featured Local Perks
            </p>
            <h2 className="mt-1 font-display text-2xl font-bold tracking-tight text-slate-950 dark:text-white text-balance">
              Neighborhood offers ready to claim
            </h2>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md">
            Exclusive savings funded by Spotly Partner businesses—no subscriptions or hidden fees.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {perks.map((perk) => {
            const isClaimed = claimedPerkIds.includes(perk.id);
            const imgBroken = failedImages[perk.id];

            return (
              <article
                key={perk.id}
                className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="aspect-[4/3] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
                  {!imgBroken ? (
                    <img
                      src={perk.imageUrl}
                      alt={perk.businessName}
                      referrerPolicy="no-referrer"
                      onError={() =>
                        setFailedImages((prev) => ({ ...prev, [perk.id]: true }))
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-rose-50 to-slate-100 p-6 text-center dark:from-slate-800 dark:to-slate-900">
                      <Tag className="h-8 w-8 text-rose-600 dark:text-rose-400" aria-hidden="true" />
                      <span className="mt-2 font-display text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {perk.businessName}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="capitalize font-medium text-rose-600 dark:text-rose-400">
                        {perk.tier}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="capitalize">{perk.category}</span>
                      <span aria-hidden="true">·</span>
                      <span>Valid through {perk.validUntil}</span>
                    </div>

                    <h3 className="mt-2 font-display text-lg font-bold text-slate-950 dark:text-white">
                      {perk.perkHeadline}
                    </h3>
                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-300">
                      {perk.businessName}
                    </p>
                    <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                      {perk.description}
                    </p>
                  </div>

                  <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
                    {isClaimed ? (
                      <div className="flex items-center justify-between gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 dark:border-emerald-800 dark:bg-emerald-950/50">
                        <div>
                          <p className="text-[11px] font-medium text-emerald-800 dark:text-emerald-300">
                            Member Code Claimed
                          </p>
                          <p className="font-mono text-sm font-bold tracking-wider text-emerald-950 dark:text-emerald-100">
                            {perk.promoCode}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleCopyCode(perk)}
                          className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-xs hover:bg-emerald-100 dark:bg-slate-900 dark:text-emerald-200 dark:hover:bg-slate-800 cursor-pointer"
                        >
                          {copiedId === perk.id ? (
                            <>
                              <Check className="h-3.5 w-3.5" aria-hidden="true" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                              Copy
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onClaimPerk(perk)}
                        className="flex min-h-[44px] w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 transition-colors cursor-pointer"
                      >
                        Claim Free Perk
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section id="spotlight" className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-950 dark:border-slate-800">
          <img
            src="/src/assets/images/spotly_partner_spotlight_1794823821431.jpg"
            alt="Bustling neighborhood corner cafe and boutique storefront"
            referrerPolicy="no-referrer"
            className="h-80 w-full object-cover opacity-70 sm:h-96"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/30" />

          <div className="relative z-10 flex flex-col justify-between gap-6 p-6 sm:p-10 lg:flex-row lg:items-end">
            <div className="max-w-xl">
              <p className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-wide text-rose-400">
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Spotly Business Partner Spotlight
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl text-balance">
                Turn nearby browsers into loyal neighborhood regulars
              </h2>
              <p className="mt-3 text-sm sm:text-base text-slate-200">
                Feature your restaurant, cafe, or retail store in Spotly&apos;s personalized local feed and launch trackable neighborhood perks in under two minutes.
              </p>
              <div className="mt-5 flex flex-wrap gap-6 text-sm text-slate-200 tabular-nums">
                <div>
                  <span className="block font-display text-xl font-bold text-white">3.4x</span>
                  <span className="text-xs text-slate-300">More walk-in directions</span>
                </div>
                <div>
                  <span className="block font-display text-xl font-bold text-white">$49/mo</span>
                  <span className="text-xs text-slate-300">Neighborhood Spotlight tier</span>
                </div>
                <div>
                  <span className="block font-display text-xl font-bold text-white">0%</span>
                  <span className="text-xs text-slate-300">Commission on in-store redemptions</span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <button
                type="button"
                onClick={onOpenPartnerModal}
                className="min-h-[48px] rounded-xl bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-rose-500 transition-colors whitespace-nowrap cursor-pointer"
              >
                Create Partner Spotlight
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
