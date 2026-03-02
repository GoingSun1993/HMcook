@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Noto+Sans+SC:wght@400;500;700&display=swap');
@import "tailwindcss";

@theme {
  --font-sans: "Inter", "Noto Sans SC", ui-sans-serif, system-ui, sans-serif;
}

body {
  @apply bg-[#FDFCFB] text-slate-900 antialiased;
}

.recipe-card-shadow {
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.03);
}
