import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms of Service" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service">
      <p>By using Calorie Tracker you agree to these terms. If you don&apos;t agree, please don&apos;t use the app.</p>

      <section>
        <h2>The service</h2>
        <p>
          Calorie Tracker is a free personal project for estimating calorie needs and logging food. It is provided
          &ldquo;as is&rdquo;, without warranties of any kind, and may change, break or shut down at any time.
        </p>
      </section>

      <section>
        <h2>Not medical advice</h2>
        <p>
          Calorie estimates, AI macro estimates and calculator targets are approximations. They are not medical or
          nutritional advice. Talk to a doctor or registered dietitian before making significant changes to your diet,
          especially if you have a health condition.
        </p>
      </section>

      <section>
        <h2>Your account</h2>
        <ul>
          <li>Keep your sign-in details secure. You&apos;re responsible for activity on your account.</li>
          <li>
            Don&apos;t misuse the app: no attempts to access other people&apos;s data, overload the service or abuse the
            AI feature.
          </li>
          <li>Accounts that break these terms may be suspended or deleted.</li>
        </ul>
      </section>

      <section>
        <h2>Your data</h2>
        <p>
          You own what you enter. How it&apos;s stored and shared is described in the{" "}
          <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </section>

      <section>
        <h2>Liability</h2>
        <p>
          To the extent the law allows, the developer isn&apos;t liable for any loss or harm arising from using the app,
          including lost data or decisions based on its numbers.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
        </p>
      </section>
    </LegalPage>
  );
}
