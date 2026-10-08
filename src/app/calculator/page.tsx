import { createClient } from "@/lib/supabase/server";
import { CalculatorForm } from "./CalculatorForm";

export default async function CalculatorPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;

  const profile = claims
    ? (
        await supabase
          .from("profiles")
          .select("unit_system, sex, age, height_cm, weight_kg, activity_level, maintenance_calories")
          .eq("id", claims.sub)
          .maybeSingle()
      ).data
    : null;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl font-semibold text-heading">Calorie Calculator</h1>
      <CalculatorForm profile={profile} signedIn={!!claims} />
    </div>
  );
}
