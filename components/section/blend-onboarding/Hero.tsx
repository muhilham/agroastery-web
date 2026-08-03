export function Hero() {
  return (
    <header className="mx-auto max-w-2xl px-6 pt-16 pb-10 text-center sm:pt-24">
      <p
        aria-hidden="true"
        className="font-mono text-sm tracking-[0.4em] text-[#9C6B3E]"
      >
        50<span className="text-[hsl(var(--secondary))]"> : </span>
        <span className="text-[hsl(var(--primary))]">50</span>
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[hsl(var(--primary))] sm:text-4xl">
        Blend 50:50
      </h1>
      <p className="mt-3 text-base text-[hsl(var(--secondary))]">
        Dirancang untuk minuman berbasis susu.
      </p>
      <p className="mx-auto mt-6 max-w-md text-sm leading-relaxed text-[hsl(var(--secondary))]">
        Halaman ini membagikan resep persis yang digunakan AGRoastery untuk menyeduh Blend 50:50.
      </p>
      <nav className="mt-10 flex flex-wrap justify-center gap-3">
        <a
          href="#espresso"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-[hsl(var(--primary))] transition hover:border-[#9C6B3E]/60 hover:text-[#9C6B3E]"
        >
          Espresso
        </a>
        <a
          href="#iced-americano"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-[hsl(var(--primary))] transition hover:border-[#9C6B3E]/60 hover:text-[#9C6B3E]"
        >
          Iced Americano
        </a>
        <a
          href="#es-kopi-susu"
          className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-medium text-[hsl(var(--primary))] transition hover:border-[#9C6B3E]/60 hover:text-[#9C6B3E]"
        >
          Es Kopi Susu
        </a>
      </nav>
    </header>
  );
}
