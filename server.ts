import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";
import { LeadRequest } from "./src/types";

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware for parsing JSON requests
app.use(express.json());

// Initialize Google GenAI on the server
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    if (!apiKey) {
      console.warn("WARN: GEMINI_API_KEY is not defined. AI analysis will run in mock/fallback mode.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "MOCK_KEY_FALLBACK",
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// In-memory leads fallback and filesystem persistent storage setup
import fs from "fs";

interface StoredLead extends LeadRequest {
  id: string;
  createdAt: string;
  status: "novo" | "contatado" | "arquivado";
}

const LEADS_FILE = path.join(process.cwd(), "leads-db.json");

function readLeadsFromFile(): StoredLead[] {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const data = fs.readFileSync(LEADS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading leads file:", error);
  }
  return [];
}

function saveLeadsToFile(leads: StoredLead[]) {
  try {
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving leads file:", error);
  }
}

// User credentials interface and persistence setup
interface StoredUser {
  username: string;
  password: string;
  role: "admin" | "member";
  matricula: string;
  createdAt: string;
}

const USERS_FILE = path.join(process.cwd(), "users-db.json");

function readUsersFromFile(): StoredUser[] {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const data = fs.readFileSync(USERS_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading users file:", error);
  }
  // Seed with default admin user if absent
  const defaultAdmin: StoredUser = {
    username: "Adm@01",
    password: "Uexo@01",
    role: "admin",
    matricula: "01",
    createdAt: new Date().toISOString()
  };
  const initial = [defaultAdmin];
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(initial, null, 2), "utf-8");
  } catch (err) {
    console.error("Error writing initial users file:", err);
  }
  return initial;
}

function saveUsersToFile(users: StoredUser[]) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving users file:", error);
  }
}

// In-memory tracker initialized from files
let leadsStore: StoredLead[] = readLeadsFromFile();
let usersStore: StoredUser[] = readUsersFromFile();

// API endpoints for authentication and team accounts
app.post("/api/auth/login", (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Usuário e senha são obrigatórios." });
  }

  const user = usersStore.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase() && u.password === password.trim()
  );

  if (!user) {
    return res.status(401).json({ error: "Usuário ou senha incorretos." });
  }

  res.json({
    success: true,
    user: {
      username: user.username,
      role: user.role,
      matricula: user.matricula,
      createdAt: user.createdAt
    }
  });
});

app.get("/api/auth/users", (req, res) => {
  res.json(usersStore);
});

app.post("/api/auth/users", (req, res) => {
  const { username, password, role, matricula } = req.body;
  if (!username || !password || !role || !matricula) {
    return res.status(400).json({ error: "Todos os campos do usuário são obrigatórios." });
  }

  const idx = usersStore.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx !== -1) {
    usersStore[idx] = { ...usersStore[idx], password, role, matricula };
  } else {
    usersStore.push({
      username,
      password,
      role,
      matricula,
      createdAt: req.body.createdAt || new Date().toISOString()
    });
  }

  saveUsersToFile(usersStore);
  res.status(201).json({ success: true });
});

app.post("/api/auth/users/generate", (req, res) => {
  let maxNum = 1;
  for (const u of usersStore) {
    const num = parseInt(u.matricula, 10);
    if (!isNaN(num) && num > maxNum) {
      maxNum = num;
    }
  }
  const nextNum = maxNum + 1;
  const nextMatricula = nextNum.toString().padStart(2, "0");
  const nextUsername = `Exo@${nextMatricula}`;
  const nextPassword = `Uexo@${nextMatricula}`;

  const newUser: StoredUser = {
    username: nextUsername,
    password: nextPassword,
    role: "member",
    matricula: nextMatricula,
    createdAt: new Date().toISOString()
  };

  usersStore.push(newUser);
  saveUsersToFile(usersStore);

  console.log(`[User registered] username: ${nextUsername} (matricula: ${nextMatricula})`);
  res.status(201).json(newUser);
});

app.delete("/api/auth/users/:username", (req, res) => {
  const { username } = req.params;
  if (username.toLowerCase() === "adm@01") {
    return res.status(400).json({ error: "Não é possível remover o administrador principal." });
  }

  const idx = usersStore.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
  if (idx === -1) {
    return res.status(404).json({ error: "Usuário não encontrado." });
  }

  usersStore.splice(idx, 1);
  saveUsersToFile(usersStore);

  res.json({ success: true, message: "Usuário removido com sucesso." });
});

// API endpoints for managing leads
app.get("/api/leads", (req, res) => {
  res.json(leadsStore);
});

app.post("/api/leads", (req, res) => {
  const leadData: LeadRequest = req.body;
  
  if (!leadData.contactName || !leadData.email || !leadData.phone) {
    return res.status(400).json({ error: "Nome, e-mail e telefone de contato são obrigatórios." });
  }

  const newLead: StoredLead = {
    ...leadData,
    id: `lead_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    createdAt: new Date().toISOString(),
    status: "novo"
  };

  leadsStore.unshift(newLead); // Store at beginning
  saveLeadsToFile(leadsStore);

  console.log(`[Lead received] saved lead: ${newLead.id} for company: ${newLead.companyName}`);
  res.status(201).json(newLead);
});

app.patch("/api/leads/:id", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (status !== "novo" && status !== "contatado" && status !== "arquivado") {
    return res.status(400).json({ error: "Status inválido." });
  }

  const idx = leadsStore.findIndex(lead => lead.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Lead não encontrado." });
  }

  leadsStore[idx].status = status;
  saveLeadsToFile(leadsStore);

  res.json(leadsStore[idx]);
});

app.delete("/api/leads/:id", (req, res) => {
  const { id } = req.params;

  const idx = leadsStore.findIndex(lead => lead.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Lead não encontrado." });
  }

  leadsStore.splice(idx, 1);
  saveLeadsToFile(leadsStore);

  res.status(200).json({ message: "Lead deletado com sucesso." });
});

// API endpoint for project scope analysis
app.post("/api/analyze-project", async (req, res) => {
  const { description, services, budget, timeline } = req.body;

  if (!description || typeof description !== "string") {
    return res.status(400).json({ error: "Descrição do projeto é obrigatória." });
  }

  // Structured analysis schema
  const analysisSchema = {
    type: Type.OBJECT,
    properties: {
      techStack: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Recomendações de tecnologias modernas aplicáceis para o projeto (mínimo 3, ex: React, Node.js, PostgreSQL, etc)"
      },
      complexity: {
        type: Type.STRING,
        description: "Nível de complexidade técnica: 'Baixa', 'Média', 'Alta' ou 'Crítica'"
      },
      estimatedWeeks: {
        type: Type.INTEGER,
        description: "Tempo estimado em semanas para a MVP funcional"
      },
      recommendations: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "Três recomendações estratégicas exclusivas e inteligentes focadas em valor de negócio"
      },
      summary: {
        type: Type.STRING,
        description: "Um resumo executivo cativante de 2 a 3 frases em Português sobre o escopo e o diferencial de contar com a Exodo"
      }
    },
    required: ["techStack", "complexity", "estimatedWeeks", "recommendations", "summary"]
  };

  try {
    const ai = getAiClient();
    
    if (!apiKey) {
      // Return beautiful, high-quality fallback/mock analysis for preview if API key is not present
      const mockAnalysis = {
        techStack: ["React / Next.js", "Node.js (TypeScript)", "TailwindCSS", "PostgreSQL", "Supabase / Firebase"],
        complexity: "Média",
        estimatedWeeks: 6,
        recommendations: [
          "Focar na arquitetura 'Mobile-First' com alto desempenho de carregamento.",
          "Implementar cache agressivo nas APIs para otimizar os custos e a velocidade.",
          "Desenvolver um painel administrativo integrado para acompanhamento ágil de métricas."
        ],
        summary: `Sua solicitação de ${services?.join(", ") || "solução digital"} possui excelente viabilidade técnica. A Exodo desenhou um plano focado em escalabilidade imediata, garantindo que o MVP atenda aos padrões mais altos do Vale do Silício.`
      };
      // Delay slightly to simulate AI thinking
      await new Promise(resolve => setTimeout(resolve, 1500));
      return res.json(mockAnalysis);
    }

    const servicesStr = Array.isArray(services) ? services.join(", ") : "Serviços sob medida";
    
    const prompt = `
      Analise a solicitação de escopo para a startup Exodo de forma extremamente profissional e consultiva:
      - Serviços Escolhidos: ${servicesStr}
      - Orçamento Limite: ${budget || "Não especificado"}
      - Prazo Pretendido: ${timeline || "Não especificado"}
      - Descrição do Projeto: "${description}"

      Gere uma arquitetura de MVP completa em português do Brasil usando nosso formato JSON estruturado.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Você é o Diretor de Engenharia e Arquiteto de Software Chefe da Exodo (uma startup milionária de desenvolvimento de produtos premium focada em excelência, escalabilidade máxima e inovação). Suas análises devem ser maduras, assertivas, impressionantes e voltadas para encantar clientes empresariais exigentes.",
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.7,
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error("Resposta da IA vazia");
    }

    const parsedData = JSON.parse(responseText.trim());
    return res.json(parsedData);

  } catch (error: any) {
    console.error("Erro no processamento da IA:", error);
    // Return a solid fallback result gracefully if anything fails
    return res.json({
      techStack: ["React", "TypeScript", "Tailwind CSS", "Node.js (Express)", "MongoDB"],
      complexity: "Média",
      estimatedWeeks: 8,
      recommendations: [
        "Utilizar arquitetura modular serverless para baratear custos operacionais e escalar dinamicamente.",
        "Garantir conformidade total com LGPD desde o dia zero nas camadas de infraestrutura de banco de dados.",
        "Utilizar renderização no servidor para aumentar sensivelmente o ranqueamento orgânico no Google (SEO)."
      ],
      summary: "Sua solicitação demonstra grande potencial comercial. Na Exodo, estruturamos uma abordagem focada em velocidade de entrega sem abdicar de um design excepcional e durável."
    });
  }
});

// Serve static assets or boot Vite dev system
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in development mode...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in production mode...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
