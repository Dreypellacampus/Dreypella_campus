import { Truck, MapPin, ArrowDownRight } from 'lucide-react';
import Button, { buttonStyles } from '@/components/ui/Button';
import { SERVICE_LIST } from '@/data/services';

interface HeroProps {
  onOrder: () => void;
}

const HERO_IMAGE =
  'https://images.pexels.com/photos/7683621/pexels-photo-7683621.jpeg?auto=compress&cs=tinysrgb&h=650&w=940';

export default function Hero({ onOrder }: HeroProps) {
  return (
    <section id="top" className="relative overflow-hidden bg-navy-900">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-red-500/20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-navy-400/30 blur-3xl"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-20 pt-12 sm:px-6 md:pt-16 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:pb-28 lg:pt-24">
        <div className="animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-sm font-semibold text-white">
            <MapPin className="h-4 w-4 text-red-400" aria-hidden="true" />
            Built for LAUTECH students in Ogbomoso
          </span>

          <h1 className="mt-6 text-4xl font-extrabold leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl">
            Everything You Need Around Campus, <span className="text-red-400">Delivered.</span>
          </h1>

          <p className="mt-4 text-sm font-bold uppercase tracking-[0.2em] text-red-300">
            Your Campus. Your Needs. Delivered.
          </p>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-navy-100 sm:text-lg">
            Dreypella Campus is a student convenience and delivery service powered by Dreypella. We
            shop, print, run collection errands and deliver for you, so you are never stuck on the
            move.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button onClick={onOrder} className="px-8 py-4 text-base tracking-wide">
              ORDER NOW
            </Button>
            <a href="#services" className={buttonStyles('ghost')}>
              Explore services
              <ArrowDownRight className="h-5 w-5" aria-hidden="true" />
            </a>
          </div>

          <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:max-w-xl">
            {SERVICE_LIST.map((service) => (
              <li
                key={service.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 transition hover:border-white/25 hover:bg-white/10"
              >
                <service.icon className="h-5 w-5 text-red-400" aria-hidden="true" />
                <span className="text-xs font-bold leading-tight tracking-wide text-white">
                  {service.title}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="relative animate-fade-up [animation-delay:150ms]">
          <div className="overflow-hidden rounded-[2rem] border border-white/10 shadow-2xl shadow-black/30">
            <img
              src={HERO_IMAGE}
              alt="Students walking across a university campus carrying books"
              width={940}
              height={650}
              className="aspect-[4/3] w-full object-cover"
            />
          </div>

          <div className="absolute -bottom-6 left-4 flex max-w-[16rem] items-center gap-4 rounded-2xl bg-white p-4 shadow-xl shadow-navy-900/20 animate-float sm:left-8 sm:max-w-xs">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500 text-white">
              <Truck className="h-6 w-6" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-red-500">Powered by</p>
              <p className="text-base font-extrabold text-navy-900">Dreypella</p>
              <p className="text-sm text-navy-700">Campus delivery to hostels and approved spots</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
