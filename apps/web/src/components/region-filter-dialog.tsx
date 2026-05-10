'use client';

import { Check, ChevronDown, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { koreaRegions } from '@/lib/regions';
import { cn } from '@/lib/utils';

export function RegionFilterDialog({
  selectedLocations,
  onChange,
  variant = 'default',
  className,
}: {
  selectedLocations: string[];
  onChange: (locations: string[]) => void;
  variant?: 'default' | 'compact';
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const [activeProvince, setActiveProvince] = useState('전국');
  const [draftLocations, setDraftLocations] = useState<string[]>([]);

  const activeGroup = koreaRegions.find((region) => region.province === activeProvince);
  const summary = summarizeLocations(selectedLocations);

  const selectedCounts = useMemo(() => {
    return koreaRegions.reduce<Record<string, number>>((acc, region) => {
      const provinceSelected = draftLocations.includes(region.province);
      const districtCount = region.districts.filter((district) =>
        draftLocations.includes(`${region.province} ${district}`),
      ).length;
      acc[region.province] = provinceSelected ? region.districts.length : districtCount;
      return acc;
    }, {});
  }, [draftLocations]);

  const openDialog = () => {
    setDraftLocations(selectedLocations);
    setActiveProvince(selectedLocations[0]?.split(' ')[0] ?? '전국');
    setOpen(true);
  };

  const closeDialog = () => setOpen(false);

  const apply = () => {
    onChange([...draftLocations]);
    setOpen(false);
  };

  const reset = () => setDraftLocations([]);

  const toggleProvince = (province: string) => {
    setDraftLocations((current) => {
      if (current.includes(province)) {
        return current.filter((location) => location !== province);
      }
      return [...current.filter((location) => !location.startsWith(`${province} `)), province];
    });
  };

  const toggleDistrict = (province: string, district: string) => {
    const value = `${province} ${district}`;
    setDraftLocations((current) => {
      const withoutProvince = current.filter((location) => location !== province);
      if (current.includes(value)) {
        return withoutProvince.filter((location) => location !== value);
      }
      return [...withoutProvince, value];
    });
  };

  const removeDraftLocation = (location: string) => {
    setDraftLocations((current) => current.filter((selected) => selected !== location));
  };
  const compact = variant === 'compact';

  return (
    <div className={className}>
      <p className={compact ? 'mb-2 text-xs font-bold text-gray-800' : 'text-sm font-medium text-[var(--app-muted)]'}>
        지역
      </p>
      <button
        type="button"
        onClick={openDialog}
        className={cn(
          'flex w-full items-center justify-between border border-[var(--app-line)] bg-white text-left text-[var(--foreground)] outline-none focus:border-[var(--brand)]',
          compact ? 'rounded-lg px-2 py-1.5 text-xs' : 'mt-2 px-3 py-2 text-sm',
        )}
      >
        <span className={cn('truncate', selectedLocations.length ? '' : 'text-[var(--app-muted)]')}>{summary}</span>
        <ChevronDown size={16} />
      </button>

      {selectedLocations.length > 0 && (
        <div className={compact ? 'mt-2 flex flex-wrap gap-1.5' : 'mt-2 flex flex-wrap gap-2'}>
          {selectedLocations.slice(0, compact ? 2 : 3).map((location) => (
            <span
              key={location}
              className="max-w-full truncate rounded border border-[var(--app-line)] bg-[#fbfbf8] px-2 py-1 text-xs text-[var(--app-muted)]"
            >
              {displayLocation(location)}
            </span>
          ))}
          {selectedLocations.length > (compact ? 2 : 3) && (
            <span className="rounded border border-[var(--app-line)] bg-[#fbfbf8] px-2 py-1 text-xs text-[var(--app-muted)]">
              +{selectedLocations.length - (compact ? 2 : 3)}
            </span>
          )}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-6"
          role="dialog"
          aria-modal="true"
          aria-label="지역 선택"
        >
          <div className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between px-6 py-5">
              <h2 className="text-2xl font-semibold tracking-normal">지역</h2>
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-md p-2 hover:bg-neutral-100"
                aria-label="닫기"
              >
                <X size={28} />
              </button>
            </div>

            <div className="grid gap-4 overflow-y-auto px-6 pb-5">
              <label className="text-sm font-medium text-[var(--app-muted)]">대한민국</label>

              <div className="grid min-h-[360px] overflow-hidden rounded-lg border border-[var(--app-line)] md:grid-cols-[1fr_1.05fr]">
                <div className="border-r border-[var(--app-line)] p-2">
                  <RegionNavButton
                    active={activeProvince === '전국'}
                    label="전국"
                    count={draftLocations.length}
                    onClick={() => {
                      setActiveProvince('전국');
                      reset();
                    }}
                  />
                  {koreaRegions.map((region) => (
                    <RegionNavButton
                      key={region.province}
                      active={activeProvince === region.province}
                      label={region.province}
                      count={selectedCounts[region.province] ?? 0}
                      onClick={() => setActiveProvince(region.province)}
                    />
                  ))}
                </div>

                <div className="max-h-[360px] overflow-y-auto p-2">
                  {activeGroup ? (
                    <>
                      <RegionCheckRow
                        label={`${activeGroup.province} 전체`}
                        checked={draftLocations.includes(activeGroup.province)}
                        onChange={() => toggleProvince(activeGroup.province)}
                      />
                      {activeGroup.districts.map((district) => (
                        <RegionCheckRow
                          key={district}
                          label={district}
                          checked={draftLocations.includes(`${activeGroup.province} ${district}`)}
                          onChange={() => toggleDistrict(activeGroup.province, district)}
                        />
                      ))}
                    </>
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-[var(--app-muted)]">
                      전국은 모든 지역을 포함합니다.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex min-h-12 flex-wrap gap-2">
                {draftLocations.map((location) => (
                  <button
                    key={location}
                    type="button"
                    onClick={() => removeDraftLocation(location)}
                    className="inline-flex items-center gap-2 rounded-md bg-neutral-100 px-3 py-2 text-sm font-medium text-neutral-700"
                  >
                    {displayLocation(location)}
                    <X size={16} />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-[160px_1fr] gap-4 border-t border-[var(--app-line)] px-6 py-5">
              <button
                type="button"
                onClick={reset}
                className="rounded-md border border-[var(--app-line)] px-4 py-3 text-base font-semibold"
              >
                초기화
              </button>
              <button
                type="button"
                onClick={apply}
                className="rounded-md bg-blue-600 px-4 py-3 text-base font-semibold text-white hover:bg-blue-700"
              >
                적용
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RegionNavButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        active
          ? 'flex w-full items-center justify-between rounded-md bg-neutral-100 px-4 py-3 text-left text-base font-semibold'
          : 'flex w-full items-center justify-between rounded-md px-4 py-3 text-left text-base font-semibold hover:bg-neutral-50'
      }
    >
      <span>{label}</span>
      {count > 0 && <span className="text-blue-600">{count}</span>}
    </button>
  );
}

function RegionCheckRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className="flex w-full cursor-pointer items-center justify-between rounded-md px-4 py-3 text-left text-base font-semibold hover:bg-neutral-50"
    >
      <span>{label}</span>
      <span
        aria-hidden="true"
        className={
          checked
            ? 'flex h-7 w-7 items-center justify-center rounded-md bg-blue-600 text-white'
            : 'h-7 w-7 rounded-md border-2 border-neutral-300 bg-white'
        }
      >
        {checked && <Check size={19} strokeWidth={3} />}
      </span>
    </button>
  );
}

function summarizeLocations(locations: string[]) {
  if (!locations.length) return '전체';
  if (locations.length === 1) return displayLocation(locations[0]);
  const first = displayLocation(locations[0]);
  return `${first} 외 ${locations.length - 1}`;
}

function displayLocation(location: string) {
  return location.includes(' ') ? location : `${location} 전체`;
}
