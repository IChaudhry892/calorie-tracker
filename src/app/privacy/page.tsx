import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { CONTACT_EMAIL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy Policy" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy">
      <p>
        Calorie Tracker is a personal project for tracking calories and protein. This page explains what it stores about
        you, why, and how to have it deleted.
      </p>

      <section>
        <h2>What we collect</h2>
        <ul>
          <li>
            <strong>Account details:</strong> your email address. If you sign in with Google, we receive your name,
            email address and profile picture from Google, and use them only to sign you in.
          </li>
          <li>
            <strong>Calculator details you save:</strong> age, sex, height, weight, activity level, unit preference and
            the resulting maintenance calories.
          </li>
          <li>
            <strong>What you enter:</strong> your foods, diets and daily log entries (names, quantities, calories and
            protein).
          </li>
          <li>
            <strong>AI usage:</strong> a daily count of your AI estimates, used to enforce the limit of 50 per day.
          </li>
        </ul>
        <p>There are no analytics, advertising or tracking cookies. The only cookies keep you signed in.</p>
      </section>

      <section>
        <h2>How it&apos;s used and shared</h2>
        <p>Your data is used only to run the app for you. It is never sold or used for advertising.</p>
        <ul>
          <li>
            <strong>Supabase</strong> stores your account and data. Database rules ensure each account can only read its
            own rows.
          </li>
          <li>
            <strong>Vercel</strong> hosts the website and keeps standard server logs, such as IP addresses.
          </li>
          <li>
            <strong>Google Gemini:</strong> when you choose <em>Estimate with AI</em>, the food name and serving size
            you typed (for example &ldquo;banana, 1 piece&rdquo;) are sent to Google&apos;s Gemini API. Nothing else
            about you is included. Google may use these prompts to improve its products.
          </li>
        </ul>
      </section>

      <section>
        <h2>Google user data</h2>
        <p>
          Signing in with Google only shares your basic profile (name, email address and profile picture). It is used
          solely to create and sign in to your account, and it is not shared with anyone else or used for any other
          purpose. Calorie Tracker&apos;s use of information received from Google APIs adheres to the{" "}
          <a href="https://developers.google.com/terms/api-services-user-data-policy">
            Google API Services User Data Policy
          </a>
          , including the Limited Use requirements.
        </p>
      </section>

      <section>
        <h2>Keeping and deleting your data</h2>
        <p>
          Your data is kept until you ask for it to be deleted. To delete your account and everything in it, email{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> from the address you signed up with. Deleting the
          account removes your profile, foods, diets, log entries and AI usage records.
        </p>
      </section>

      <section>
        <h2>Contact</h2>
        <p>
          Questions about this policy: <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. If the policy changes,
          the date at the top is updated.
        </p>
      </section>
    </LegalPage>
  );
}
