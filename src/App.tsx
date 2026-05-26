import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import Header from "./components/Header";
import Hero from "./components/Hero";
import Services from "./components/Services";
import Differentials from "./components/Differentials";
import LeadForm from "./components/LeadForm";
import AdminDashboard from "./components/AdminDashboard";
import Footer from "./components/Footer";
import { ServiceType } from "./types";
import { TECH_STACK_LOGOS } from "./data";
import { Sparkles, ArrowRight } from "lucide-react";

export default function App() {
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [view, setView] = useState<"client" | "admin">("client");

  // Smooth scroll trigger to top Hero fold where interactive form lives
  const handleOpenGeneralForm = () => {
    if (view !== "client") {
      setView("client");
      setTimeout(() => {
        const section = document.getElementById("leads");
        if (section) {
          section.scrollIntoView({ behavior: "smooth" });
        }
      }, 100);
    } else {
      const section = document.getElementById("leads");
      if (section) {
        section.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Pre-select service module from services grid click, moving scroll back to top
  const handleSelectServiceFromGrid = (serviceType: ServiceType) => {
    setSelectedService(serviceType);
    handleOpenGeneralForm();
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 overflow-x-hidden selection:bg-neon-blue selection:text-black flex flex-col justify-between">
      {/* Translucent premium Navigation Header */}
      <Header 
        onOpenForm={handleOpenGeneralForm} 
        onOpenAdmin={() => setView(view === "client" ? "admin" : "client")} 
        isAdminActive={view === "admin"}
      />

      {/* Dynamic View switching */}
      <AnimatePresence mode="wait">
        {view === "admin" ? (
          <motion.div
            key="admin"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="flex-grow"
          >
            <AdminDashboard onBackToClientView={() => setView("client")} />
          </motion.div>
        ) : (
          <motion.div
            key="client"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex-grow"
          >
            {/* Main Core Layout with streamlined entry flow */}
            <main>
              {/* Unified Sleek Hero section presenting continuous conversion form */}
              <section className="relative overflow-hidden bg-[#050505] pt-14 pb-20 lg:pt-24 lg:pb-32">
                {/* Dynamic tech grids & ambient glowing circles */}
                <div className="absolute inset-0 bg-grid-white bg-[size:30px_30px] opacity-[0.03] pointer-events-none" />
                <div className="absolute -top-40 -right-40 h-[400px] w-[400px] rounded-full bg-[#00AEEF]/10 blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 h-[300px] w-[300px] rounded-full bg-neon-purple/10 blur-[80px] pointer-events-none" />

                <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
                  <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12">
                    
                    {/* Left Column: Copys and visual brand values */}
                    <div className="lg:col-span-5 xl:col-span-5 pt-4">
                      <Hero onOpenForm={handleOpenGeneralForm} />
                    </div>

                    {/* Right Column: Dynamic Scope Analyzer/Form (Immediate First Fold!) */}
                    <div className="lg:col-span-7 xl:col-span-7 w-full flex justify-center" id="leads">
                      <LeadForm 
                        selectedServiceFromGrid={selectedService} 
                        onClearSelectedService={() => setSelectedService(null)} 
                        isEmbed={true}
                      />
                    </div>

                  </div>

                  {/* Seamless premium Technology partner ribbon */}
                  <div className="mt-24 border-t border-b border-white/5 py-6">
                    <p className="text-center text-xs font-semibold tracking-wider text-gray-500 uppercase">Tecnologias que dominamos e construímos</p>
                    <div className="mt-6 flex flex-wrap justify-center gap-x-12 gap-y-4">
                      {TECH_STACK_LOGOS.map((stack, index) => (
                        <div key={index} className="flex items-center gap-1.5 transition-opacity hover:opacity-100 opacity-60">
                          <span className="text-base">{stack.icon}</span>
                          <span className="font-mono text-sm tracking-tight text-white font-medium">{stack.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>
              </section>

              {/* Modular Bento Services Sections */}
              <Services onSelectService={handleSelectServiceFromGrid} />

              {/* Corporate Technical Differentials */}
              <Differentials />

              {/* Final CTA section to accelerate conversion */}
              <section className="relative overflow-hidden bg-[#050505] py-24 border-t border-white/5">
                <div className="absolute inset-0 bg-grid-white bg-[size:35px_35px] opacity-[0.015] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[600px] bg-neon-blue/5 rounded-full blur-[110px] pointer-events-none" />

                <div className="mx-auto max-w-4xl px-6 lg:px-8 text-center relative z-10">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="inline-flex items-center gap-2 rounded-full border border-neon-blue/30 bg-[#00AEEF]/5 px-3 py-1 text-xs text-[#00AEEF] mb-6"
                  >
                    <Sparkles className="h-3.5 w-3.5 animate-pulse text-neon-blue" />
                    <span className="font-semibold tracking-wider uppercase">Inovação Disponível Hoje</span>
                  </motion.div>

                  <h2 className="font-display text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
                    Vamos construir software imbatível juntos?
                  </h2>
                  
                  <p className="mx-auto mt-6 max-w-xl text-sm leading-relaxed text-gray-400">
                    Não perca tempo com agências lentas ou soluções inacabadas. Solicite um orçamento em nosso consultor assistido por IA e garanta software desenhado por especialistas de elite do Vale do Silício.
                  </p>

                  <div className="mt-10 flex flex-wrap justify-center gap-4">
                    <button
                      onClick={handleOpenGeneralForm}
                      className="group relative inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-[#00AEEF] hover:bg-[#0091c7] hover:shadow-[0_0_20px_rgba(0,174,239,0.45)] px-7 text-xs font-bold tracking-wider uppercase text-black transition-all cursor-pointer"
                      id="footer-final-cta"
                    >
                      <span>Solicitar orçamento via IA</span>
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </button>
                  </div>
                </div>
              </section>
            </main>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Premium Minimal Footer */}
      <Footer />
    </div>
  );
}
