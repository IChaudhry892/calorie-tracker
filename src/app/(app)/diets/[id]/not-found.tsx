import Link from "next/link";
import { buttonClasses } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function DietNotFound() {
  return (
    <EmptyState
      title="Diet not found"
      text="It may have been deleted, or the link is wrong."
      action={
        <Link href="/diets" className={buttonClasses({ variant: "secondary" })}>
          Back to diets
        </Link>
      }
    />
  );
}
