export enum ServiceType {
  SITES_INSTITUCIONAIS = "Sites Institucionais",
  SISTEMAS_PERSONALIZADOS = "Sistemas Personalizados",
  PLATAFORMAS_WEB = "Plataformas Web",
  LANDING_PAGES = "Landing Pages",
  AUTOMACAO_PROCESSOS = "Automação de Processos",
  SISTEMAS_INTERNOS = "Sistemas Internos",
  UX_UI_DESIGN = "UX/UI Design"
}

export enum ProjectBudget {
  LOW = "Até R$ 15k",
  MEDIUM = "R$ 15k - R$ 50k",
  HIGH = "R$ 50k - R$ 150k",
  ENTERPRISE = "Acima de R$ 150k"
}

export enum ProjectTimeline {
  URGENT = "Extremamente urgente (< 1 mês)",
  STANDARD = "Padrão (1 - 3 meses)",
  FLEXIBLE = "Flexível (3+ meses)"
}

export interface LeadRequest {
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  services: ServiceType[];
  budget: ProjectBudget;
  timeline: ProjectTimeline;
  description: string;
  aiAnalysis?: AIProjectAnalysis;
}

export interface StoredLead extends LeadRequest {
  id: string;
  createdAt: string;
  status: "novo" | "contatado" | "arquivado";
}

export interface TeamUser {
  username: string;
  password?: string;
  role: "admin" | "member";
  matricula: string;
  createdAt: string;
}

export interface AIProjectAnalysis {
  techStack: string[];
  complexity: "Baixa" | "Média" | "Alta" | "Crítica";
  estimatedWeeks: number;
  recommendations: string[];
  summary: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company: string;
  avatar: string;
  text: string;
  metric: string;
  metricLabel: string;
}

export interface CaseStudy {
  id: string;
  title: string;
  category: string;
  image: string;
  description: string;
  metrics: string[];
}
