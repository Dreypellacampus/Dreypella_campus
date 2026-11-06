interface SectionHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  tone?: 'light' | 'dark';
}

export default function SectionHeader({
  eyebrow,
  title,
  description,
  align = 'center',
  tone = 'light',
}: SectionHeaderProps) {
  const isDark = tone === 'dark';

  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-red-500">{eyebrow}</p>
      <h2
        className={`mt-3 text-3xl font-extrabold leading-[1.2] tracking-tight sm:text-4xl ${
          isDark ? 'text-white' : 'text-navy-900'
        }`}
      >
        {title}
      </h2>
      {description && (
        <p
          className={`mt-4 text-base leading-relaxed sm:text-lg ${
            isDark ? 'text-navy-100' : 'text-navy-700'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}
