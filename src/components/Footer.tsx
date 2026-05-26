import { motion } from "motion/react";
import { Github, Linkedin, Twitter, Network, ShieldAlert } from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-[#050505] border-t border-white/5 pt-16 pb-12 overflow-hidden">
      <div className="absolute -bottom-20 left-1/2 -translate-x-[50%] h-[200px] w-[500px] bg-neon-blue/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12">
          
          {/* Logo brand module */}
          <div className="md:col-span-4 text-left">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 overflow-hidden items-center justify-center rounded-xl border border-neon-blue/20 bg-neon-blue/5 text-neon-blue">
                <img src="/logo.png" alt="Exodo" className="h-full w-full object-cover p-0.5" referrerPolicy="no-referrer" />
              </div>
              <span className="font-display text-xl font-bold tracking-tight text-white">
                Exodo<span className="text-neon-blue">.</span>
              </span>
            </div>
            
            <p className="mt-4 text-xs leading-relaxed text-gray-500 max-w-xs">
              Módulos de software de altíssima confiabilidade e velocidade de transmissão. Do escopo guiado por IA ao deploy contínuo em servidores globais.
            </p>

            <div className="mt-6 flex items-center gap-3">
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.01] text-gray-400 hover:text-white hover:border-white/10 transition-colors">
                <Linkedin className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.01] text-gray-400 hover:text-white hover:border-white/10 transition-colors">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="#" className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/5 bg-white/[0.01] text-gray-400 hover:text-white hover:border-white/10 transition-colors">
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick links columns */}
          <div className="md:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-8 text-left">
            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Plataforma</span>
              <ul className="mt-4 space-y-2.5 text-xs text-gray-500">
                <li><a href="#services" className="hover:text-white transition-colors">Nossos Módulos</a></li>
                <li><a href="#differentials" className="hover:text-white transition-colors">Infraestrutura</a></li>
                <li><a href="#leads" className="hover:text-white transition-colors">Consultor de Escopo</a></li>
              </ul>
            </div>

            <div>
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Tecnologias</span>
              <ul className="mt-4 space-y-2.5 text-xs text-gray-500">
                <li className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">⚛️ React Server SSR</li>
                <li className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">📘 TypeScript Direct</li>
                <li className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">🎨 Tailwind CSS v4</li>
                <li className="flex items-center gap-1.5 font-mono text-[10px] text-gray-400">🐘 Prisma & postgres</li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Segurança & Legal</span>
              <ul className="mt-4 space-y-2.5 text-xs text-gray-500">
                <li className="flex items-center gap-1">
                  <ShieldAlert className="h-3.5 w-3.5 text-green-500 shrink-0" />
                  <span>LGPD Total Compliant</span>
                </li>
                <li><span className="text-[10px] text-gray-500 italic block">Garantia total de transparência de propriedade intelectual em contrato.</span></li>
              </ul>
            </div>
          </div>

        </div>

        {/* Footer legal bar */}
        <div className="mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-600">
          <span>&copy; {currentYear} Exodo Inc. Todos os direitos reservados. Desenvolvimento Premium de Sistemas de Missão Crítica.</span>
          <div className="flex items-center gap-6 font-mono text-[10px] text-gray-400">
            <span className="flex items-center gap-1">
              <Network className="h-3.5 w-3.5 text-neon-blue" />
              <span>Status: On-Line</span>
            </span>
          </div>
        </div>

      </div>
    </footer>
  );
}
