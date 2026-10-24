import "./avatar.css";

export type AvatarProps = {
  /** Имя человека или компании. Из него берутся инициалы и подпись для диктора. */
  name: string;
  /** Фотография. Нет — показываются инициалы. */
  src?: string;
  size?: "sm" | "md" | "lg";
};

function initials(name: string) {
  return name.replace(/[^\p{L}\p{N}\s]/gu, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]!.toUpperCase()).join("");
}

export function Avatar({ name, src, size = "md" }: AvatarProps) {
  return (
    <span className={`ds-avatar ds-avatar--${size}`} role="img" aria-label={name} data-component="Avatar">
      {src ? <img src={src} alt="" /> : <span aria-hidden="true">{initials(name)}</span>}
    </span>
  );
}
