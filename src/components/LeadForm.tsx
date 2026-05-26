import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ServiceType, ProjectBudget, ProjectTimeline, LeadRequest, StoredLead, AIProjectAnalysis } from "../types";
import { BUDGET_OPTIONS, TIMELINE_OPTIONS } from "../data";
import { 
  Building2, Briefcase, FileText, Phone, Mail, User, 
  Sparkles, CheckCircle2, ChevronRight, ChevronLeft, Loader2, 
  Terminal, ShieldCheck, ArrowRight, Brain, Clock, HelpCircle, Layers, Check,
  MessageSquare
} from "lucide-react";
import { doc, setDoc } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

interface LeadFormProps {
  selectedServiceFromGrid: ServiceType | null;
  onClearSelectedService: () => void;
  isEmbed?: boolean;
}

export default function LeadForm({ selectedServiceFromGrid, onClearSelectedService, isEmbed = true }: LeadFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loadingAI, setLoadingAI] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [leadHistory, setLeadHistory] = useState<StoredLead[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  // Form State
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  const handlePhoneChange = (val: string) => {
    // Remove all non-numeric characters
    const digits = val.replace(/\D/g, "");
    const truncated = digits.slice(0, 11);
    
    let formatted = "";
    if (truncated.length > 0) {
      if (truncated.length <= 2) {
        formatted = `(${truncated}`;
      } else if (truncated.length <= 6) {
        formatted = `(${truncated.slice(0, 2)})${truncated.slice(2)}`;
      } else if (truncated.length <= 10) {
        // Ex: (11) 9123-4567
        formatted = `(${truncated.slice(0, 2)})${truncated.slice(2, 6)}-${truncated.slice(6)}`;
      } else {
        // Ex: (11) 91234-5678
        formatted = `(${truncated.slice(0, 2)})${truncated.slice(2, 7)}-${truncated.slice(7)}`;
      }
    }
    setPhone(formatted);
  };
  const [selectedServices, setSelectedServices] = useState<ServiceType[]>([]);
  const [selectedBudget, setSelectedBudget] = useState<ProjectBudget>(ProjectBudget.MEDIUM);
  const [selectedTimeline, setSelectedTimeline] = useState<ProjectTimeline>(ProjectTimeline.STANDARD);
  const [description, setDescription] = useState("");
  const [aiAnalysis, setAiAnalysis] = useState<AIProjectAnalysis | null>(null);
  const [submittedLead, setSubmittedLead] = useState<LeadRequest | null>(null);

  // Load Lead history on client mount
  useEffect(() => {
    try {
      const cached = localStorage.getItem("exodo_leads");
      if (cached) {
        try {
          setLeadHistory(JSON.parse(cached));
        } catch (e) {
          console.error("Erro ao processar JSON de leads locais:", e);
        }
      }
    } catch (e) {
      console.warn("localStorage is blocked or unavailable in this environment:", e);
    }
  }, []);

  // Handle external service selection from services grid call
  useEffect(() => {
    if (selectedServiceFromGrid) {
      if (!selectedServices.includes(selectedServiceFromGrid)) {
        setSelectedServices([selectedServiceFromGrid]);
      }
      setCurrentStep(2); // Jump to modules step
      // Scroll to leads section
      const formSection = document.getElementById("leads");
      if (formSection) {
        formSection.scrollIntoView({ behavior: "smooth" });
      }
      onClearSelectedService();
    }
  }, [selectedServiceFromGrid]);

  const toggleService = (service: ServiceType) => {
    if (selectedServices.includes(service)) {
      setSelectedServices(selectedServices.filter(s => s !== service));
    } else {
      setSelectedServices([...selectedServices, service]);
    }
  };

  // Perform Gemini Project Analysis on the server
  const analyzeProjectWithAI = async () => {
    if (!description || description.trim().length < 15) {
      setAiError("Por favor, descreva seu projeto com pelo menos 15 caracteres para obtermos uma análise qualificada.");
      return;
    }
    setAiError(null);
    setLoadingAI(true);
    setAiAnalysis(null);

    try {
      const response = await fetch("/api/analyze-project", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          services: selectedServices,
          budget: selectedBudget,
          timeline: selectedTimeline
        })
      });

      if (!response.ok) {
        throw new Error("Erro na comunicação com o servidor.");
      }

      const data = await response.json();
      setAiAnalysis(data);
    } catch (err: any) {
      console.error(err);
      setAiError("Não conseguimos analisar seu projeto no momento. Prossiga para o contato.");
    } finally {
      setLoadingAI(false);
    }
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      if (!companyName.trim()) {
        alert("Por favor, preencha o nome da sua empresa.");
        return;
      }
    } else if (currentStep === 2) {
      if (selectedServices.length === 0) {
        alert("Por favor, selecione ao menos um módulo de serviço.");
        return;
      }
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Final submit handler
  const handleSubmitLead = async (e: FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !email.trim() || !phone.trim()) {
      alert("Por favor, preencha todos os campos de contato para enviarmos seu orçamento.");
      return;
    }

    setSubmitting(true);
    const newLead: LeadRequest = {
      companyName,
      contactName,
      email,
      phone,
      services: selectedServices,
      budget: selectedBudget,
      timeline: selectedTimeline,
      description,
      aiAnalysis: aiAnalysis || undefined
    };

    let savedLead: StoredLead = {
      ...newLead,
      id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: new Date().toISOString(),
      status: "novo"
    };

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newLead)
      });
      if (response.ok) {
        const backendLead = await response.json();
        if (backendLead && backendLead.id) {
          savedLead = backendLead;
        }
      } else {
        console.warn("Could not save to backend database. Saving locally with static metadata.");
      }
    } catch (error) {
      console.warn("Network error saving lead to server, falling back to local storage:", error);
    }

    // Save directly to Firestore Database
    try {
      // Stripping all undefined properties to prevent firestore write errors
      const sanitizedLead = JSON.parse(JSON.stringify(savedLead));
      const leadDocRef = doc(db, "leads", savedLead.id);
      await setDoc(leadDocRef, sanitizedLead);
      console.log("Salvo com sucesso no Firestore.");
    } catch (error) {
      console.warn("Could not save to Firestore directly. Logging info.", error);
      // Ensure we conform to error specs but don't break the UI experience completely
      try {
        handleFirestoreError(error, OperationType.WRITE, `leads/${savedLead.id}`);
      } catch (fe) {
        console.error("Firestore exception triggered:", fe);
      }
    }

    const updatedHistory = [savedLead, ...leadHistory];
    setLeadHistory(updatedHistory);
    try {
      localStorage.setItem("exodo_leads", JSON.stringify(updatedHistory));
    } catch (e) {
      console.warn("localStorage item write blocked or failed:", e);
    }

    setSubmittedLead(savedLead);
    setSubmitting(false);
  };

  // Reset form to write another budget request
  const resetForm = () => {
    setCompanyName("");
    setContactName("");
    setEmail("");
    setPhone("");
    setSelectedServices([]);
    setSelectedBudget(ProjectBudget.MEDIUM);
    setSelectedTimeline(ProjectTimeline.STANDARD);
    setDescription("");
    setAiAnalysis(null);
    setSubmittedLead(null);
    setCurrentStep(1);
  };

  const formCard = (
    <div className="w-full bg-[#0d0d10] border border-white/5 rounded-[32px] p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00AEEF] via-neon-purple to-[#00AEEF]" />

      {!submittedLead ? (
                <div>
                  {/* Step Indicators */}
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/5 text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] ${currentStep >= 1 ? "bg-neon-blue text-black font-semibold" : "bg-white/5"}`}>1</span>
                      <span className={`hidden sm:inline ${currentStep === 1 ? "text-white font-semibold" : "text-gray-500"}`}>Empresa</span>
                    </div>
                    <div className="h-px bg-white/5 flex-1 mx-3" />
                    <div className="flex items-center gap-1">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] ${currentStep >= 2 ? "bg-neon-blue text-black font-semibold" : "bg-white/5"}`}>2</span>
                      <span className={`hidden sm:inline ${currentStep === 2 ? "text-white font-semibold" : "text-gray-500"}`}>Serviços</span>
                    </div>
                    <div className="h-px bg-white/5 flex-1 mx-3" />
                    <div className="flex items-center gap-1">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] ${currentStep >= 3 ? "bg-neon-blue text-black font-semibold" : "bg-white/5"}`}>3</span>
                      <span className={`hidden sm:inline ${currentStep === 3 ? "text-white font-semibold" : "text-gray-500"}`}>Escopo AI</span>
                    </div>
                    <div className="h-px bg-white/5 flex-1 mx-3" />
                    <div className="flex items-center gap-1">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-[11px] ${currentStep === 4 ? "bg-neon-blue text-black font-semibold" : "bg-white/5"}`}>4</span>
                      <span className={`hidden sm:inline ${currentStep === 4 ? "text-white font-semibold" : "text-gray-500"}`}>Contato</span>
                    </div>
                  </div>

                  {/* Form Step Content Box */}
                  <div className="min-h-[300px]">
                    <AnimatePresence mode="wait">
                      {/* STEP 1: Enterprise Profile */}
                      {currentStep === 1 && (
                        <motion.div
                          key="step-1"
                          initial={{ opacity: 0, x: 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          className="space-y-6 text-left"
                        >
                          <div>
                            <h3 className="font-display text-lg font-bold text-white">Sobre sua Empresa</h3>
                            <p className="text-xs text-gray-500">Comece fornecendo as informações básicas da organização.</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Nome Comercial da Empresa</label>
                              <div className="relative">
                                <Building2 className="absolute top-3 left-3 h-4 w-4 text-gray-600" />
                                <input
                                  type="text"
                                  value={companyName}
                                  onChange={(e) => setCompanyName(e.target.value)}
                                  placeholder="Ex: Acme Corp S/A"
                                  className="w-full rounded-xl border border-white/5 bg-neutral-950 px-10 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Orçamento Pretendido</label>
                                <select
                                  value={selectedBudget}
                                  onChange={(e) => setSelectedBudget(e.target.value as ProjectBudget)}
                                  className="w-full rounded-xl border border-white/5 bg-neutral-950 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-blue"
                                >
                                  {BUDGET_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Prazo de Entrega</label>
                                <select
                                  value={selectedTimeline}
                                  onChange={(e) => setSelectedTimeline(e.target.value as ProjectTimeline)}
                                  className="w-full rounded-xl border border-white/5 bg-neutral-950 px-3.5 py-3 text-sm text-white outline-none focus:border-neon-blue"
                                >
                                  {TIMELINE_OPTIONS.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 2: Service modules selection */}
                      {currentStep === 2 && (
                        <motion.div
                          key="step-2"
                          initial={{ opacity: 0, x: 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          className="space-y-6 text-left"
                        >
                          <div>
                            <h3 className="font-display text-lg font-bold text-white">Quais serviços sua empresa precisa?</h3>
                            <p className="text-xs text-gray-500">Selecione todos os blocos construtivos necessários para o escopo.</p>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {Object.values(ServiceType).map((service) => {
                              const isSelected = selectedServices.includes(service);
                              return (
                                <button
                                  type="button"
                                  key={service}
                                  onClick={() => toggleService(service)}
                                  className={`flex items-center justify-between rounded-xl border p-3.5 text-left transition-all cursor-pointer ${
                                    isSelected 
                                      ? "border-neon-blue bg-neon-blue/[0.04] text-white" 
                                      : "border-white/5 bg-neutral-950 hover:bg-white/[0.02] text-gray-400"
                                  }`}
                                >
                                  <span className="text-xs font-semibold">{service}</span>
                                  <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border text-black ${
                                    isSelected ? "bg-neon-blue border-neon-blue" : "border-white/15"
                                  }`}>
                                    {isSelected && <Check className="h-3 w-3 text-black stroke-[3]" />}
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 3: Project Description and AI calculations */}
                      {currentStep === 3 && (
                        <motion.div
                          key="step-3"
                          initial={{ opacity: 0, x: 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          className="space-y-6 text-left"
                        >
                          <div>
                            <h3 className="font-display text-lg font-bold text-white flex items-center gap-2">
                              <span>Exodo AI Architect</span>
                              <Sparkles className="h-4 w-4 text-neon-blue" />
                            </h3>
                            <p className="text-xs text-gray-500">Descreva seu projeto para gerarmos um plano técnico básico instantâneo.</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Descreva os objetivos principais do projeto</label>
                              <div className="relative">
                                <FileText className="absolute top-3 left-3 h-4 w-4 text-gray-600" />
                                <textarea
                                  value={description}
                                  onChange={(e) => setDescription(e.target.value)}
                                  rows={4}
                                  placeholder="Escreva brevemente o que o sistema deve fazer (Ex: 'Preciso de um sistema SaaS de lavanderia onde os usuários possam agendar entregas via dashboard, gerando relatórios de faturamento mensal...')"
                                  className="w-full rounded-xl border border-white/5 bg-neutral-950 px-10 py-3 text-xs text-white placeholder-gray-600 outline-none transition-all focus:border-neon-blue focus:ring-1 focus:ring-neon-blue resize-none"
                                />
                              </div>
                            </div>

                            {/* Trigger AI Action */}
                            <div className="flex flex-wrap gap-4 items-center justify-between">
                              <span className="text-[10px] text-gray-500 font-mono">Pressione para rodar inferência de arquitetura</span>
                              <button
                                type="button"
                                onClick={analyzeProjectWithAI}
                                disabled={loadingAI || !description.trim() || description.length < 15}
                                className="inline-flex h-9 items-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:border-neon-blue hover:bg-neon-blue/10 px-4 text-xs font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                              >
                                {loadingAI ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin text-neon-blue" />
                                    <span>Processando...</span>
                                  </>
                                ) : (
                                  <>
                                    <Brain className="h-3.5 w-3.5 text-neon-blue" />
                                    <span>Analisar por IA</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {aiError && (
                              <p className="text-[11px] text-yellow-503 text-yellow-500 font-medium">{aiError}</p>
                            )}

                            {/* Scanning Loader simulation */}
                            {loadingAI && (
                              <div className="rounded-xl border border-white/5 bg-neutral-950/40 p-6 flex flex-col items-center justify-center relative overflow-hidden h-36">
                                <div className="absolute inset-x-0 h-0.5 bg-neon-blue/40 top-0 left-0 animate-bounce" />
                                <Terminal className="h-6 w-6 text-neon-blue animate-pulse mb-3" />
                                <span className="text-[10px] font-mono tracking-widest text-neon-blue uppercase animate-pulse">Compilando escopo na nuvem...</span>
                              </div>
                            )}

                            {/* AI analysis result layout */}
                            {aiAnalysis && (
                              <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-xl border border-neon-blue/20 bg-neutral-950 p-5 space-y-4 glow-box-blue"
                              >
                                <div className="flex items-center justify-between pb-3 border-b border-white/5">
                                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#00AEEF]">Ecopo Mapeado</span>
                                  
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-gray-500 font-mono">Complexidade:</span>
                                    <span className={`rounded-full px-2 py-0.5 font-bold ${
                                      aiAnalysis.complexity === "Alta" || aiAnalysis.complexity === "Crítica"
                                        ? "bg-red-500/10 text-red-400" : aiAnalysis.complexity === "Média"
                                        ? "bg-yellow-500/10 text-yellow-400" : "bg-green-500/10 text-green-400"
                                    }`}>{aiAnalysis.complexity}</span>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  <div>
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block mb-1.5">Stack Sugerida</span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {aiAnalysis.techStack.map((tech, tIdx) => (
                                        <span key={tIdx} className="rounded-md border border-white/5 bg-white/[0.02] px-2 py-0.5 font-mono text-[9px] text-gray-300">{tech}</span>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block mb-1">Prazo Minimo MVP</span>
                                    <div className="flex items-baseline gap-1.5 mt-1.5">
                                      <span className="font-display text-lg font-bold text-white">{aiAnalysis.estimatedWeeks} semanas</span>
                                      <span className="text-[9px] text-gray-500">Estimados</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="border-t border-white/5 pt-3">
                                  <span className="text-[9px] uppercase font-bold tracking-wider text-gray-500 block mb-1.5">Conselho Consultivo AI</span>
                                  <ul className="space-y-1.5">
                                    {aiAnalysis.recommendations.map((rec, rIdx) => (
                                      <li key={rIdx} className="flex items-start gap-2 text-[10px] text-gray-300">
                                        <div className="h-1.5 w-1.5 rounded-full bg-neon-blue mt-1 shrink-0" />
                                        <span>{rec}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="border-t border-white/5 pt-3">
                                  <p className="text-[10px] leading-relaxed italic text-gray-400">
                                    {aiAnalysis.summary}
                                  </p>
                                </div>
                              </motion.div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {/* STEP 4: Confirm contact & Submit */}
                      {currentStep === 4 && (
                        <motion.div
                          key="step-4"
                          initial={{ opacity: 0, x: 15 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -15 }}
                          className="space-y-6 text-left"
                        >
                          <div>
                            <h3 className="font-display text-lg font-bold text-white">Consolidar Solicitação</h3>
                            <p className="text-xs text-gray-500">Insira as informações prioritárias de retorno.</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">Seu Nome Completo</label>
                              <div className="relative">
                                <User className="absolute top-3 left-3 h-4 w-4 text-gray-600" />
                                <input
                                  type="text"
                                  required
                                  value={contactName}
                                  onChange={(e) => setContactName(e.target.value)}
                                  placeholder="Ex: Roberto Silveira"
                                  className="w-full rounded-xl border border-white/5 bg-neutral-950 px-10 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                                />
                              </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">E-mail Corporativo</label>
                                <div className="relative">
                                  <Mail className="absolute top-3 left-3 h-4 w-4 text-gray-600" />
                                  <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Ex: roberto@empresa.com.br"
                                    className="w-full rounded-xl border border-white/5 bg-neutral-950 px-10 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-2">WhatsApp de Contato</label>
                                <div className="relative">
                                  <Phone className="absolute top-3 left-3 h-4 w-4 text-gray-600" />
                                  <input
                                    type="tel"
                                    required
                                    value={phone}
                                    onChange={(e) => handlePhoneChange(e.target.value)}
                                    placeholder="Ex: (11) 91234-5678"
                                    className="w-full rounded-xl border border-white/5 bg-neutral-950 px-10 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Flow buttons */}
                  <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      disabled={currentStep === 1}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/5 hover:border-white/10 px-4 text-xs font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      <span>Voltar</span>
                    </button>

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNextStep}
                        className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-neon-blue hover:bg-[#00c2ff] px-5 text-xs font-bold text-black transition-all cursor-pointer"
                      >
                        <span>Próximo</span>
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSubmitLead}
                        disabled={submitting || !contactName.trim() || !email.trim() || !phone.trim()}
                        className="group inline-flex h-10 items-center justify-center gap-1.5 rounded-xl bg-neon-blue hover:bg-[#00c2ff] hover:shadow-[0_0_15px_rgba(0,174,239,0.35)] px-6 text-xs font-bold text-black transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            <span>Enviando...</span>
                          </>
                        ) : (
                          <>
                            <span>Enviar Solicitação</span>
                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                /* Proposal lock confirmation layout */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6 py-6"
                >
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-green-500/20 bg-green-500/5 text-green-500 glow-box-blue mb-4">
                    <ShieldCheck className="h-7 w-7" />
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-extrabold text-white">Solicitação Recebida!</h3>
                    <p className="mt-2 text-xs text-gray-400 max-w-sm mx-auto">Sua proposta robusta foi processada e enviada com sucesso para nossa banca de engenharia sob o ID #EXD-{Math.floor(Math.random() * 90000) + 10000}.</p>
                  </div>

                  <div className="rounded-2xl border border-white/5 bg-[#0a0a0d] p-5 text-left max-w-md mx-auto space-y-4">
                    <div className="border-b border-white/5 pb-2.5 flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-widest text-[#00AEEF] inline-flex items-center gap-1">
                        <Terminal className="h-3.5 w-3.5" />
                        <span>Ficha Técnica do Lead</span>
                      </span>
                      <span className="rounded-full bg-green-500/10 px-2 py-0.5 font-mono text-[9px] text-green-400">AGENDADO</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block">Empresa</span>
                        <span className="font-semibold text-white truncate block">{submittedLead.companyName}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-gray-500 uppercase block">Proponente</span>
                        <span className="font-semibold text-white truncate block">{submittedLead.contactName}</span>
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-500 uppercase block mb-1">Módulos Construtivos</span>
                      <div className="flex flex-wrap gap-1">
                        {submittedLead.services.map((ser, index) => (
                          <span key={index} className="rounded bg-white/5 px-2 py-0.5 text-[9px] text-gray-300">{ser}</span>
                        ))}
                      </div>
                    </div>

                    {submittedLead.aiAnalysis && (
                      <div className="border-t border-white/5 pt-3">
                        <span className="text-[10px] uppercase tracking-wider text-[#bd5cf1] block font-semibold mb-1">Arquitetura Recomendada IA</span>
                        <p className="text-[10px] text-gray-400 leading-normal mb-2">{submittedLead.aiAnalysis.summary}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-gray-500">Arquitetura:</span>
                          <span className="rounded border border-neon-blue/10 bg-neon-blue/[0.02] px-1.5 py-0.5 font-mono text-[8px] text-neon-blue">{submittedLead.aiAnalysis.techStack.slice(0, 3).join(", ")}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="text-[10px] text-gray-500">Nossos engenheiros seniores entrarão em contato no email <b>{submittedLead.email}</b> ou celular.</p>

                  <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        const d = submittedLead;
                        let text = `*PORTAL ÉXODO - SESSÃO ENVIADA PARA ORÇAMENTO*\n\n`;
                        text += `🏢 *Empresa:* ${d.companyName}\n`;
                        text += `👤 *Contato:* ${d.contactName}\n`;
                        text += `📧 *E-mail:* ${d.email}\n`;
                        text += `📞 *WhatsApp:* ${d.phone}\n\n`;
                        text += `🛠️ *Módulos Requeridos:* ${d.services.join(", ")}\n`;
                        text += `💰 *Orquamento Alvo:* ${d.budget}\n`;
                        text += `⏱️ *Lançamento Alvo:* ${d.timeline}\n`;
                        text += `📝 *Resumo do Escopo:* ${d.description}\n`;
                        if (d.aiAnalysis) {
                          text += `\n🤖 *Resultado do Exodo AI Architect:*\n`;
                          text += `• Complexidade: ${d.aiAnalysis.complexity}\n`;
                          text += `• Stack Desenho: ${d.aiAnalysis.techStack.join(", ")}\n`;
                          text += `• MVP Estimado: ${d.aiAnalysis.estimatedWeeks} semanas\n`;
                          text += `💡 *Análise:* ${d.aiAnalysis.summary}\n`;
                        }
                        const encodedText = encodeURIComponent(text);
                        window.open(`https://api.whatsapp.com/send?text=${encodedText}`, "_blank");
                      }}
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] px-5 text-xs font-bold text-black transition-all cursor-pointer w-full sm:w-auto font-sans"
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span>Enviar Escopo por WhatsApp</span>
                    </button>

                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex h-10 items-center justify-center gap-1.5 rounded-xl border border-white/5 bg-white/5 hover:bg-white/10 px-5 text-xs font-semibold text-white transition-all cursor-pointer w-full sm:w-auto"
                    >
                      <span>Simular Outro Escopo</span>
                    </button>
                  </div>
                </motion.div>
              )}
    </div>
  );

  if (isEmbed) {
    return formCard;
  }

  return (
    <section id="leads" className="relative bg-[#050505] py-24 border-t border-white/5">
      <div className="absolute top-[20%] right-1/4 h-[250px] w-[250px] rounded-full bg-[#00AEEF]/5 blur-[90px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
          
          {/* Info Side Column */}
          <div className="lg:col-span-5 text-left">
            <h2 className="font-display text-base font-semibold tracking-wider text-[#00AEEF] uppercase">Consultoria de Escopo</h2>
            <p className="mt-4 font-display text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Calcule seu projeto instantaneamente
            </p>
            <p className="mt-4 text-sm text-gray-400 leading-relaxed">
              Desenvolvemos um orçamentador interativo auxiliado por Inteligência Artificial. Descreva brevemente sua necessidade e veja quais tecnologias indicamos para sua escala e complexidade de mercado.
            </p>
          </div>

          {/* Form Step Column */}
          <div className="lg:col-span-7">
            {formCard}
          </div>

        </div>
      </div>
    </section>
  );
}
