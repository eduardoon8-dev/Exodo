import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { SERVICES_LIST } from "../data";
import { Plus, Minus, ArrowUpRight } from "lucide-react";

interface ServicesProps {
  onSelectService: (serviceName: any) => void;
}

export default function Services({ onSelectService }: ServicesProps) {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <section id="services" className="relative bg-[#050505] py-24 sm:py-32">
      {/* Background neon dots */}
      <div className="absolute top-[10%] left-[50%] -translate-x-[50%] h-[300px] w-[500px] rounded-full bg-neon-blue/5 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        
        {/* Title Block */}
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-base font-semibold tracking-wider text-neon-blue uppercase">Nossos Módulos</h2>
          <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Soluções digitais de alta engenharia
          </p>
          <p className="mt-4 text-base text-gray-400">
            Cada projeto na Exodo é construído sob especificações cirúrgicas. Abolimos soluções prontas e construímos arquiteturas performáticas do zero.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="mx-auto mt-16 grid max-w-2xl grid-cols-1 gap-6 sm:mt-20 lg:mx-0 lg:max-w-none lg:grid-cols-3">
          {SERVICES_LIST.map((service, index) => {
            const IconComponent = service.icon;
            const isExpanded = expandedIndex === index;

            return (
              <motion.div
                key={index}
                layout
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border bg-neutral-900/40 p-6 transition-all duration-300 backdrop-blur-sm ${
                  isExpanded ? "border-neon-blue/40 bg-neutral-900/60 shadow-[0_0_25px_rgba(0,174,239,0.1)]" : "border-white/5 hover:border-white/10 hover:bg-neutral-900/50"
                }`}
              >
                {/* Glowing glow effect behind icons */}
                <div className="absolute -top-12 -right-12 h-24 w-24 rounded-full bg-neon-blue/5 blur-xl pointer-events-none" />
                
                <div>
                  {/* Card Header row with index and icon */}
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 text-neon-blue">
                      <IconComponent className="h-5.5 w-5.5 group-hover:scale-110 transition-transform" />
                    </div>
                    <span className="rounded-full bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-gray-400">
                      {service.badge}
                    </span>
                  </div>

                  <h3 className="mt-6 font-display text-lg font-bold text-white tracking-tight">
                    {service.title}
                  </h3>
                  
                  <p className="mt-3 text-xs leading-relaxed text-gray-400">
                    {service.description}
                  </p>

                  {/* Expandable sub-items with animation */}
                  <AnimatePresence initial={false}>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-5 border-t border-white/5 pt-4">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-neon-blue">Diferenciais Técnicos</p>
                          <ul className="mt-2.5 space-y-2">
                            {service.features.map((feature, fIdx) => (
                              <li key={fIdx} className="flex items-center gap-2 text-[11px] text-gray-300">
                                <div className="h-1 w-1 rounded-full bg-neon-blue" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Card footer CTA controls */}
                <div className="mt-8 flex items-center justify-between">
                  <button
                    onClick={() => toggleExpand(index)}
                    className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 hover:text-white transition-colors cursor-pointer"
                  >
                    {isExpanded ? (
                      <>
                        <Minus className="h-3.5 w-3.5" />
                        <span>Recolher</span>
                      </>
                    ) : (
                      <>
                        <Plus className="h-3.5 w-3.5" />
                        <span>Ver Especificações</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => onSelectService(service.type)}
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-gray-400 hover:bg-neon-blue/10 hover:text-neon-blue transition-all cursor-pointer"
                    title="Preencher no orçamento"
                  >
                    <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>

              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
