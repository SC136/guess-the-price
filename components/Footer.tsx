import Link from "next/link";

interface FooterProps {
  showAdmin?: boolean;
}

export function Footer({ showAdmin = true }: FooterProps) {
  return (
    <footer className="footer">
      <p className="footer-credits">
        Made by{" "}
        <a
          href="https://sc.is-a.dev/"
          target="_blank"
          rel="noopener noreferrer"
          className="signature"
          title="sc.is-a.dev"
        >
          SC
        </a>
      </p>
      {showAdmin && (
        <p className="footer-admin">
          <Link href="/admin">Admin</Link>
        </p>
      )}
    </footer>
  );
}
