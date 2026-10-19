"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

interface Phrase {
  prefix: string;
  mid: string;
  suffix: string;
}

const PHRASES: Phrase[] = [
  { prefix: "orchestrated by", mid: "& his", suffix: "agents" },
  { prefix: "prompted by", mid: ", shipped by his", suffix: "agents" },
  { prefix: "commanded by", mid: "& his", suffix: "agents" },
  { prefix: "spawned by", mid: "& his", suffix: "agents" },
  { prefix: "engineered by", mid: "& his", suffix: "agents" },
  { prefix: "dispatched by", mid: "& his", suffix: "agents" },
  { prefix: "steered by", mid: "& his", suffix: "agents" },
  { prefix: "conjured by", mid: "& his", suffix: "agents" },
  { prefix: "manifested by", mid: "& his", suffix: "agents" },
  { prefix: "cooked by", mid: "& his", suffix: "agents" },
];

const GLYPHS = "01#@*&%$§∆λΨ⌘~_/<>{}=+";

interface FooterProps {
  showAdmin?: boolean;
}

export function Footer({ showAdmin = true }: FooterProps) {
  // Stable SSR default, randomized on client mount to avoid hydration mismatch
  const [phrase, setPhrase] = useState<Phrase>(PHRASES[0]);
  const [displayText, setDisplayText] = useState("agents");
  const [isGlitching, setIsGlitching] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const pick = PHRASES[Math.floor(Math.random() * PHRASES.length)];
    setPhrase(pick);
    setDisplayText(pick.suffix);
  }, []);

  const triggerGlitch = useCallback(() => {
    if (isGlitching) return;
    setIsGlitching(true);

    const target = phrase.suffix;
    const duration = 450;
    const start = performance.now();

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);

      const nextText = target
        .split("")
        .map((char, i) => {
          if (progress >= (i + 1) / target.length) return char;
          return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
        })
        .join("");

      setDisplayText(nextText);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      } else {
        setDisplayText(target);
        setIsGlitching(false);
      }
    };

    frameRef.current = requestAnimationFrame(tick);
  }, [isGlitching, phrase.suffix]);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <footer className="footer">
      <p className="footer-credits">
        <span className="footer-prefix">{phrase.prefix}</span>{" "}
        <a
          href="https://sc.is-a.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="signature"
          title="sc.is-a.dev"
        >
          SC
        </a>{" "}
        <span className="footer-mid">{phrase.mid}</span>{" "}
        <span
          className={`agents-container ${isGlitching ? "is-glitching" : ""}`}
          onMouseEnter={triggerGlitch}
          onClick={triggerGlitch}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              triggerGlitch();
            }
          }}
          title="Hover or click to trigger agents"
        >
          <span className="agents-text">{displayText}</span>
          <span className="squiggly-line" aria-hidden="true" />
        </span>
      </p>
      {showAdmin && (
        <p className="footer-admin">
          <Link href="/admin">Admin</Link>
        </p>
      )}
    </footer>
  );
}
