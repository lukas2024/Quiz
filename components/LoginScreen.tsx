import Image from "next/image";
import loginBg from "@/public/login-bg.jpg";

type LoginScreenProps = {
  onSignIn: () => void;
  errorMessage: string | null;
};

/** Pełnoekranowy widok logowania ze zdjęciem w tle (tylko dla niezalogowanych). */
export default function LoginScreen({ onSignIn, errorMessage }: LoginScreenProps) {
  return (
    <div className="fixed inset-0 z-10 flex items-center justify-center px-4">
      <Image
        src={loginBg}
        alt=""
        fill
        sizes="100vw"
        placeholder="blur"
        loading="eager"
        fetchPriority="high"
        className="-z-10 object-cover object-[45%_center]"
      />
      {/* Przyciemnienie całego zdjęcia, żeby jasne niebo nie raziło. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-black/30" />

      <div className="flex w-full max-w-sm flex-col items-center gap-6 rounded-2xl bg-white/85 px-6 py-10 text-zinc-900 shadow-xl backdrop-blur-md dark:bg-zinc-900/85 dark:text-zinc-50">
        <h2 className="text-4xl font-bold">Fiszki</h2>
        <button
          type="button"
          className="rounded-lg bg-zinc-900 px-5 py-2 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          onClick={onSignIn}
        >
          Zaloguj przez Google
        </button>
        {errorMessage && (
          <p role="alert" className="text-center text-sm text-red-700 dark:text-red-400">
            {errorMessage}
          </p>
        )}
      </div>
    </div>
  );
}
