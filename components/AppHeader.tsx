"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Nauka" },
  { href: "/postepy", label: "Postępy" },
] as const;

type AppHeaderProps = {
  userName: string;
  onSignOut: () => void;
};

export default function AppHeader({ userName, onSignOut }: AppHeaderProps) {
  const pathname = usePathname();

  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex h-14 w-full max-w-[640px] items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-5">
          <Link href="/" className="text-lg font-bold">
            Quiz z historii
          </Link>
          <nav aria-label="Główna nawigacja">
            <ul className="flex items-center gap-4 text-sm">
              {NAV_ITEMS.map((item) => {
                const active = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={
                        active
                          ? "font-semibold underline decoration-2 underline-offset-8"
                          : "hover:underline hover:underline-offset-8"
                      }
                    >
                      {item.label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <span className="hidden max-w-[12rem] truncate sm:inline">{userName}</span>
          <button
            type="button"
            className="underline hover:no-underline"
            onClick={onSignOut}
          >
            Wyloguj
          </button>
        </div>
      </div>
    </header>
  );
}
