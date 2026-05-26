import { motion } from "motion/react";

interface HeroProps {
  onOpenForm: () => void;
}

export default function Hero({ onOpenForm }: HeroProps) {
  return (
    <div className="flex flex-col justify-center text-left">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="inline-flex max-w-max items-center gap-2 rounded-full border border-neon-blue/30 bg-[#00AEEF]/10 px-3 py-1 text-xs text-[#00AEEF] font-bold uppercase tracking-widest"
      >
        <span className="w-2 h-2 rounded-full bg-[#00AEEF] animate-pulse"></span>
        <span>Tech Startup de Elite</span>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="mt-6 font-display text-5xl font-extrabold tracking-tighter text-white sm:text-7xl leading-[1.05]"
        style={{ lineHeight: 1.05 }}
      >
        Arquitetura de <br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00AEEF] to-white">
          Software Premium.
        </span>
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.25 }}
        className="mt-6 text-base leading-relaxed text-white/55 sm:text-lg max-w-xl"
      >
        Convertemos visões complexas em ecossistemas digitais de alta performance. Sistemas, plataformas e automações que escalam seu negócio de forma cirúrgica.
      </motion.p>

      {/* CTAs */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35 }}
        className="mt-10 flex flex-wrap gap-4 items-center"
      >
        <button
          onClick={onOpenForm}
          className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#00AEEF] hover:bg-[#0091c7] px-6 text-sm font-bold text-black transition-all cursor-pointer shadow-[0_0_20px_rgba(0,174,239,0.25)]"
          id="hero-primary-cta"
        >
          <span>Instruir Orçamento</span>
          <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M9 5l7 7-7 7"></path></svg>
        </button>

        <a
          href="#services"
          className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 px-6 text-sm font-semibold text-white transition-all cursor-pointer"
        >
          <span>Ver Módulos</span>
        </a>
      </motion.div>

      {/* Quick Metrics */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.55 }}
        className="mt-12 grid grid-cols-3 gap-6 border-t border-white/5 pt-8 max-w-md"
      >
        <div>
          <span className="block font-display text-2xl font-bold text-white">4.9/5</span>
          <span className="text-xs text-gray-400">Satisfação</span>
        </div>
        <div>
          <span className="block font-display text-2xl font-bold text-white">&lt; 12 dias</span>
          <span className="text-xs text-gray-400">MVP médio</span>
        </div>
        <div>
          <span className="block font-display text-2xl font-bold text-white">100%</span>
          <span className="text-xs text-gray-400">Cód. Autoral</span>
        </div>
      </motion.div>
    </div>
  );
}
