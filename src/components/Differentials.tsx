import { motion } from "motion/react";
import { DIFFERENTIALS_LIST } from "../data";

export default function Differentials() {
  return (
    <section id="differentials" className="relative bg-[#050505] py-24 border-t border-b border-white/5">
      {/* Background ambient circular glow */}
      <div className="absolute top-[30%] -right-10 h-[300px] w-[300px] rounded-full bg-neon-purple/5 blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Title row */}
        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16 items-start">
          <div className="lg:col-span-5">
            <h2 className="font-display text-base font-semibold tracking-wider text-neon-blue uppercase">Nossa Metodologia</h2>
            <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl text-left" style={{ lineHeight: 1.2 }}>
              Nenhum gargalo.<br />
              Nenhum detalhe oculto.<br />
              Apenas código impecável.
            </p>
            <p className="mt-4 text-sm text-gray-400 text-left leading-relaxed">
              Diferente de agências tradicionais que usam templates genéricos de WordPress ou terceirizam equipes de forma barata, na Exodo nós operamos como uma extensão de engenharia do seu próprio time.
            </p>
            
            <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.01] p-5">
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#00AEEF] glow-blue">Nosso Compromisso</span>
              <p className="mt-2 text-xs text-gray-300">
                Garantia estrita de conformidade em segurança de dados, contratos blindados de SLA e propriedade intelectual total transferida a você no encerramento de cada módulo.
              </p>
            </div>
          </div>

          {/* Differentiators list columns */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
            {DIFFERENTIALS_LIST.map((diff, idx) => {
              const IconComp = diff.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="rounded-2xl border border-white/5 bg-neutral-900/20 p-5 text-left flex flex-col justify-between h-56"
                >
                  <div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-neon-blue/5 border border-neon-blue/10 text-neon-blue">
                        <IconComp className="h-4.5 w-4.5" />
                      </div>
                      <h4 className="font-display text-sm font-bold text-white tracking-wide">{diff.title}</h4>
                    </div>
                    <p className="mt-3.5 text-[11px] leading-relaxed text-gray-400">
                      {diff.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-white/5 flex items-baseline justify-between">
                    <span className="text-[10px] text-gray-500 uppercase font-semibold">{diff.statLabel}</span>
                    <span className="font-display text-lg font-extrabold text-white sm:text-xl">{diff.stat}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
