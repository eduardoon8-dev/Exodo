import { useState, useEffect, FormEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StoredLead, ProjectBudget, ProjectTimeline, TeamUser } from "../types";
import { 
  Building, Mail, Phone, Calendar, DollarSign, Clock, Search, 
  Trash2, Check, ExternalLink, ShieldCheck, FileSpreadsheet, 
  Cpu, Layers, SlidersHorizontal, Lock, Archive, ChevronRight, 
  MessageSquare, Users, LogOut, Key, Plus, UserCheck, ShieldAlert, Copy, Sparkles
} from "lucide-react";
import { collection, getDocs, doc, setDoc, deleteDoc, getDocFromServer, onSnapshot } from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../firebase";

// Helper functions for Local Storage static deployment fallback (e.g. Netlify)
function getLocalUsers(): TeamUser[] {
  let data: string | null = null;
  try {
    data = localStorage.getItem("exodo_users");
  } catch (e) {
    console.warn("localStorage.getItem blocked in this environment for exodo_users:", e);
  }

  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  const defaultAdmin: TeamUser = {
    username: "Adm@01",
    password: "Uexo@01",
    role: "admin",
    matricula: "01",
    createdAt: new Date().toISOString()
  };
  const list = [defaultAdmin];
  try {
    localStorage.setItem("exodo_users", JSON.stringify(list));
  } catch (e) {
    console.warn("localStorage.setItem blocked in this environment for exodo_users:", e);
  }
  return list;
}

function saveLocalUsers(users: TeamUser[]) {
  try {
    localStorage.setItem("exodo_users", JSON.stringify(users));
  } catch (e) {
    console.warn("localStorage.setItem blocked in this environment for exodo_users:", e);
  }
}

function getLocalLeads(): StoredLead[] {
  let data: string | null = null;
  try {
    data = localStorage.getItem("exodo_leads");
  } catch (e) {
    console.warn("localStorage.getItem blocked in this environment for exodo_leads:", e);
  }

  if (data) {
    try {
      return JSON.parse(data);
    } catch {
      // ignore
    }
  }
  return [];
}

function saveLocalLeads(leads: StoredLead[]) {
  try {
    localStorage.setItem("exodo_leads", JSON.stringify(leads));
  } catch (e) {
    console.warn("localStorage.setItem blocked in this environment for exodo_leads:", e);
  }
}

interface AdminDashboardProps {
  onBackToClientView: () => void;
}

export default function AdminDashboard({ onBackToClientView }: AdminDashboardProps) {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<TeamUser | null>(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [isLocalMode, setIsLocalMode] = useState(false);

  // General Dashboard states
  const [leads, setLeads] = useState<StoredLead[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamUser[]>([]);
  const [loadingLeads, setLoadingLeads] = useState(false);
  const [activeTab, setActiveTab] = useState<"leads" | "team">("leads");

  // Search/Filters for Leads
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<"todos" | "novo" | "contatado" | "arquivado">("todos");
  const [selectedLead, setSelectedLead] = useState<StoredLead | null>(null);

  // New User Generation Feedbacks
  const [lastGeneratedUser, setLastGeneratedUser] = useState<TeamUser | null>(null);
  const [generatingUser, setGeneratingUser] = useState(false);
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  // Test connection and Bootstrap administrator on first launch (to make sure it is ready)
  useEffect(() => {
    async function initFirebaseAndBootstrap() {
      try {
        await getDocFromServer(doc(db, "test", "connection"));
      } catch (error) {
        if (error instanceof Error && error.message.includes("offline")) {
          console.warn("Firestore client is offline.");
        }
      }

      try {
        const admRef = doc(db, "team", "Adm@01");
        const snap = await getDocFromServer(admRef);
        if (!snap.exists()) {
          const defaultAdmin: TeamUser = {
            username: "Adm@01",
            password: "Uexo@01",
            role: "admin",
            matricula: "01",
            createdAt: new Date().toISOString()
          };
          await setDoc(admRef, defaultAdmin);
          console.log("Admin bootstrapped on Firestore database.");
        }
      } catch (err) {
        console.warn("Bootstrap admin skipped or failed:", err);
      }
    }
    initFirebaseAndBootstrap();
  }, []);

  // Fetch leads
  const fetchLeads = async (isSilent = false) => {
    if (!isSilent) setLoadingLeads(true);

    let fsLeads: StoredLead[] = [];
    try {
      const querySnapshot = await getDocs(collection(db, "leads"));
      querySnapshot.forEach((doc) => {
        fsLeads.push(doc.data() as StoredLead);
      });
    } catch (fsErr) {
      console.warn("Could not fetch leads from Firestore, using other sources:", fsErr);
    }

    let apiLeads: StoredLead[] = [];
    try {
      const response = await fetch("/api/leads");
      if (response.ok) {
        apiLeads = await response.json();
      }
    } catch (error) {
      console.warn("Error fetching leads via API:", error);
    }

    const localLeads = getLocalLeads();

    // Map to store unique leads by ID, prioritized by source freshness (Firestore > API > LocalStorage)
    const mergedMap = new Map<string, StoredLead>();

    localLeads.forEach(lead => {
      if (lead && lead.id) {
        mergedMap.set(lead.id, lead);
      }
    });

    apiLeads.forEach(lead => {
      if (lead && lead.id) {
        mergedMap.set(lead.id, lead);
      }
    });

    fsLeads.forEach(lead => {
      if (lead && lead.id) {
        mergedMap.set(lead.id, lead);
      }
    });

    const finalLeads = Array.from(mergedMap.values());
    finalLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    setLeads(finalLeads);
    saveLocalLeads(finalLeads);
    if (!isSilent) setLoadingLeads(false);
  };

  // Fetch team directory
  const fetchTeamMembers = async () => {
    let fsTeam: TeamUser[] = [];
    try {
      const querySnapshot = await getDocs(collection(db, "team"));
      querySnapshot.forEach((doc) => {
        fsTeam.push(doc.data() as TeamUser);
      });
    } catch (fsErr) {
      console.warn("Could not fetch team directory from Firestore:", fsErr);
    }

    let apiTeam: TeamUser[] = [];
    try {
      const response = await fetch("/api/auth/users");
      if (response.ok) {
        apiTeam = await response.json();
      }
    } catch (error) {
      console.warn("Error fetching team members via API:", error);
    }

    const localTeam = getLocalUsers();

    // Map to store unique team members by username, prioritized by source freshness (Firestore > API > LocalStorage)
    const mergedMap = new Map<string, TeamUser>();

    localTeam.forEach(user => {
      if (user && user.username) {
        mergedMap.set(user.username.toLowerCase(), user);
      }
    });

    apiTeam.forEach(user => {
      if (user && user.username) {
        mergedMap.set(user.username.toLowerCase(), user);
      }
    });

    fsTeam.forEach(user => {
      if (user && user.username) {
        mergedMap.set(user.username.toLowerCase(), user);
      }
    });

    const finalTeam = Array.from(mergedMap.values());
    setTeamMembers(finalTeam);
    saveLocalUsers(finalTeam);
  };

  // Load datasets with real-time Firebase subscription when user becomes authenticated
  useEffect(() => {
    if (!currentUser) return;

    // 1. Establish real-time onSnapshot listener for Leads
    const unsubscribeLeads = onSnapshot(
      collection(db, "leads"),
      async (snapshot) => {
        let fsLeads: StoredLead[] = [];
        snapshot.forEach((doc) => {
          fsLeads.push(doc.data() as StoredLead);
        });

        let apiLeads: StoredLead[] = [];
        try {
          const response = await fetch("/api/leads");
          if (response.ok) {
            apiLeads = await response.json();
          }
        } catch (error) {
          console.warn("Error fetching leads via API:", error);
        }

        const localLeads = getLocalLeads();

        const mergedMap = new Map<string, StoredLead>();
        localLeads.forEach(lead => {
          if (lead && lead.id) {
            mergedMap.set(lead.id, lead);
          }
        });
        apiLeads.forEach(lead => {
          if (lead && lead.id) {
            mergedMap.set(lead.id, lead);
          }
        });
        fsLeads.forEach(lead => {
          if (lead && lead.id) {
            mergedMap.set(lead.id, lead);
          }
        });

        const finalLeads = Array.from(mergedMap.values());
        finalLeads.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        setLeads(finalLeads);
        saveLocalLeads(finalLeads);
        setLoadingLeads(false);
      },
      (error) => {
        console.error("Firestore onSnapshot error for leads:", error);
        // Fallback to static retrieval if listener fails
        fetchLeads();
        try {
          handleFirestoreError(error, OperationType.GET, "leads");
        } catch (fe) {
          console.error("Firestore error triggered during fallback:", fe);
        }
      }
    );

    // 2. Establish real-time onSnapshot listener for Team
    const unsubscribeTeam = onSnapshot(
      collection(db, "team"),
      async (snapshot) => {
        let fsTeam: TeamUser[] = [];
        snapshot.forEach((doc) => {
          fsTeam.push(doc.data() as TeamUser);
        });

        let apiTeam: TeamUser[] = [];
        try {
          const response = await fetch("/api/auth/users");
          if (response.ok) {
            apiTeam = await response.json();
          }
        } catch (error) {
          console.warn("Error fetching team members via API:", error);
        }

        const localTeam = getLocalUsers();

        const mergedMap = new Map<string, TeamUser>();
        localTeam.forEach(user => {
          if (user && user.username) {
            mergedMap.set(user.username.toLowerCase(), user);
          }
        });
        apiTeam.forEach(user => {
          if (user && user.username) {
            mergedMap.set(user.username.toLowerCase(), user);
          }
        });
        fsTeam.forEach(user => {
          if (user && user.username) {
            mergedMap.set(user.username.toLowerCase(), user);
          }
        });

        const finalTeam = Array.from(mergedMap.values());
        setTeamMembers(finalTeam);
        saveLocalUsers(finalTeam);
      },
      (error) => {
        console.error("Firestore onSnapshot error for team:", error);
        // Fallback to static retrieval if listener fails
        fetchTeamMembers();
        try {
          handleFirestoreError(error, OperationType.GET, "team");
        } catch (fe) {
          console.error("Firestore error triggered during fallback:", fe);
        }
      }
    );

    // 3. Set up a silent polling interval as a bulletproof double-fallback for real-time updates
    const pollInterval = setInterval(() => {
      fetchLeads(true);
      fetchTeamMembers();
    }, 3000);

    return () => {
      unsubscribeLeads();
      unsubscribeTeam();
      clearInterval(pollInterval);
    };
  }, [currentUser, isLocalMode]);

  // Auth handle submission
  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setLoadingAuth(true);

    const userVal = usernameInput.trim();
    const passVal = passwordInput.trim();

    if (!userVal || !passVal) {
      setAuthError("Forneça o usuário e a senha.");
      setLoadingAuth(false);
      return;
    }

    // Try Firestore auth check first
    try {
      const userRef = doc(db, "team", userVal);
      const userSnap = await getDocFromServer(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as TeamUser;
        if (userData.password === passVal) {
          setCurrentUser({
            username: userData.username,
            role: userData.role,
            matricula: userData.matricula,
            createdAt: userData.createdAt
          });
          setIsLocalMode(false);
          setAuthError("");
          setLoadingAuth(false);
          return;
        }
      }
    } catch (fsErr) {
      console.warn("Firestore direct authentication check failed/skipped:", fsErr);
    }

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userVal,
          password: passVal
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setCurrentUser(data.user);
          setIsLocalMode(false);
          setAuthError("");
          setLoadingAuth(false);
          return;
        } else {
          setAuthError(data.error || "Dados de acesso incorretos ou inexistentes.");
          setLoadingAuth(false);
          return;
        }
      }
    } catch (err) {
      console.warn("API login failed, attempt localStorage static fallback authentication:", err);
    }

    // fallback to client storage auth representation
    const localUsers = getLocalUsers();
    const matchedUser = localUsers.find(
      u => u.username.toLowerCase() === userVal.toLowerCase() && u.password === passVal
    );

    if (matchedUser) {
      setCurrentUser({
        username: matchedUser.username,
        role: matchedUser.role,
        matricula: matchedUser.matricula,
        createdAt: matchedUser.createdAt
      });
      setIsLocalMode(true);
      setAuthError("");
    } else {
      setAuthError("Usuário ou senha incorretos (Login Local / Offline).");
    }
    setLoadingAuth(false);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab("leads");
    setLastGeneratedUser(null);
  };

  // Update lead status
  const handleUpdateStatus = async (id: string, newStatus: "novo" | "contatado" | "arquivado") => {
    // Attempt Firestore edit first
    try {
      const leadRef = doc(db, "leads", id);
      await setDoc(leadRef, { status: newStatus }, { merge: true });
      console.log("Status atualizado no Firestore com sucesso.");
    } catch (fsErr) {
      console.warn("Could not update lead status on Firestore:", fsErr);
    }

    // Always keep Local state updated too
    const updatedList = leads.map(lead => lead.id === id ? { ...lead, status: newStatus } : lead);
    setLeads(updatedList);
    saveLocalLeads(updatedList);
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead(prev => prev ? { ...prev, status: newStatus } : null);
    }

    // Mirror to node server backend if it exists
    try {
      await fetch(`/api/leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (error) {
      console.warn("Server API sync status update failed (non-blocking).");
    }
  };

  // Delete lead
  const handleDeleteLead = async (id: string) => {
    if (!window.confirm("Confirmar exclusão definitiva do registro de orçamento?")) {
      return;
    }

    // Attempt Firestore delete
    try {
      const leadRef = doc(db, "leads", id);
      await deleteDoc(leadRef);
      console.log("Lead deletado do Firestore.");
    } catch (fsErr) {
      console.warn("Could not delete lead from Firestore:", fsErr);
    }

    // Always update local state
    const updatedList = leads.filter(lead => lead.id !== id);
    setLeads(updatedList);
    saveLocalLeads(updatedList);
    if (selectedLead && selectedLead.id === id) {
      setSelectedLead(null);
    }

    // Mirror to server API
    try {
      await fetch(`/api/leads/${id}`, {
        method: "DELETE"
      });
    } catch (error) {
      console.warn("Server API sync delete failed (non-blocking).");
    }
  };

  // Generate next sequential team user
  const handleGenerateTeamMember = async () => {
    if (currentUser?.role !== "admin") {
      alert("Apenas contas de perfil máximo (Super Admin) podem gerar matrículas de novos membros.");
      return;
    }

    setGeneratingUser(true);
    setCopiedSuccess(false);

    // Calculate sequential matricula
    let maxNum = 1;
    for (const u of teamMembers) {
      const num = parseInt(u.matricula, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    const nextNum = maxNum + 1;
    const nextMatricula = nextNum.toString().padStart(2, "0");
    const nextUsername = `Exo@${nextMatricula}`;
    const nextPassword = `Uexo@${nextMatricula}`;

    const newUser: TeamUser = {
      username: nextUsername,
      password: nextPassword,
      role: "member",
      matricula: nextMatricula,
      createdAt: new Date().toISOString()
    };

    // Try Firestore save first
    try {
      const userRef = doc(db, "team", newUser.username);
      await setDoc(userRef, newUser);
      console.log("Membro do time armazenado no Firestore com sucesso.");
    } catch (fsErr) {
      console.warn("Could not save new team user on Firestore directly:", fsErr);
    }

    // Always keep Local state updated too
    const localUsers = getLocalUsers();
    const updatedUsers = [...localUsers, newUser];
    saveLocalUsers(updatedUsers);
    setTeamMembers(prev => [...prev.filter(u => u.username !== newUser.username), newUser]);
    setLastGeneratedUser(newUser);

    // Call API sync fallback
    try {
      await fetch("/api/auth/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser)
      });
    } catch (error) {
      console.warn("Server API sync for generating user failed (non-blocking).");
    }

    setGeneratingUser(false);
  };

  // Delete team user
  const handleDeleteUser = async (username: string) => {
    if (username.toLowerCase() === "adm@01") {
      alert("Operação bloqueada: o administrador principal (Adm@01) não pode ser removido.");
      return;
    }

    if (!window.confirm(`Tem certeza que deseja banir/remover o colaborador "${username}" da equipe?`)) {
      return;
    }

    // Attempt doc delete from Firestore
    try {
      const userRef = doc(db, "team", username);
      await deleteDoc(userRef);
      console.log("Colaborador removido do Firestore.");
    } catch (fsErr) {
      console.warn("Could not delete user from Firestore:", fsErr);
    }

    // Always update local state
    const updatedList = getLocalUsers().filter(u => u.username !== username);
    saveLocalUsers(updatedList);
    setTeamMembers(prev => prev.filter(u => u.username !== username));
    if (lastGeneratedUser?.username === username) {
      setLastGeneratedUser(null);
    }

    // Call API sync fallback
    try {
      await fetch(`/api/auth/users/${username}`, {
        method: "DELETE"
      });
    } catch (error) {
      console.warn("Server API sync delete user failed (non-blocking).");
    }
  };

  // Copy generated credentials
  const handleCopyCredentials = (user: TeamUser) => {
    const text = `Acesso Técnico Exodo:\nUsuário: ${user.username}\nSenha: ${user.password}\nMatrícula: ${user.matricula}\nPerfil: Membro do Time`;
    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2000);
  };

  // Calculate stats
  const totalReceived = leads.length;
  const newLeadsCount = leads.filter(l => l.status === "novo").length;
  const contactedLeadsCount = leads.filter(l => l.status === "contatado").length;
  const estimatedPipeline = leads.reduce((acc, lead) => {
    let value = 15000;
    if (lead.budget === ProjectBudget.MEDIUM) value = 35000;
    else if (lead.budget === ProjectBudget.HIGH) value = 100000;
    else if (lead.budget === ProjectBudget.ENTERPRISE) value = 200000;
    return acc + value;
  }, 0);

  // Formatting date
  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return isoString;
    }
  };

  // Filtered Leads list
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      lead.companyName?.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.contactName?.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchText.toLowerCase()) ||
      lead.phone?.includes(searchText);

    if (statusFilter === "todos") return matchesSearch;
    return lead.status === statusFilter && matchesSearch;
  });

  const getStatusBadge = (status: "novo" | "contatado" | "arquivado") => {
    switch (status) {
      case "novo":
        return <span className="inline-flex items-center gap-1 rounded bg-[#00AEEF]/10 border border-[#00AEEF]/20 px-2 py-0.5 text-[10px] font-bold text-[#00AEEF] uppercase tracking-wide">Novo</span>;
      case "contatado":
        return <span className="inline-flex items-center gap-1 rounded bg-green-500/10 border border-green-500/20 px-2 py-0.5 text-[10px] font-bold text-green-400 uppercase tracking-wide">Contatado</span>;
      case "arquivado":
        return <span className="inline-flex items-center gap-1 rounded bg-gray-500/10 border border-gray-500/20 px-2 py-0.5 text-[10px] font-bold text-gray-400 uppercase tracking-wide">Arquivado</span>;
    }
  };

  const getWhatsAppLink = (phone: string, clientName: string, company: string) => {
    const digits = phone.replace(/\D/g, "");
    const dest = digits.length <= 11 ? `55${digits}` : digits;
    const msg = encodeURIComponent(`Olá ${clientName}, sou especialista técnico da Exodo. Analisamos a solicitação de escopo da ${company} enviada pelo nosso orçamentador e gostaríamos de alinhar as especificações técnicas.`);
    return `https://api.whatsapp.com/send?phone=${dest}&text=${msg}`;
  };

  const handleExportCSV = () => {
    const headers = ["ID", "Empresa", "Contato", "E-mail", "Telefone", "Investimento", "Prazo", "Status", "Data de Cadastramento"];
    const rows = leads.map(l => [
      l.id,
      `"${l.companyName}"`,
      `"${l.contactName}"`,
      l.email,
      l.phone,
      `"${l.budget}"`,
      `"${l.timeline}"`,
      l.status,
      formatDate(l.createdAt)
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.href = encodedUri;
    link.download = `exodo_leads_equipe_${new Date().toISOString().substring(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Pre-calculate the NEXT matricula for visual representation
  const getNextPredictedMatricula = () => {
    let maxNum = 1;
    for (const u of teamMembers) {
      const num = parseInt(u.matricula, 10);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }
    return (maxNum + 1).toString().padStart(2, "0");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-gray-200 selection:bg-[#00AEEF] selection:text-black pt-4">
      {/* Visual background lights */}
      <div className="absolute top-0 right-0 h-[450px] w-[450px] bg-[#00AEEF]/5 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 h-[350px] w-[350px] bg-[#bd5cf1]/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 pb-24 relative z-10">
        
        {/* Upper Dashboard Navigation Toolbar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 py-6 mb-8">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#00AEEF] bg-[#00AEEF]/10 px-2.5 py-0.5 rounded-full border border-[#00AEEF]/20">Estação de Trabalho</span>
              {isLocalMode && (
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 font-mono tracking-tight" title="Nenhum backend ativo detectado. Usando armazenamento do navegador (localStorage) para permitir testes completos sem infraestrutura adicional.">Modo Estático / Local</span>
              )}
              {currentUser && (
                <span className="text-white/40 text-xs flex items-center gap-1.5 font-mono">
                  <span>/ conectado como </span>
                  <span className="text-[#00AEEF] font-bold underline decoration-dotted">{currentUser.username}</span>
                  {currentUser.role === "admin" ? (
                    <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-1.5 rounded uppercase">Perfil Máximo</span>
                  ) : (
                    <span className="text-[9px] bg-gray-500/10 border border-gray-500/20 text-gray-400 font-bold px-1.5 rounded uppercase">Time</span>
                  )}
                </span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1.5">Painel Operacional</h1>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={onBackToClientView}
              className="text-xs font-semibold px-4 py-2 border border-white/10 hover:border-white/20 hover:bg-white/5 rounded-xl text-gray-300 hover:text-white transition-all cursor-pointer"
            >
              Voltar ao Site Público
            </button>
            {currentUser && (
              <>
                <button 
                  onClick={handleExportCSV}
                  className="group flex items-center gap-1.5 text-xs font-bold px-4 py-2 bg-[#00AEEF]/5 border border-[#00AEEF]/20 hover:bg-[#00AEEF]/15 hover:border-[#00AEEF]/45 text-[#00AEEF] rounded-xl transition-all cursor-pointer"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Baixar CSV</span>
                </button>

                <button 
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-2 bg-red-950/20 text-red-400 border border-red-900/10 hover:bg-red-900/30 hover:border-red-900/30 rounded-xl transition-all cursor-pointer"
                  title="Sair da Estação de Trabalho"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Desconectar</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Auth Barrier Screen */}
        {!currentUser ? (
          <div className="max-w-md mx-auto my-12">
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-[#0d0d10] border border-white/5 rounded-[32px] p-8 text-center relative overflow-hidden shadow-2xl"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#00AEEF] to-[#bd5cf1]" />
              
              <div className="flex justify-center h-12 w-12 rounded-2xl bg-white/5 border border-white/10 text-[#00AEEF] items-center mx-auto mb-4">
                <Lock className="h-6 w-6" />
              </div>

              <h2 className="text-xl font-bold text-white tracking-tight">Portal Corporativo da Exodo</h2>
              <p className="text-xs text-gray-400 mt-2 mb-6 leading-relaxed">
                Acesse usando suas credenciais corporativas exclusivas para gerenciar propostas comerciais e controlar o catálogo técnico.
              </p>

              <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 ml-1">Identificador de Usuário</label>
                  <input 
                    type="text" 
                    value={usernameInput}
                    onChange={(e) => setUsernameInput(e.target.value)}
                    placeholder="Usuário" 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]/20 transition-all font-mono"
                    disabled={loadingAuth}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-bold tracking-wider text-gray-500 ml-1">Senha Corporativa</label>
                  <input 
                    type="password" 
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    placeholder="Palavra-passe..." 
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#00AEEF] focus:ring-1 focus:ring-[#00AEEF]/20 transition-all font-mono"
                    disabled={loadingAuth}
                  />
                </div>

                {authError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg bg-red-950/20 border border-red-900/30 text-[11px] text-red-500 font-medium text-center"
                  >
                    {authError}
                  </motion.div>
                )}

                <button 
                  type="submit" 
                  disabled={loadingAuth}
                  className="w-full bg-[#00AEEF] hover:bg-[#0091c7] active:scale-[0.98] text-black font-bold py-3.5 rounded-xl transition-all cursor-pointer text-xs uppercase tracking-wider flex items-center justify-center gap-2"
                >
                  {loadingAuth ? (
                    <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      <ShieldCheck className="h-4 w-4" />
                      <span>Autenticar Usuário</span>
                    </>
                  )}
                </button>
              </form>

            </motion.div>
          </div>
        ) : (
          /* Main Workspace Container (Leads + Team Directory) */
          <div className="space-y-8">
            
            {/* Real-time Business Pipeline Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-2xl bg-[#0d0d10] border border-white/5 p-5 text-left transition-all hover:bg-[#0e0e13]">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Captações Totais</span>
                <div className="text-3xl font-black text-white mt-1">{totalReceived}</div>
                <div className="text-[10px] text-gray-600 mt-1">Registros recebidos no total</div>
              </div>
              
              <div className="rounded-2xl bg-[#0d0d10] border border-white/5 p-5 text-left transition-all hover:bg-[#0e0e13]">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Esperando Contato</span>
                <div className="text-3xl font-black text-[#00AEEF] mt-1">{newLeadsCount}</div>
                <div className="text-[10px] text-gray-600 mt-1">Fila pendente de atendimento</div>
              </div>

              <div className="rounded-2xl bg-[#0d0d10] border border-white/5 p-5 text-left transition-all hover:bg-[#0e0e13]">
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Clientes Abordados</span>
                <div className="text-3xl font-black text-green-400 mt-1">{contactedLeadsCount}</div>
                <div className="text-[10px] text-gray-600 mt-1">Negociações iniciadas</div>
              </div>

              <div className="rounded-2xl bg-[#0d0d10] border border-white/5 p-5 text-left relative overflow-hidden transition-all hover:bg-[#0e0e13]">
                <div className="absolute right-[-20px] bottom-[-20px] text-white/[0.015] shrink-0 pointer-events-none">
                  <DollarSign className="h-24 w-24" />
                </div>
                <span className="text-[10px] uppercase text-gray-500 font-bold tracking-wider">Estimativa de Pipeline</span>
                <div className="text-3xl font-black text-indigo-400 mt-1">R$ {(estimatedPipeline / 1000).toFixed(0)}k+</div>
                <div className="text-[10px] text-gray-600 mt-1">Preservação de receita potencial</div>
              </div>
            </div>

            {/* Workplace Panel Workspace Controller Tab Navigation */}
            <div className="flex border-b border-white/5">
              <button 
                onClick={() => { setActiveTab("leads"); setLastGeneratedUser(null); }}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "leads" ? "border-[#00AEEF] text-[#00AEEF]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
              >
                <Layers className="h-4 w-4" />
                <span>Solicitações de Orçamento ({leads.length})</span>
              </button>

              <button 
                onClick={() => setActiveTab("team")}
                className={`flex items-center gap-2 px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === "team" ? "border-[#00AEEF] text-[#00AEEF]" : "border-transparent text-gray-500 hover:text-gray-300"}`}
              >
                <Users className="h-4 w-4" />
                <span>Membros da Equipe ({teamMembers.length})</span>
              </button>
            </div>

            {/* Dynamic tabs render */}
            {activeTab === "leads" ? (
              /* PANEL A: LEADS PIPELINE WORKSPACE */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Search, Filter & Roll Section */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#0d0d10] border border-white/5 rounded-2xl p-4 space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input 
                        type="text" 
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        placeholder="Pesquisar por empresa, nome ou e-mail..."
                        className="w-full bg-black/40 border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#00AEEF] transition-all"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                      <button 
                        onClick={() => setStatusFilter("todos")}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${statusFilter === "todos" ? "bg-white/10 text-white font-bold border border-white/10" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        Todos ({leads.length})
                      </button>
                      <button 
                        onClick={() => setStatusFilter("novo")}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${statusFilter === "novo" ? "bg-[#00AEEF]/10 text-[#00AEEF] font-bold border border-[#00AEEF]/20" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        Novos ({leads.filter(l => l.status === "novo").length})
                      </button>
                      <button 
                        onClick={() => setStatusFilter("contatado")}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${statusFilter === "contatado" ? "bg-green-500/10 text-green-400 font-bold border border-green-500/20" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        Contatados ({leads.filter(l => l.status === "contatado").length})
                      </button>
                      <button 
                        onClick={() => setStatusFilter("arquivado")}
                        className={`px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${statusFilter === "arquivado" ? "bg-gray-500/10 text-gray-400 font-bold border border-gray-500/20" : "text-gray-500 hover:text-gray-300"}`}
                      >
                        Arquivados ({leads.filter(l => l.status === "arquivado").length})
                      </button>
                    </div>
                  </div>

                  {/* Leads List Feed */}
                  <div className="max-h-[550px] overflow-y-auto space-y-2 pr-1">
                    {loadingLeads ? (
                      <div className="text-center py-12 text-gray-500 text-xs">
                        Sincronizando banco de solicitações...
                      </div>
                    ) : filteredLeads.length === 0 ? (
                      <div className="text-center py-16 rounded-2xl border border-dashed border-white/5 bg-[#0d0d10]/50 text-gray-500 text-xs text-balance">
                        Nenhuma requisição de orçamento atende aos parâmetros de exibição.
                      </div>
                    ) : (
                      filteredLeads.map((lead) => (
                        <div 
                          key={lead.id} 
                          onClick={() => setSelectedLead(lead)}
                          className={`p-4 rounded-xl text-left border cursor-pointer transition-all ${selectedLead?.id === lead.id ? "bg-[#111116] border-[#00AEEF]" : "bg-[#0d0d10] border-white/5 hover:border-white/10 hover:bg-[#0e0e12]"}`}
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-sm font-bold text-white truncate max-w-[190px]">
                                {lead.companyName || lead.contactName}
                              </h4>
                              <p className="text-[11px] text-gray-400">{lead.contactName}</p>
                            </div>
                            {getStatusBadge(lead.status)}
                          </div>

                          <div className="mt-2 text-[10px] text-gray-500 line-clamp-1">
                            {lead.services.join(" • ")}
                          </div>

                          <div className="mt-3 flex items-center justify-between text-[10px] text-gray-600 font-mono">
                            <span>{formatDate(lead.createdAt)}</span>
                            <span className="font-sans font-bold text-gray-400">{lead.budget}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Lead Inspection Panel */}
                <div className="lg:col-span-7">
                  <AnimatePresence mode="wait">
                    {selectedLead ? (
                      <motion.div 
                        key={selectedLead.id}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -15 }}
                        className="bg-[#0d0d10] border border-white/5 rounded-2xl p-6 sm:p-8 space-y-6 text-left"
                      >
                        
                        {/* Title and control toggles */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] text-gray-500">{selectedLead.id}</span>
                              <span className="text-gray-600">•</span>
                              <span className="text-xs text-gray-400">{formatDate(selectedLead.createdAt)}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-white mt-1">{selectedLead.companyName || "Empresa sem nome"}</h2>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button 
                              onClick={() => handleUpdateStatus(selectedLead.id, "novo")}
                              className={`px-2.5 py-1 text-[10px] rounded font-bold cursor-pointer transition-all ${selectedLead.status === "novo" ? "bg-[#00AEEF] text-black" : "bg-white/5 hover:bg-white/10 text-gray-400"}`}
                            >
                              Novo
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(selectedLead.id, "contatado")}
                              className={`px-2.5 py-1 text-[10px] rounded font-bold cursor-pointer transition-all ${selectedLead.status === "contatado" ? "bg-green-500 text-black" : "bg-white/5 hover:bg-white/10 text-gray-400"}`}
                            >
                              Abordado
                            </button>
                            <button 
                              onClick={() => handleUpdateStatus(selectedLead.id, "arquivado")}
                              className={`px-2.5 py-1 text-[10px] rounded font-bold cursor-pointer transition-all ${selectedLead.status === "arquivado" ? "bg-gray-500 text-black" : "bg-white/5 hover:bg-white/10 text-gray-400"}`}
                            >
                              Arquivar
                            </button>
                            <button 
                              onClick={() => handleDeleteLead(selectedLead.id)}
                              className="p-1 px-1.5 bg-red-950/20 hover:bg-red-900/40 text-red-400 rounded-lg border border-red-900/25 transition-all cursor-pointer"
                              title="Excluir Definitivamente"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Customer identification channels */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/40 border border-white/5 rounded-xl p-4">
                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Representante Legal</span>
                            <div className="text-white font-semibold text-sm flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-[#00AEEF]" />
                              {selectedLead.contactName}
                            </div>
                          </div>

                          <div className="space-y-1">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Módulos Solicitados</span>
                            <div className="text-xs text-[#00AEEF] font-bold line-clamp-2">
                              {selectedLead.services.join(", ")}
                            </div>
                          </div>

                          <div className="space-y-1 border-t border-white/5 pt-3">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Correio Eletrônico</span>
                            <a href={`mailto:${selectedLead.email}`} className="text-xs text-gray-300 hover:text-white flex items-center gap-1 hover:underline truncate">
                              <Mail className="h-3.5 w-3.5 text-gray-500 shrink-0" />
                              {selectedLead.email}
                            </a>
                          </div>

                          <div className="space-y-1 border-t border-white/5 pt-3">
                            <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Telefone para Alinhamento</span>
                            <div className="flex items-center gap-3">
                              <span className="text-xs text-gray-300 flex items-center gap-1 truncate">
                                <Phone className="h-3.5 w-3.5 text-gray-500" />
                                {selectedLead.phone}
                              </span>
                              <a 
                                href={getWhatsAppLink(selectedLead.phone, selectedLead.contactName, selectedLead.companyName)}
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] bg-green-500/15 hover:bg-green-500/25 text-green-400 font-bold px-2 py-0.5 rounded border border-green-500/20 transition-all"
                              >
                                <MessageSquare className="h-3 w-3" />
                                <span>WhatsApp</span>
                              </a>
                            </div>
                          </div>
                        </div>

                        {/* Project sizing targets mapping */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="border border-white/5 rounded-xl p-3 flex items-center gap-3 bg-[#0a0a0d]">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00AEEF]/10 border border-[#00AEEF]/20 text-[#00AEEF]">
                              <DollarSign className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold">Investimento Indicado</span>
                              <span className="text-sm font-bold text-white leading-none">{selectedLead.budget}</span>
                            </div>
                          </div>

                          <div className="border border-white/5 rounded-xl p-3 flex items-center gap-3 bg-[#0a0a0d]">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#bd5cf1]/10 border border-[#bd5cf1]/20 text-[#bd5cf1]">
                              <Clock className="h-4.5 w-4.5" />
                            </div>
                            <div>
                              <span className="block text-[9px] uppercase tracking-wider text-gray-500 font-bold">Entrega Esperada</span>
                              <span className="text-sm font-bold text-white leading-none">{selectedLead.timeline}</span>
                            </div>
                          </div>
                        </div>

                        {/* Text description written by client */}
                        <div className="space-y-1.5">
                          <span className="text-[10px] uppercase tracking-wider font-bold text-gray-500">Declaração da Necessidade (Briefing do Desafio)</span>
                          <div className="bg-[#050505] p-4 rounded-xl border border-white/5 text-xs inline-block w-full text-gray-300 whitespace-pre-wrap leading-relaxed">
                            "{selectedLead.description || "O usuário não escreveu um detalhamento adicional."}"
                          </div>
                        </div>

                        {/* AI Built Blueprint Report */}
                        {selectedLead.aiAnalysis && (
                          <div className="space-y-4 border-t border-white/5 pt-6">
                            <div className="flex items-center gap-2 text-xs font-bold text-[#bd5cf1]">
                              <Cpu className="h-4 w-4 text-[#00AEEF]" />
                              <span className="uppercase tracking-widest text-[#00AEEF]">Análise Estrutural Exodo AI Architect</span>
                            </div>

                            <div className="bg-[#0a0a14] border border-[#00AEEF]/10 rounded-xl p-4 sm:p-5 space-y-4">
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                                <div>
                                  <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Complexidade Técnica</span>
                                  <span className="font-bold text-white text-sm">{selectedLead.aiAnalysis.complexity}</span>
                                </div>
                                <div>
                                  <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Estimativa de Tempo</span>
                                  <span className="font-bold text-white text-sm">{selectedLead.aiAnalysis.estimatedWeeks} semanas para MVP</span>
                                </div>
                              </div>

                              <div className="space-y-1">
                                <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Pilha de Tecnologia Indicada</span>
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {selectedLead.aiAnalysis.techStack.map((tech, tid) => (
                                    <span key={tid} className="bg-white/5 px-2 py-0.5 rounded text-[10px] font-mono text-gray-300 border border-white/5">{tech}</span>
                                  ))}
                                </div>
                              </div>

                              <div className="space-y-1.5 pt-2 border-t border-white/5">
                                <span className="block text-[10px] text-gray-500 uppercase tracking-wider">Diretrizes e Recomendações Críticas</span>
                                <ul className="space-y-1.5">
                                  {selectedLead.aiAnalysis.recommendations.map((rec, rid) => (
                                    <li key={rid} className="text-xs text-gray-400 flex items-start gap-1.5">
                                      <span className="text-[#00AEEF] mt-1 shrink-0 font-bold">•</span>
                                      <span>{rec}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              <div className="space-y-1.5 pt-2 border-t border-white/5 text-xs text-gray-400 leading-relaxed italic">
                                <span className="block text-[10px] not-italic text-gray-500 uppercase tracking-wider">Resumo Executivo</span>
                                "{selectedLead.aiAnalysis.summary}"
                              </div>
                            </div>
                          </div>
                        )}

                      </motion.div>
                    ) : (
                      <div className="h-full py-24 flex flex-col items-center justify-center border border-dashed border-white/5 bg-[#0d0d10]/20 rounded-2xl text-center">
                        <Layers className="h-10 w-10 text-gray-600 mb-2" />
                        <h3 className="text-sm font-bold text-gray-400">Nenhum Registro Selecionado</h3>
                        <p className="text-xs text-gray-500 mt-1">Selecione uma solicitação corporativa no rolo à esquerda para avaliar os parâmetros.</p>
                      </div>
                    )}
                  </AnimatePresence>
                </div>

              </div>
            ) : (
              /* PANEL B: TEAM USERS AND MATRICULAS DIRECTORY */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                
                {/* Generation control on Left */}
                <div className="lg:col-span-5 space-y-4">
                  <div className="bg-[#0d0d10] border border-white/5 rounded-2xl p-6 relative overflow-hidden text-left">
                    <div className="absolute top-0 right-0 h-20 w-20 bg-[#00AEEF]/5 rounded-full blur-[20px] pointer-events-none" />
                    
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-[#00AEEF] mb-4">
                      <Key className="h-5 w-5" />
                    </div>

                    <h3 className="text-lg font-bold text-white">Gerar Matrícula do Time</h3>
                    <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                      Cria uma conta de operador técnico usando a numeração sequencial corporativa por ordem de chamada.
                    </p>

                    <div className="bg-black/40 border border-white/5 rounded-xl p-4 my-5 space-y-3">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Operadores Atuais:</span>
                        <span className="text-white font-bold">{teamMembers.length}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Próxima Matrícula Prevista:</span>
                        <span className="text-[#00AEEF] font-mono font-bold">Exo@{getNextPredictedMatricula()}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-500">Senha do Lote Seguinte:</span>
                        <span className="text-indigo-400 font-mono font-bold">Uexo@{getNextPredictedMatricula()}</span>
                      </div>
                    </div>

                    {/* Generate button (Authorized constraints) */}
                    {currentUser.role === "admin" ? (
                      <button 
                        onClick={handleGenerateTeamMember}
                        disabled={generatingUser}
                        className="w-full bg-[#00AEEF] hover:bg-[#00c2ff] active:scale-[0.98] text-black font-extrabold py-3.5 rounded-xl text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[0_0_15px_rgba(0,174,239,0.15)]"
                      >
                        {generatingUser ? (
                          <span className="h-4 w-4 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                        ) : (
                          <>
                            <Plus className="h-4 w-4 stroke-[3]" />
                            <span>Gerar Novo Colaborador (Sequencial)</span>
                          </>
                        )}
                      </button>
                    ) : (
                      <div className="p-3.5 bg-red-950/25 border border-red-900/30 text-[11px] text-red-500 rounded-xl flex items-start gap-2">
                        <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
                        <span>Apenas o perfil máximo administrador (<span className="font-mono">Adm@01</span>) possui privilégios para gerar novas credenciais técnicos.</span>
                      </div>
                    )}
                  </div>

                  {/* Generated User Feedbacks Widget */}
                  {lastGeneratedUser && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-gradient-to-br from-indigo-950/20 to-black border border-indigo-500/30 rounded-2xl p-5 text-left text-balance"
                    >
                      <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-extrabold mb-3">
                        <Sparkles className="h-3.5 w-3.5 animate-pulse" />
                        <span>CREDENCIAL INICIALIZADA COM SUCESSO</span>
                      </div>

                      <p className="text-xs text-gray-400 leading-relaxed mb-4">
                        A matrícula foi inserida ativamente no catálogo de autenticações. Copie as informações abaixo e transmita de forma segura ao novo colaborador:
                      </p>

                      <div className="bg-black/50 rounded-xl p-3 border border-white/5 font-mono text-xs space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Usuário:</span>
                          <span className="text-[#00AEEF] font-bold">{lastGeneratedUser.username}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Senha Temporária:</span>
                          <span className="text-white font-bold">{lastGeneratedUser.password}</span>
                        </div>
                        <div className="flex justify-between border-t border-white/5 pt-2 mt-2 text-[11px]">
                          <span className="text-gray-500 font-sans">Nº Registro:</span>
                          <span className="text-indigo-400 font-bold">Matrícula {lastGeneratedUser.matricula}</span>
                        </div>
                      </div>

                      <button 
                        onClick={() => handleCopyCredentials(lastGeneratedUser)}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold font-sans transition-colors cursor-pointer ${copiedSuccess ? 'bg-green-600 text-white' : 'bg-white/10 hover:bg-white/20 text-white'}`}
                      >
                        {copiedSuccess ? (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Copiado com sucesso!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4" />
                            <span>Copiar Credenciais Técnicas</span>
                          </>
                        )}
                      </button>
                    </motion.div>
                  )}
                </div>

                {/* Directory Catalog grid list on right */}
                <div className="lg:col-span-7">
                  <div className="bg-[#0d0d10] border border-white/5 rounded-2xl p-6 text-left space-y-4">
                    <div>
                      <h3 className="text-lg font-bold text-white">Quadro de Colaboradores Admitidos</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        Mostra as contas operacionais vinculadas que possuem acesso a este painel operacional hoje.
                      </p>
                    </div>

                    <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                      {teamMembers.map((member) => (
                        <div 
                          key={member.username}
                          className="flex items-center justify-between p-4 bg-black/40 border border-white/5 hover:border-white/10 rounded-xl transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xs font-semibold text-[#00AEEF] uppercase font-mono">
                              {member.username.substring(0, 2)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-sm font-bold text-white">{member.username}</span>
                                {member.role === "admin" ? (
                                  <span className="text-[8px] bg-[#00AEEF]/15 border border-[#00AEEF]/30 text-[#00AEEF] font-bold px-1.5 py-0.5 rounded uppercase font-sans">Administrador Principal</span>
                                ) : (
                                  <span className="text-[8px] bg-white/5 border border-white/5 text-gray-400 font-bold px-1.5 py-0.5 rounded uppercase font-sans">Membro Técnico</span>
                                )}
                              </div>
                              <p className="text-[11px] text-gray-500 font-mono mt-0.5">
                                Matrícula: <span className="text-pink-400">{member.matricula}</span> • Admissão: {formatDate(member.createdAt)}
                              </p>
                              {currentUser.role === "admin" && (
                                <p className="text-[11px] text-gray-400 font-mono flex items-center gap-1.5 mt-1">
                                  <span>Painel de Senhas:</span>
                                  <span className="bg-white/5 border border-white/5 px-1.5 py-0.5 rounded text-white text-[10px] select-all font-bold tracking-wider">{member.password || "Uexo@"+member.matricula}</span>
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Delete capability if not superadmin account */}
                          {member.username.toLowerCase() !== "adm@01" && currentUser.role === "admin" && (
                            <button 
                              onClick={() => handleDeleteUser(member.username)}
                              className="p-2 bg-red-950/20 hover:bg-red-900/40 text-red-400 border border-red-900/20 rounded-xl transition-all cursor-pointer"
                              title={`Revogar admissão de ${member.username}`}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
}
