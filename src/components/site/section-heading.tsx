import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
  number?: string;
};

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
  number,
}: SectionHeadingProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3",
        align === "center" && "items-center text-center",
        className
      )}
    >
      {(eyebrow || number) && (
        <div className={cn("flex items-center gap-3", align === "center" && "justify-center")}>
          {number && (
            <span className="font-mono-brand text-xs font-bold text-neon-red">{number}</span>
          )}
          {eyebrow && (
            <span className="font-mono-brand text-[11px] uppercase tracking-[0.3em] text-warm-yellow">
              {eyebrow}
            </span>
          )}
          <span className="h-px w-12 bg-gradient-to-r from-neon-red to-transparent" />
        </div>
      )}
      <h2 className="font-display text-3xl font-extrabold leading-tight text-off-white sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {description && (
        <p
          className={cn(
            "max-w-2xl text-base text-off-white/70 sm:text-lg",
            align === "center" && "mx-auto"
          )}
        >
          {description}
        </p>
      )}
    </div>
  );
}
