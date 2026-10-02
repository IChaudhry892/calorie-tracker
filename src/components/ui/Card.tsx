import type { ReactNode } from "react";

type CardProps = {
  as?: "div" | "section" | "article" | "li";
  className?: string;
  children: ReactNode;
};

export function Card({ as: Tag = "div", className = "", children }: CardProps) {
  return <Tag className={`rounded-2xl bg-surface p-4 md:p-6 ${className}`}>{children}</Tag>;
}
