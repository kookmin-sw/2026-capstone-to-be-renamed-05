import Image from "next/image";
import styles from "./author-avatar.module.css";

interface AuthorAvatarProps {
  authorName: string;
  imageUrl: string | null;
  isAnonymous: boolean;
  size?: "sm" | "md";
}

export function AuthorAvatar({
  authorName,
  imageUrl,
  isAnonymous,
  size = "sm",
}: AuthorAvatarProps) {
  const initial = isAnonymous ? "익" : getInitial(authorName);
  const sizeClass = size === "md" ? styles.avatarMd : styles.avatarSm;

  return (
    <span className={`${styles.avatar} ${sizeClass}`} aria-hidden="true">
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt=""
          className={styles.avatarImage}
          fill
          loading="lazy"
          sizes={size === "md" ? "32px" : "24px"}
        />
      ) : (
        <span className={styles.avatarInitial}>{initial}</span>
      )}
    </span>
  );
}

function getInitial(authorName: string) {
  const trimmed = authorName.trim();
  return trimmed ? Array.from(trimmed)[0] : "?";
}
