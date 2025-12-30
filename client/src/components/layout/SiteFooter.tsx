"use client";
/*
  Site footer.
  - Simple shared footer used across public-facing pages
*/

type SiteFooterProps = {
  className?: string;
};

export default function SiteFooter({ className = "" }: SiteFooterProps) {
  return (
    <footer className={`mx-auto w-full max-w-screen-2xl px-6 lg:px-8 py-12 text-sm text-gray-700 text-center ${className}`}>
      © {new Date().getFullYear()} NNPL. All rights reserved.
    </footer>
  );
}


