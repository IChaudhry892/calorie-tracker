"use client";

import Link from "next/link";
import { useActionState, useMemo, useState, type ReactNode } from "react";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import {
  ACTIVITY,
  ACTIVITY_LEVELS,
  bmr,
  goalCalories,
  maintenanceCalories,
  MIN_SAFE_CALORIES,
  SEXES,
  type ActivityLevel,
  type Sex,
} from "@/lib/calories";
import type { Profile } from "@/lib/db";
import { formatCalories } from "@/lib/macros";
import { CM_PER_IN, cmToFtIn, formatLb, ftInToCm, kgToLb, lbToKg } from "@/lib/units";
import { saveProfile } from "./actions";

type UnitSystem = "metric" | "imperial";
type Field = "age" | "height" | "inches" | "weight";

export type CalculatorProfile = Pick<
  Profile,
  "unit_system" | "sex" | "age" | "height_cm" | "weight_kg" | "activity_level" | "maintenance_calories"
>;

const activityOptions = ACTIVITY_LEVELS.map((level) => ({
  value: level,
  label: level === "bmr" ? ACTIVITY.bmr.label : `${ACTIVITY[level].label}: ${ACTIVITY[level].description}`,
}));

// Same ranges as the save action and the DB check constraints.
const LIMITS = { age: [13, 120], heightCm: [50, 275], weightKg: [20, 550] } as const;
// Whole imperial bounds that fall inside the metric ones: 1′8″–9′0″ and 45–1212 lb.
const HEIGHT_IN = [Math.ceil(LIMITS.heightCm[0] / CM_PER_IN), Math.floor(LIMITS.heightCm[1] / CM_PER_IN)] as const;
const WEIGHT_LB = [Math.ceil(kgToLb(LIMITS.weightKg[0])), Math.floor(kgToLb(LIMITS.weightKg[1]))] as const;

const ftIn = (inches: number) => `${Math.floor(inches / 12)} ft ${inches % 12} in`;
const ERRORS = {
  age: `Enter a whole age from ${LIMITS.age[0]} to ${LIMITS.age[1]}.`,
  heightCm: `Enter a height from ${LIMITS.heightCm[0]} to ${LIMITS.heightCm[1]} cm.`,
  weightKg: `Enter a weight from ${LIMITS.weightKg[0]} to ${LIMITS.weightKg[1]} kg.`,
  heightImperial: `Enter a height from ${ftIn(HEIGHT_IN[0])} to ${ftIn(HEIGHT_IN[1])}.`,
  inches: "Inches must be from 0 to 11.",
  weightLb: `Enter a weight from ${WEIGHT_LB[0]} to ${WEIGHT_LB[1]} lb.`,
};

/** `value` if it's one of `values` (DB columns are plain text), else `fallback`. */
function oneOf<T extends string>(values: readonly T[], value: string | null | undefined, fallback: T): T {
  return values.includes(value as T) ? (value as T) : fallback;
}

/** A finite number from a form string, or null ("" and "abc" don't parse). */
function parse(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function inRange(n: number | null, [min, max]: readonly [number, number]): n is number {
  return n !== null && n >= min && n <= max;
}

/** Rounded to the 2 decimals the profile stores (and Save sends). */
function round2(n: number): number {
  return Number(n.toFixed(2));
}

/** Two decimals at most, without trailing zeros (57.15 → "57.15", 80 → "80"). */
function trim(n: number): string {
  return round2(n).toString();
}

function imperialFromMetric(heightCm: string, weightKg: string) {
  const cm = parse(heightCm);
  const kg = parse(weightKg);
  const ftIn = cm === null ? null : cmToFtIn(cm);
  return {
    ft: ftIn ? String(ftIn.ft) : "",
    inches: ftIn ? String(ftIn.in) : "",
    lb: kg === null ? "" : formatLb(kgToLb(kg)),
  };
}

export function CalculatorForm({ profile, signedIn }: { profile: CalculatorProfile | null; signedIn: boolean }) {
  // Raw strings, so a half-typed "1" or an empty field isn't fought by the form.
  // US/Imperial by default. The DB column defaults to 'metric', so only trust it once the user has saved.
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(
    profile?.maintenance_calories != null && profile.unit_system === "metric" ? "metric" : "imperial",
  );
  const [sex, setSex] = useState<Sex>(oneOf(SEXES, profile?.sex, "male"));
  const [age, setAge] = useState(profile?.age?.toString() ?? "");
  const [heightCm, setHeightCm] = useState(profile?.height_cm != null ? trim(profile.height_cm) : "");
  const [weightKg, setWeightKg] = useState(profile?.weight_kg != null ? trim(profile.weight_kg) : "");
  // From the exact saved values, not the display strings, so 57.15 kg comes back as 126 lb.
  const initialImperial = imperialFromMetric(
    profile?.height_cm?.toString() ?? "",
    profile?.weight_kg?.toString() ?? "",
  );
  const [ft, setFt] = useState(initialImperial.ft);
  const [inches, setInches] = useState(initialImperial.inches);
  const [lb, setLb] = useState(initialImperial.lb);
  const [activity, setActivity] = useState<ActivityLevel>(oneOf(ACTIVITY_LEVELS, profile?.activity_level, "moderate"));

  const [saveState, saveAction, savePending] = useActionState(saveProfile, {});

  // Everything below works in metric; imperial is converted here.
  const metric = useMemo(() => {
    // Rounded like the saved values, so the live result is exactly what Save stores.
    const rounded = (n: number | null) => (n === null ? null : round2(n));
    if (unitSystem === "metric") return { heightCm: rounded(parse(heightCm)), weightKg: rounded(parse(weightKg)) };
    const f = parse(ft);
    const i = inches.trim() === "" ? 0 : parse(inches);
    const p = parse(lb);
    return {
      heightCm: f === null || i === null ? null : round2(ftInToCm(f, i)),
      weightKg: p === null ? null : round2(lbToKg(p)),
    };
  }, [unitSystem, heightCm, weightKg, ft, inches, lb]);

  // Fields the user has left at least once. Errors show after blur, or straight
  // away when a value is already too big, so typing "1" on the way to "180" isn't flagged.
  const [touched, setTouched] = useState<ReadonlySet<Field>>(new Set());
  const touch = (field: Field) => () => setTouched((prev) => new Set(prev).add(field));

  const errors = useMemo(() => {
    const e: Partial<Record<Field, { message: string; tooBig: boolean }>> = {};
    const check = (field: Field, raw: string, n: number | null, range: readonly [number, number], message: string) => {
      if (raw.trim() !== "" && !inRange(n, range)) e[field] = { message, tooBig: n !== null && n > range[1] };
    };
    const a = parse(age);
    check("age", age, a !== null && !Number.isInteger(a) ? NaN : a, LIMITS.age, ERRORS.age);
    if (unitSystem === "metric") {
      check("height", heightCm, metric.heightCm, LIMITS.heightCm, ERRORS.heightCm);
      check("weight", weightKg, metric.weightKg, LIMITS.weightKg, ERRORS.weightKg);
    } else {
      check("inches", inches, parse(inches), [0, 11.99], ERRORS.inches);
      if (!e.inches) check("height", ft, metric.heightCm, LIMITS.heightCm, ERRORS.heightImperial);
      check("weight", lb, metric.weightKg, LIMITS.weightKg, ERRORS.weightLb);
    }
    return e;
  }, [age, unitSystem, heightCm, weightKg, ft, inches, lb, metric]);

  const shownError = (field: Field) => {
    const error = errors[field];
    return error && (error.tooBig || touched.has(field)) ? error.message : undefined;
  };

  const results = useMemo(() => {
    const a = parse(age);
    if (Object.keys(errors).length > 0 || a === null) return null;
    if (metric.heightCm === null || metric.weightKg === null) return null;
    const body = { sex, age: a, heightCm: metric.heightCm, weightKg: metric.weightKg };
    const maintenance = maintenanceCalories(body, activity);
    return { body, bmr: bmr(body), maintenance, goals: goalCalories(maintenance) };
  }, [age, sex, activity, metric, errors]);

  function switchUnits(next: UnitSystem) {
    if (next === unitSystem) return;
    if (next === "imperial") {
      const converted = imperialFromMetric(heightCm, weightKg);
      setFt(converted.ft);
      setInches(converted.inches);
      setLb(converted.lb);
    } else {
      setHeightCm(metric.heightCm === null ? "" : trim(metric.heightCm));
      setWeightKg(metric.weightKg === null ? "" : trim(metric.weightKg));
    }
    setUnitSystem(next);
  }

  // Whether the form differs from what's stored, so "Saved: N" is never mistaken for the current result.
  const unsaved =
    profile?.maintenance_calories != null &&
    (!results ||
      unitSystem !== profile.unit_system ||
      results.body.sex !== profile.sex ||
      results.body.age !== profile.age ||
      results.body.heightCm !== Number(profile.height_cm) ||
      results.body.weightKg !== Number(profile.weight_kg) ||
      activity !== profile.activity_level);

  const rateUnit = unitSystem === "metric" ? "kg" : "lb";
  const goals = results?.goals ?? [];
  const lossGoals = goals.filter((g) => g.delta < 0);
  const gainGoals = goals.filter((g) => g.delta > 0);

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5">
        <div role="group" aria-label="Units" className="grid grid-cols-2 gap-1 rounded-lg bg-background p-1 sm:w-80">
          {(["imperial", "metric"] as const).map((system) => (
            <button
              key={system}
              type="button"
              aria-pressed={unitSystem === system}
              onClick={() => switchUnits(system)}
              className="rounded-md px-3 py-2 text-sm font-medium text-foreground/70 transition hover:text-accent-hover focus-visible:outline-2 focus-visible:outline-accent aria-pressed:bg-surface aria-pressed:text-accent"
            >
              {system === "metric" ? "Metric" : "US/Imperial"}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Age"
            type="number"
            inputMode="numeric"
            min={LIMITS.age[0]}
            max={LIMITS.age[1]}
            step={1}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            error={shownError("age")}
            onBlur={touch("age")}
          />

          <fieldset className="flex flex-col gap-1">
            <legend className="mb-1 text-sm font-medium">Sex</legend>
            <div className="grid grid-cols-2 gap-2">
              {SEXES.map((option) => (
                <label
                  key={option}
                  className="flex cursor-pointer items-center justify-center rounded-lg border border-accent/40 bg-background px-3 py-2 capitalize transition-colors has-checked:border-accent has-checked:text-accent has-focus-visible:ring-1 has-focus-visible:ring-inset has-focus-visible:ring-accent"
                >
                  <input
                    type="radio"
                    name="sex-choice"
                    value={option}
                    checked={sex === option}
                    onChange={() => setSex(option)}
                    className="sr-only"
                  />
                  {option}
                </label>
              ))}
            </div>
          </fieldset>

          {unitSystem === "metric" ? (
            <>
              <Input
                label="Height (cm)"
                type="number"
                inputMode="decimal"
                min={LIMITS.heightCm[0]}
                max={LIMITS.heightCm[1]}
                step="any"
                value={heightCm}
                onChange={(e) => setHeightCm(e.target.value)}
                error={shownError("height")}
                onBlur={touch("height")}
              />
              <Input
                label="Weight (kg)"
                type="number"
                inputMode="decimal"
                min={LIMITS.weightKg[0]}
                max={LIMITS.weightKg[1]}
                step="any"
                value={weightKg}
                onChange={(e) => setWeightKg(e.target.value)}
                error={shownError("weight")}
                onBlur={touch("weight")}
              />
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  label="Height (ft)"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  max={9}
                  step={1}
                  value={ft}
                  onChange={(e) => setFt(e.target.value)}
                  error={shownError("height")}
                  onBlur={touch("height")}
                />
                <Input
                  label="Height (in)"
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={11.99}
                  step="any"
                  value={inches}
                  onChange={(e) => setInches(e.target.value)}
                  error={shownError("inches")}
                  onBlur={touch("inches")}
                />
              </div>
              <Input
                label="Weight (lb)"
                type="number"
                inputMode="decimal"
                min={WEIGHT_LB[0]}
                max={WEIGHT_LB[1]}
                step="any"
                value={lb}
                onChange={(e) => setLb(e.target.value)}
                error={shownError("weight")}
                onBlur={touch("weight")}
              />
            </>
          )}

          <div className="sm:col-span-2">
            <Select
              label="Activity"
              value={activity}
              onChange={(e) => setActivity(e.target.value as ActivityLevel)}
              options={activityOptions}
            />
          </div>
        </div>
      </Card>

      <section aria-live="polite" aria-label="Results" className="flex flex-col gap-6">
        {results ? (
          <>
            <Card className="border-2 border-accent text-center">
              <h2 className="text-sm font-medium uppercase tracking-wide text-foreground/70">Maintenance</h2>
              <p className="mt-1 text-5xl font-semibold text-heading">
                {formatCalories(results.maintenance)}
                <span className="ml-2 text-base font-normal text-foreground/70">kcal/day</span>
              </p>
              <p className="mt-2 text-sm text-foreground/70">BMR: {formatCalories(results.bmr)} kcal/day</p>
            </Card>

            <GoalGroup title="Lose weight">
              {lossGoals.map((g) => (
                <GoalCard
                  key={g.key}
                  label={g.label}
                  rate={`−${unitSystem === "metric" ? g.rateKg : g.rateLb} ${rateUnit}/week`}
                  calories={g.calories}
                  delta={g.delta}
                  warning={
                    g.calories < MIN_SAFE_CALORIES[sex]
                      ? `Below the safe minimum of ${MIN_SAFE_CALORIES[sex]} kcal/day.`
                      : undefined
                  }
                />
              ))}
            </GoalGroup>

            <GoalGroup title="Gain weight">
              {gainGoals.map((g) => (
                <GoalCard
                  key={g.key}
                  label={g.label}
                  rate={`+${unitSystem === "metric" ? g.rateKg : g.rateLb} ${rateUnit}/week`}
                  calories={g.calories}
                  delta={g.delta}
                />
              ))}
            </GoalGroup>
          </>
        ) : (
          <p className="text-sm text-foreground/60">
            {(["age", "height", "inches", "weight"] as const).some(shownError)
              ? "Fix the highlighted fields to see results."
              : "Enter your details to see results."}
          </p>
        )}
      </section>

      {signedIn ? (
        <form action={saveAction} className="flex flex-col items-start gap-2">
          {results && (
            <>
              <input type="hidden" name="unit_system" value={unitSystem} />
              <input type="hidden" name="sex" value={sex} />
              <input type="hidden" name="age" value={results.body.age} />
              <input type="hidden" name="height_cm" value={results.body.heightCm} />
              <input type="hidden" name="weight_kg" value={results.body.weightKg} />
              <input type="hidden" name="activity_level" value={activity} />
            </>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={!results || savePending}>
              {savePending ? "Saving…" : "Save"}
            </Button>
            {profile?.maintenance_calories != null && (
              <span className="text-sm text-foreground/70">
                Saved: {profile.maintenance_calories} kcal/day
                {unsaved && <span className="text-accent"> · unsaved changes</span>}
              </span>
            )}
          </div>
          <p aria-live="polite" role="status" className="min-h-6 text-sm">
            {saveState.error && <span className="text-red-300">{saveState.error}</span>}
            {saveState.message && <span className="text-accent">{saveState.message}</span>}
          </p>
        </form>
      ) : (
        <div>
          <Link href="/login?next=/calculator" className={buttonClasses({ variant: "secondary" })}>
            Log in to save
          </Link>
        </div>
      )}
    </div>
  );
}

function GoalGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="text-lg font-semibold text-heading">{title}</h2>
      <ul className="grid gap-3 sm:grid-cols-3">{children}</ul>
    </div>
  );
}

type GoalCardProps = { label: string; rate: string; calories: number; delta: number; warning?: string };

function GoalCard({ label, rate, calories, delta, warning }: GoalCardProps) {
  return (
    <Card as="li" className="flex flex-col gap-1">
      <span className="font-medium text-heading">{label}</span>
      <span className="text-sm text-foreground/70">{rate}</span>
      <span className="text-2xl font-semibold text-accent">
        {formatCalories(calories)} <span className="text-sm font-normal text-foreground/70">kcal/day</span>
      </span>
      <span className="text-sm text-foreground/70">
        {formatCalories(Math.abs(delta))} kcal {delta < 0 ? "deficit" : "surplus"}
      </span>
      {warning && <span className="text-xs text-red-300">{warning}</span>}
    </Card>
  );
}
