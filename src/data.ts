import { ServiceType, ProjectBudget, ProjectTimeline, Testimonial, CaseStudy } from "./types";
import { Laptop, Cpu, Layers, Zap, Shield, Sparkles, Code, Terminal, Activity } from "lucide-react";

export const SERVICES_LIST = [
  {
    type: ServiceType.SITES_INSTITUCIONAIS,
    title: "Sites Institucionais",
    description: "Presença digital imponente e de altíssima performance para consolidação da sua marca no mercado.",
    icon: Laptop,
    badge: "Alta Conversão",
    features: ["Performance nota 100 no Lighthouse", "SEO avançado localizado", "Integrações de CRM completas"]
  },
  {
    type: ServiceType.SISTEMAS_PERSONALIZADOS,
    title: "Sistemas Customizados",
    description: "Sistemas complexos sob medida construídos com altíssima segurança e preparados para escala infinita.",
    icon: Cpu,
    badge: "Missão Crítica",
    features: ["Arquitetura serverless modular", "APIs robustas documentadas", "Segurança máxima contra invasões"]
  },
  {
    type: ServiceType.PLATAFORMAS_WEB,
    title: "Plataformas Web / SaaS",
    description: "Engenharia de produtos digitais robustos (SaaS) com assinaturas, cobrança integrada e analytics.",
    icon: Layers,
    badge: "Startups MVP",
    features: ["Módulos de assinatura (Stripe)", "Dashboards de controle", "Permissões de multi-inquilinato (multi-tenant)"]
  },
  {
    type: ServiceType.LANDING_PAGES,
    title: "Landing Pages de Performance",
    description: "Páginas ultra-rápidas otimizadas com técnicas de copy e neuromarketing para conversão de tráfego pago.",
    icon: Zap,
    badge: "1.2s Carregamento",
    features: ["Uso inteligente de copywriter", "Testes A/B simplificados", "Tempo de resposta quase instantâneo"]
  },
  {
    type: ServiceType.AUTOMACAO_PROCESSOS,
    title: "Automação & Integrações",
    description: "Sincronize seus sistemas legados, automatize processos repetitivos e reduza erros humanos drásticos.",
    icon: Terminal,
    badge: "Eficiência",
    features: ["Workflows autônomos", "Webhooks bidirecionais", "Monitoramento de operações e erros"]
  },
  {
    type: ServiceType.UX_UI_DESIGN,
    title: "UX/UI Design de Nível Mundial",
    description: "Interfaces envolventes orientadas ao produto que encantam usuários e geram conexões afetivas de valor.",
    icon: Sparkles,
    badge: "Design System",
    features: ["Pesquisa de campo refinada", "Figma de alta fidelidade", "Componentização estruturada"]
  }
];

export const DIFFERENTIALS_LIST = [
  {
    title: "Atendimento Ultra Ágil",
    description: "Sua empresa conectada diretamente com nossa liderança técnica via Slack/Teams. Sem intermediários, sem ruído corporativo.",
    icon: Zap,
    stat: "< 15min",
    statLabel: "Tempo médio de resposta"
  },
  {
    title: "Código de Nível de Elite",
    description: "Entregamos produtos construídos com testes automatizados, TypeScript estrito, CI/CD maduro e as melhores tecnologias mundiais.",
    icon: Code,
    stat: "100%",
    statLabel: "Cobertura em endpoints críticos"
  },
  {
    title: "Segurança de Zero Trust",
    description: "Modelos rigorosos de integridade de dados e proteção de segredos. Prontos para atender os padrões internacionais mais difíceis.",
    icon: Shield,
    stat: "AES-256",
    statLabel: "Encriptação ponta a ponta"
  },
  {
    title: "Foco Cego em Métricas",
    description: "Não criamos apenas layouts bonitos. Todo software que construímos é pensado para diminuir custos operacionais ou explodir conversão.",
    icon: Activity,
    stat: "4.2x",
    statLabel: "Média de ganho de ROI"
  }
];

export const TESTIMONIALS_DATA: Testimonial[] = [
  {
    id: "t1",
    name: "Ana Paula Mendes",
    role: "CTO / Sócia",
    company: "FinFlow Solutions",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
    text: "A Exodo entregou nossa plataforma de crédito com uma arquitetura impecável na nuvem. A economia de latência da API caiu mais de 80%, e nossa equipe conseguiu validar conformidade bancária em tempo recorde.",
    metric: "-84% Latência",
    metricLabel: "Tempo médio de resposta"
  },
  {
    id: "t2",
    name: "Dr. Gustavo Aguiar",
    role: "Fundador & CEO",
    company: "HealthSync Tech",
    avatar: "https://images.unsplash.com/photo-1560250097-0b93528c311a?q=80&w=200&auto=format&fit=crop",
    text: "Parceria extraordinária. Construímos o MVP do nosso software de prontuário eletrônico com eles e conseguimos captar US$ 3.2M na rodada Seed logo depois de demonstrar a estabilidade do sistema aos fundos de VC.",
    metric: "US$ 3.2M",
    metricLabel: "Investimento escalado pós MVP"
  },
  {
    id: "t3",
    name: "Marcus Vinicius",
    role: "VP de Operações",
    company: "Logix Logistic",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop",
    text: "O sistema de roteirização automatizada desenvolvido pela Exodo se tornou a espinha dorsal de nossa operação logística nacional. Reduzimos erros de expedição a patamares praticamente nulos.",
    metric: "1.2M",
    metricLabel: "Pedidos automatizados/mês"
  }
];

export const CASE_STUDIES: CaseStudy[] = [
  {
    id: "c1",
    title: "Nexus SaaS Platform",
    category: "Desenvolvimento de Sistemas / SaaS",
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop",
    description: "Desenvolvimento completo de uma plataforma avançada de gestão de frotas e automação integrada.",
    metrics: ["API Response < 80ms", "99.99% Uptime anual", "UX premiada no CSS Design"]
  },
  {
    id: "c2",
    title: "VorteX Institutional Brand",
    category: "Sites Institucionais / Landing Pages",
    image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop",
    description: "Rebranding digital e construção de ecossistema institucional para fintech global milionária.",
    metrics: ["100 Score Lighthouse", "+240% Conversão", "Segurança nível Bancário"]
  }
];

export const BUDGET_OPTIONS = [
  ProjectBudget.LOW,
  ProjectBudget.MEDIUM,
  ProjectBudget.HIGH,
  ProjectBudget.ENTERPRISE
];

export const TIMELINE_OPTIONS = [
  ProjectTimeline.URGENT,
  ProjectTimeline.STANDARD,
  ProjectTimeline.FLEXIBLE
];

export const TECH_STACK_LOGOS = [
  { name: "React", icon: "⚛️" },
  { name: "TypeScript", icon: "📘" },
  { name: "TailwindCSS", icon: "🎨" },
  { name: "Vite", icon: "⚡" },
  { name: "Node.js", icon: "🟢" },
  { name: "Express", icon: "🚂" },
  { name: "Framer Motion", icon: "🎬" },
  { name: "PostgreSQL", icon: "🐘" }
];
