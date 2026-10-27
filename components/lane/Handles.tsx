import { Fragment } from "react";

// "@name" (letters, digits, dots, underscores), not counting a sentence's final full stop.
const HANDLE = /@([A-Za-z0-9._]*[A-Za-z0-9_])/g;

/** Text with every @handle linked to its Instagram profile. */
export default function Handles({ text, className }: { text: string; className?: string }) {
  const parts: React.ReactNode[] = [];
  let last = 0;
  for (const match of text.matchAll(HANDLE)) {
    parts.push(text.slice(last, match.index));
    parts.push(
      <a
        key={match.index}
        className={className}
        href={`https://www.instagram.com/${match[1]}/`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {match[0]}
      </a>
    );
    last = match.index + match[0].length;
  }
  parts.push(text.slice(last));
  return <Fragment>{parts}</Fragment>;
}
