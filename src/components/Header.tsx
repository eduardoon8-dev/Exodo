import { motion } from "motion/react";
import { ArrowRight, Shield } from "lucide-react";

interface HeaderProps {
  onOpenForm: () => void;
  onOpenAdmin: () => void;
  isAdminActive?: boolean;
}

export default function Header({ onOpenForm, onOpenAdmin, isAdminActive = false }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#050505]/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl h-18 items-center justify-between px-6 lg:px-8">
        {/* Logo */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-2.5 cursor-pointer"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          id="exodo-logo-nav"
        >
          <div className="flex h-10 w-10 overflow-hidden items-center justify-center rounded-xl border border-neon-blue/20 bg-neon-blue/5 text-neon-blue glow-box-blue">
            <img src="/logo.png" alt="Exodo" className="h-full w-full object-cover p-1" referrerPolicy="no-referrer" />
          </div>
          <span className="font-display text-2xl font-bold tracking-tight text-white flex items-center">
            Exodo<span className="text-neon-blue">.</span>
          </span>
        </motion.div>

        {/* Navigation - Premium & Minimalist */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
          {!isAdminActive ? (
            <>
              <a href="#services" className="transition-colors hover:text-neon-blue hover:glow-blue">Módulos</a>
              <a href="#differentials" className="transition-colors hover:text-neon-blue hover:glow-blue">Metodologia</a>
              <a href="#leads" className="transition-colors hover:text-neon-blue hover:glow-blue">Análise Escopo</a>
            </>
          ) : (
            <span className="text-xs font-mono text-[#00AEEF] uppercase tracking-wider font-bold">Modo de Gerenciamento do Projeto Ativado</span>
          )}
        </nav>

        {/* Actions Button */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <button
            onClick={onOpenAdmin}
            className={`group text-[11px] font-bold uppercase tracking-wider px-3 py-2 rounded-xl border flex items-center gap-1 cursor-pointer transition-all duration-300 ${isAdminActive ? 'bg-[#00AEEF]/10 border-[#00AEEF] text-[#00AEEF]' : 'bg-white/5 border-white/5 text-gray-400 hover:text-white hover:border-white/10 hover:bg-white/[0.08]'}`}
          >
            <Shield className="h-3.5 w-3.5" />
            <span>{isAdminActive ? "Painel Ativo" : "Painel do Time"}</span>
          </button>

          {!isAdminActive && (
            <button
              onClick={onOpenForm}
              className="group relative inline-flex items-center gap-1.5 rounded-full border border-[#00AEEF] text-[#00AEEF] bg-[#00AEEF]/5 px-5 py-2 text-xs font-semibold tracking-wider uppercase transition-all duration-300 hover:bg-[#00AEEF]/20 hover:shadow-[0_0_15px_rgba(0,174,239,0.2)] cursor-pointer"
              id="nav-request-cta"
            >
              <span>Orçamento</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
          )}
        </motion.div>
      </div>
    </header>
  );
}
