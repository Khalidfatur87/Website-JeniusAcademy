import clsx from "clsx";
import Image from "next/image";

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

const PX: Record<string, number> = { "size-7": 28, "size-8": 32, "size-9": 36, "size-10": 40, "size-24": 96 };

/** Foto profil, atau inisial nama bila belum ada foto. */
export function Avatar({
  name,
  src,
  size = "size-8",
}: {
  name: string;
  src?: string | null;
  size?: keyof typeof PX | string;
}) {
  if (src) {
    const px = PX[size] ?? 40;
    return (
      <Image
        src={src}
        alt=""
        width={px}
        height={px}
        unoptimized
        className={clsx("shrink-0 rounded-full object-cover", size)}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={clsx(
        "grid shrink-0 place-items-center rounded-full bg-brand-strong text-xs font-bold text-on-brand",
        size,
      )}
    >
      {initials(name)}
    </span>
  );
}
