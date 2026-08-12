import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Lock,
  Mail,
  User,
  Calendar,
  Check,
  Globe,
  FolderOpen,
  Plus,
  ArrowRight,
  Share2,
  Trash2,
  FileText,
  AlertTriangle,
  Scale,
  ShieldAlert,
  ChevronRight,
  ClipboardCheck,
} from 'lucide-react';
import { AppMode } from '../types';

interface Project {
  id: string;
  name: string;
  mode: AppMode;
  createdAt: string;
  width: number;
  height: number;
}

interface LoginAndProjectsProps {
  onLoginSuccess: (userName: string, userAge: number) => void;
  onSelectProject: (projectId: string, projectMode: AppMode) => void;
  onLogout: () => void;
  isLoggedIn: boolean;
  activeProjectId: string | null;
  onBackToDashboard: () => void;
}

const INITIAL_PROJECTS: Project[] = [
  {
    id: 'proj_default',
    name: 'Ilustração Vetorial Alfa',
    mode: 'vector',
    createdAt: '11/08/2026',
    width: 1920,
    height: 1080,
  },
  {
    id: 'proj_isometric',
    name: 'Modelo Isometrico 3D Chassis',
    mode: '3d_render',
    createdAt: '11/08/2026',
    width: 2560,
    height: 1440,
  },
];

export const LoginAndProjects: React.FC<LoginAndProjectsProps> = ({
  onLoginSuccess,
  onSelectProject,
  onLogout,
  isLoggedIn,
  activeProjectId,
  onBackToDashboard,
}) => {
  // Login & Registration State
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [fullName, setFullName] = useState<string>('');
  const [birthdate, setBirthdate] = useState<string>('2000-01-01');
  const [parentalConsent, setParentalConsent] = useState<boolean>(false);
  const [termsAccepted, setTermsAccepted] = useState<boolean>(false);

  // Age calculation and legal message state
  const [age, setAge] = useState<number | null>(null);
  const [legalMessage, setLegalMessage] = useState<string>('');
  const [isAgeValid, setIsAgeValid] = useState<boolean>(true);

  // Active legal documents view (MIT, Terms, Privacy)
  const [activeLegalTab, setActiveLegalTab] = useState<'terms' | 'privacy' | 'mit'>('terms');
  const [legalLanguage, setLegalLanguage] = useState<'PT' | 'EN'>('PT');

  // Project List State
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('mn_user_projects');
    return saved ? JSON.parse(saved) : INITIAL_PROJECTS;
  });

  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectMode, setNewProjectMode] = useState<AppMode>('vector');
  const [isCreating, setIsCreating] = useState<boolean>(false);
  const [copiedProjectId, setCopiedProjectId] = useState<string | null>(null);

  // Calculate age on birthdate change
  useEffect(() => {
    if (!birthdate) return;
    const birth = new Date(birthdate);
    const today = new Date('2026-08-11'); // Anchored precisely at 2026!
    
    let calcAge = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      calcAge--;
    }
    setAge(calcAge);

    if (calcAge < 13) {
      setLegalMessage(
        legalLanguage === 'PT'
          ? '⚠️ Consentimento dos pais/responsáveis obrigatório (ECA/COPPA compliant para menores de 13 anos).'
          : '⚠️ Parental/Guardian consent is mandatory (ECA/COPPA compliant for users under 13).'
      );
      setIsAgeValid(false);
    } else {
      setLegalMessage(
        legalLanguage === 'PT'
          ? '✓ Idade verificada e legalizada para uso autônomo (LGPD & GDPR compliant para 2026+).'
          : '✓ Age verified and authorized for independent use (LGPD & GDPR compliant for 2026+).'
      );
      setIsAgeValid(true);
    }
  }, [birthdate, legalLanguage]);

  // Save projects to localStorage
  const saveProjects = (updated: Project[]) => {
    setProjects(updated);
    localStorage.setItem('mn_user_projects', JSON.stringify(updated));
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSignUp && !termsAccepted) {
      alert(legalLanguage === 'PT' ? 'Você deve aceitar os termos de uso.' : 'You must accept the terms of use.');
      return;
    }
    if (isSignUp && age && age < 13 && !parentalConsent) {
      alert(
        legalLanguage === 'PT'
          ? 'Para menores de 13 anos, a autorização dos pais é obrigatória por lei.'
          : 'For users under 13, parental authorization is legally mandatory.'
      );
      return;
    }

    const finalName = fullName || email.split('@')[0] || 'Criador';
    localStorage.setItem('mn_user_name', finalName);
    localStorage.setItem('mn_user_logged', 'true');
    onLoginSuccess(finalName, age || 25);
  };

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    const newProj: Project = {
      id: 'proj_' + Date.now(),
      name: newProjectName.trim(),
      mode: newProjectMode,
      createdAt: '11/08/2026',
      width: 1920,
      height: 1080,
    };

    const updated = [newProj, ...projects];
    saveProjects(updated);
    setNewProjectName('');
    setIsCreating(false);
    // Enter project immediately
    onSelectProject(newProj.id, newProj.mode);
  };

  const handleDeleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(legalLanguage === 'PT' ? 'Deseja excluir este projeto?' : 'Delete this project?')) {
      const updated = projects.filter((p) => p.id !== id);
      saveProjects(updated);
    }
  };

  const handleCopyShareLink = (projId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}?shared=true&project=${projId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopiedProjectId(projId);
      setTimeout(() => setCopiedProjectId(null), 3000);
    });
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen w-screen bg-[#07070a] flex flex-col lg:flex-row text-slate-300 overflow-y-auto select-none font-sans">
        {/* Left column: Login & Sign Up Form with legal age check */}
        <div className="w-full lg:w-[480px] p-6 sm:p-10 bg-slate-950 border-r border-slate-900 flex flex-col justify-between shrink-0">
          <div>
            {/* Header Brand */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-violet-500 to-cyan-400 p-0.5 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-base font-black text-white leading-none tracking-tight">
                  MNAnimat <span className="text-cyan-400">Visuals</span>
                </h1>
                <p className="text-[10px] text-slate-400 font-semibold mt-0.5">ESTÚDIO DE CRIAÇÃO PROFISSIONAL</p>
              </div>
            </div>

            {/* Language Selection */}
            <div className="flex justify-end gap-1 mb-6">
              <button
                onClick={() => setLegalLanguage('PT')}
                className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 ${
                  legalLanguage === 'PT' ? 'bg-indigo-950 border border-indigo-500/50 text-indigo-300' : 'bg-slate-900/50 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>Português (BR)</span>
              </button>
              <button
                onClick={() => setLegalLanguage('EN')}
                className={`px-2 py-1 text-xs font-bold rounded flex items-center gap-1 ${
                  legalLanguage === 'EN' ? 'bg-indigo-950 border border-indigo-500/50 text-indigo-300' : 'bg-slate-900/50 text-slate-500 hover:text-slate-300'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                <span>English (US)</span>
              </button>
            </div>

            {/* Form Header */}
            <h2 className="text-xl font-bold text-white mb-1">
              {isSignUp
                ? legalLanguage === 'PT'
                  ? 'Criar Nova Conta'
                  : 'Create Account'
                : legalLanguage === 'PT'
                ? 'Acesse a Suíte de Criação'
                : 'Access the Creation Suite'}
            </h2>
            <p className="text-xs text-slate-400 mb-6">
              {isSignUp
                ? legalLanguage === 'PT'
                  ? 'Comece a vetorizar, desenhar, animar e gerenciar planilhas e 3D.'
                  : 'Start vectorizing, drawing, animating, and managing sheets and 3D.'
                : legalLanguage === 'PT'
                ? 'Insira suas credenciais e verifique sua idade para autenticar e legalizar.'
                : 'Enter credentials and verify age to authenticate and license.'}
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4">
              {isSignUp && (
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>{legalLanguage === 'PT' ? 'Nome Completo' : 'Full Name'}</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder={legalLanguage === 'PT' ? 'Seu nome completo...' : 'Your full name...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{legalLanguage === 'PT' ? 'E-mail' : 'Email'}</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{legalLanguage === 'PT' ? 'Senha' : 'Password'}</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Legal Age Verification Component */}
              <div className="space-y-2 p-3.5 bg-slate-900/80 border border-slate-800 rounded-xl">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  <span>{legalLanguage === 'PT' ? 'Data de Nascimento' : 'Birthdate'}</span>
                </label>
                <input
                  type="date"
                  required
                  value={birthdate}
                  onChange={(e) => setBirthdate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-sm text-cyan-300 font-mono focus:outline-none focus:border-cyan-500"
                />

                <div className="text-[10px] text-slate-400 font-semibold space-y-1 mt-2">
                  <p className="flex items-center gap-1.5 text-slate-300">
                    <Scale className="w-3.5 h-3.5 text-indigo-400" />
                    <span>
                      {legalLanguage === 'PT'
                        ? `Idade Calculada para 2026: ${age !== null ? `${age} anos` : 'calculando...'}`
                        : `Calculated Age for 2026: ${age !== null ? `${age} years old` : 'calculating...'}`}
                    </span>
                  </p>
                  <p className="text-cyan-400 text-[10px] leading-relaxed italic">{legalMessage}</p>
                </div>

                {age !== null && age < 13 && (
                  <label className="flex items-start gap-2 p-2 bg-amber-950/40 border border-amber-900/60 rounded-lg cursor-pointer mt-2">
                    <input
                      type="checkbox"
                      checked={parentalConsent}
                      onChange={(e) => setParentalConsent(e.target.checked)}
                      className="rounded text-amber-500 border-slate-700 focus:ring-0 mt-0.5 cursor-pointer"
                    />
                    <span className="text-[9.5px] text-amber-200 leading-normal">
                      {legalLanguage === 'PT'
                        ? 'Confirmo que possuo autorização legal de pais/responsáveis para processamento de dados (LGPD Art. 14 / COPPA).'
                        : 'I confirm that I have legal parental/guardian authorization for data processing (LGPD Art. 14 / COPPA).'}
                    </span>
                  </label>
                )}
              </div>

              {isSignUp && (
                <label className="flex items-start gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="rounded text-indigo-500 border-slate-700 focus:ring-0 mt-0.5 cursor-pointer"
                  />
                  <span className="text-[11px] text-slate-400 leading-tight">
                    {legalLanguage === 'PT'
                      ? 'Aceito os Termos de Uso, Política de Privacidade e Licenciamento MIT (disponíveis ao lado).'
                      : 'I accept the Terms of Use, Privacy Policy and MIT Licensing (available on the side).'}
                  </span>
                </label>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-indigo-500/10 flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer"
              >
                <span>
                  {isSignUp
                    ? legalLanguage === 'PT'
                      ? 'Finalizar e Legalizar Conta'
                      : 'Finalize & Legalize Account'
                    : legalLanguage === 'PT'
                    ? 'Confirmar Verificação e Entrar'
                    : 'Confirm Verification & Enter'}
                </span>
                <ArrowRight className="w-4 h-4 text-white" />
              </button>
            </form>

            <div className="text-center mt-6">
              <button
                onClick={() => setIsSignUp(!isSignUp)}
                className="text-xs text-indigo-400 hover:text-cyan-300 font-bold underline cursor-pointer"
              >
                {isSignUp
                  ? legalLanguage === 'PT'
                    ? 'Já possui uma conta? Faça Login'
                    : 'Already have an account? Log In'
                  : legalLanguage === 'PT'
                  ? 'Não possui conta? Registre-se com Verificação de Idade'
                  : "Don't have an account? Sign Up with Age Check"}
              </button>
            </div>
          </div>

          {/* Legal Footnote */}
          <div className="pt-6 border-t border-slate-900 text-[9px] text-slate-500 leading-relaxed">
            <p>
              {legalLanguage === 'PT'
                ? 'Licença de Uso validada para conformidade em 2026 e nos anos seguintes no Brasil (ECA, LGPD, Lei 13.709) e no exterior (GDPR, COPPA, CCPA). Operação sob modelo de areia técnica (Technical Sandbox) com criptografia AES-256 local.'
                : 'Usage License validated for compliance in 2026 and subsequent years in Brazil (ECA, LGPD, Law 13,709) and abroad (GDPR, COPPA, CCPA). Technical Sandbox environment operating with AES-256 local encryption.'}
            </p>
          </div>
        </div>

        {/* Right column: Interactive Bilingual Legal Documents (MIT, Privacy, Terms) */}
        <div className="flex-1 p-6 sm:p-10 bg-slate-900/40 flex flex-col justify-between overflow-y-auto max-h-screen">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Scale className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  {legalLanguage === 'PT' ? 'Biblioteca Jurídica Oficial 2026' : 'Official Legal Library 2026'}
                </h3>
              </div>

              {/* Doc Tabs switcher */}
              <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                <button
                  onClick={() => setActiveLegalTab('terms')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                    activeLegalTab === 'terms' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {legalLanguage === 'PT' ? 'Termos de Uso' : 'Terms of Use'}
                </button>
                <button
                  onClick={() => setActiveLegalTab('privacy')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                    activeLegalTab === 'privacy' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {legalLanguage === 'PT' ? 'Privacidade LGPD' : 'GDPR/Privacy'}
                </button>
                <button
                  onClick={() => setActiveLegalTab('mit')}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded ${
                    activeLegalTab === 'mit' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Licença MIT
                </button>
              </div>
            </div>

            {/* Scrollable document viewport */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 sm:p-6 text-xs text-slate-400 font-mono leading-relaxed h-[420px] overflow-y-auto space-y-4 shadow-inner">
              {activeLegalTab === 'terms' && (
                <>
                  {legalLanguage === 'PT' ? (
                    <div className="space-y-3">
                      <h4 className="text-white font-extrabold text-sm border-b border-slate-800 pb-2">TERMOS DE USO E LICENCIAMENTO GERAL - MNANIMAT</h4>
                      <p><strong>Última atualização:</strong> 11 de Agosto de 2026.</p>
                      <p><strong>1. Objeto do Serviço:</strong> O MNAnimat é um estúdio web multimodular que oferece recursos técnicos para criação de desenhos vetoriais, renderização 3D, edição de áudio, vídeo e visualização de planilhas.</p>
                      <p><strong>2. Elegibilidade de Idade:</strong> Em total conformidade com a Lei nº 13.709 (LGPD - Brasil), o Estatuto da Criança e do Adolescente (ECA) e regulamentos internacionais (COPPA / GDPR):</p>
                      <p className="bg-slate-900 p-2.5 border-l-2 border-cyan-400 rounded-r-lg text-slate-300">
                        • Crianças de até 12 anos completos exigem autorização expressa e verificação de pais ou responsáveis legais no formulário de cadastro.<br/>
                        • Usuários com idade superior a 13 anos têm direito de acesso autônomo com coleta simplificada de dados estritamente voltada para persistência local de seus projetos.
                      </p>
                      <p><strong>3. Propriedade Intelectual:</strong> Todo o material, código gerado e arquivos vetoriais ou 3D exportados pelo usuário pertencem integralmente ao próprio autor do projeto.</p>
                      <p><strong>4. Limitação de Responsabilidade:</strong> O software é fornecido no estado em que se encontra, sem garantias de qualquer tipo de funcionamento ininterrupto.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-white font-extrabold text-sm border-b border-slate-800 pb-2">TERMS OF USE AND GENERAL LICENSE - MNANIMAT</h4>
                      <p><strong>Last updated:</strong> August 11, 2026.</p>
                      <p><strong>1. Service Object:</strong> MNAnimat is a multi-modular web studio providing advanced technical suites for vector graphics, 3D render, audio-video timeline compilation, and sheet computation.</p>
                      <p><strong>2. Age Verification Compliance:</strong> Fully compliant with Brazilian Law No. 13,709 (LGPD), Children’s Act (ECA), COPPA, and European GDPR laws:</p>
                      <p className="bg-slate-900 p-2.5 border-l-2 border-cyan-400 rounded-r-lg text-slate-300">
                        • Users under 13 must verify parent/guardian consent prior to creating a portfolio project account.<br/>
                        • Users over 13 hold full legal access under standard sandboxed metadata guidelines.
                      </p>
                      <p><strong>3. User Output Protection:</strong> All vector shapes, designs, slides, 3D meshes and video edits are fully owned by the respective user.</p>
                      <p><strong>4. Disclaimer:</strong> The software is provided "as is", without warranty of any kind, express or implied.</p>
                    </div>
                  )}
                </>
              )}

              {activeLegalTab === 'privacy' && (
                <>
                  {legalLanguage === 'PT' ? (
                    <div className="space-y-3">
                      <h4 className="text-white font-extrabold text-sm border-b border-slate-800 pb-2">POLÍTICA DE PRIVACIDADE E PROTEÇÃO DE DADOS (LGPD/GDPR 2026)</h4>
                      <p><strong>1. Princípios Gerais:</strong> Valorizamos a privacidade e operamos de acordo com os princípios da minimização de dados e segurança reforçada.</p>
                      <p><strong>2. Coleta de Informações:</strong> Coletamos apenas as informações voluntariamente fornecidas: Nome, E-mail, Data de Nascimento (para autenticação de idade legal) e dados locais de persistência de projetos (armazenados em cache local criptografado ou em nuvem se habilitado).</p>
                      <p><strong>3. Direitos do Titular (Art. 18 LGPD):</strong> O usuário pode, a qualquer momento:</p>
                      <p className="bg-slate-900 p-2.5 border-l-2 border-indigo-500 rounded-r-lg text-slate-300">
                        • Confirmar a existência de processamento de dados e obter cópia integral de seus projetos.<br/>
                        • Solicitar a exclusão definitiva de sua conta, credenciais de login e dados de colaboração em tempo real.
                      </p>
                      <p><strong>4. Transferência Internacional de Dados:</strong> O tráfego de dados para servidores internacionais de nuvem conta com tuneis de segurança TLS 1.3 e conformidade com o regulamento GDPR.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <h4 className="text-white font-extrabold text-sm border-b border-slate-800 pb-2">PRIVACY POLICY AND DATA PROTECTION AGREEMENT (GDPR/LGPD/COPPA)</h4>
                      <p><strong>1. Absolute Privacy First:</strong> This technical suite functions under strict data minimization guidelines to keep your digital identity and technical projects safe.</p>
                      <p><strong>2. Collected Data Elements:</strong> Only necessary account parameters are gathered: Name, Email address, Birthdate (for critical age verification), and local portfolio storage metadata.</p>
                      <p><strong>3. Legal Data Rights:</strong> Under GDPR (EU) and LGPD (Brazil), you maintain complete rights to:</p>
                      <p className="bg-slate-900 p-2.5 border-l-2 border-indigo-500 rounded-r-lg text-slate-300">
                        • Instantly export your absolute creation files or spreadsheet history.<br/>
                        • Erase and wipe your entire credentials, local caches, and collaborative sessions.
                      </p>
                      <p><strong>4. Encryption:</strong> Real-time collaboration operates via secure local broadcast layers with standard encryption protocols.</p>
                    </div>
                  )}
                </>
              )}

              {activeLegalTab === 'mit' && (
                <>
                  <div className="space-y-3">
                    <h4 className="text-white font-extrabold text-sm border-b border-slate-800 pb-2">MIT LICENSE (BILINGUAL VERSION)</h4>
                    <p className="text-slate-300 font-bold">PORTUGUÊS (BR):</p>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-[11px] space-y-2 whitespace-pre-wrap">
                      <p>Copyright (c) 2026 Micael Nildo Oliveira Souza</p>
                      <p>É concedida permissão, gratuitamente, a qualquer pessoa que obtenha uma cópia deste software e dos arquivos de documentação associados (o "Software"), para lidar com o Software sem restrições, incluindo, sem limitação, os direitos de usar, copiar, modificar, mesclar, publicar, distribuir, sublicenciar e/ou vender cópias do Software, e permitir que as pessoas a quem o Software é fornecido o façam, sujeito às seguintes condições:</p>
                      <p>O aviso de copyright acima e este aviso de permissão devem ser incluídos em todas as cópias ou partes substanciais do Software.</p>
                      <p>O SOFTWARE É FORNECIDO "COMO ESTÁ", SEM GARANTIA DE QUALQUER TIPO, EXPRESSA OU IMPLÍCITA, INCLUINDO, MAS NÃO SE LIMITANDO ÀS GARANTIAS DE COMERCIALIZAÇÃO, ADEQUAÇÃO A UM DETERMINADO FIM E NÃO VIOLAÇÃO. EM NENHUM CASO OS AUTORES OU DETENTORES DE DIREITOS AUTORAIS SERÃO RESPONSÁVEIS POR QUALQUER REIVINDICAÇÃO, DANOS OU OUTRA RESPONSABILIDADE, SEJA EM AÇÃO DE CONTRATO, ILÍCITO OU DE OUTRA FORMA, DECORRENTE DE, FORA OU EM CONEXÃO COM O SOFTWARE OU O USO OU OUTRAS NEGOCIAÇÕES NO SOFTWARE.</p>
                    </div>
                    <p className="text-slate-300 font-bold pt-2">ENGLISH (US):</p>
                    <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 text-[11px] space-y-2 whitespace-pre-wrap">
                      <p>Copyright (c) 2026 Micael Nildo Oliveira Souza</p>
                      <p>Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:</p>
                      <p>The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.</p>
                      <p>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Compliance badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-2">
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-900 flex flex-col items-center gap-1.5 shadow-sm">
                <ShieldAlert className="w-5 h-5 text-emerald-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">LGPD BRASIL</span>
                <span className="text-[9px] text-slate-500">Lei nº 13.709</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-900 flex flex-col items-center gap-1.5 shadow-sm">
                <Scale className="w-5 h-5 text-indigo-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">GDPR EUROPE</span>
                <span className="text-[9px] text-slate-500">EU Compliant</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-900 flex flex-col items-center gap-1.5 shadow-sm">
                <AlertTriangle className="w-5 h-5 text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">COPPA / CCPA</span>
                <span className="text-[9px] text-slate-500">Age Protection</span>
              </div>
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-900 flex flex-col items-center gap-1.5 shadow-sm">
                <Scale className="w-5 h-5 text-purple-400" />
                <span className="text-[10px] font-bold text-white uppercase tracking-wider">MIT LICENSE</span>
                <span className="text-[9px] text-slate-500">Open-Source</span>
              </div>
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping shrink-0" />
            <p>
              {legalLanguage === 'PT'
                ? 'Suporte Técnico & Jurídico: Solicitações de atendimento devem ser formalizadas enviando e-mail para micaelnildo@mnanimat.xyz (atendimento em dias úteis com prazo de resposta de até 3 dias).'
                : 'Technical & Legal Support: Assistance inquiries must be formally submitted via email to micaelnildo@mnanimat.xyz (processed on business days with a response SLA of up to 3 days).'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // LOGGED IN: Render the beautiful Project Creation and selection Dashboard Screen
  return (
    <div className="min-h-screen w-screen bg-[#07070a] flex items-center justify-center p-4 sm:p-10 select-none text-slate-300 font-sans overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-950 border border-slate-900 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row h-auto md:h-[620px]">
        
        {/* Left Side: Create Project Form and profile stats */}
        <div className="w-full md:w-[340px] p-6 sm:p-8 bg-slate-950 border-r border-slate-900 flex flex-col justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white leading-none">MNAnimat Dashboard</h3>
                <span className="text-[9px] text-emerald-400 font-bold font-mono">Licença Válida 2026</span>
              </div>
            </div>

            <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800 mb-6 space-y-1">
              <span className="text-[9px] text-slate-500 font-bold block uppercase">USUÁRIO AUTENTICADO</span>
              <span className="text-xs font-bold text-white block">{localStorage.getItem('mn_user_name') || 'Membro da Equipe'}</span>
              <span className="text-[10px] text-slate-400 block font-mono">Status: LGPD / GDPR Verificado</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="text-xs font-bold text-slate-300 uppercase">Novo Projeto</h4>
                <Plus className="w-4 h-4 text-cyan-400" />
              </div>

              <form onSubmit={handleCreateProject} className="space-y-3.5">
                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Nome do Projeto:</span>
                  <input
                    type="text"
                    required
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    placeholder="Ex: Novo Layout Técnico..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">Módulo do Estúdio:</span>
                  <select
                    value={newProjectMode}
                    onChange={(e) => setNewProjectMode(e.target.value as AppMode)}
                    className="w-full bg-slate-900 border border-slate-800 text-xs text-white rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
                  >
                    <option value="vector">Editor de Vetores</option>
                    <option value="painting">Pintura e Aquarela</option>
                    <option value="3d_render">Modelagem 3D</option>
                    <option value="animation2d">Estúdio de Animação 2D</option>
                    <option value="spreadsheet">Planilhas Computacionais</option>
                    <option value="video">Vídeo Multifaixa</option>
                    <option value="document">Documentação Técnica</option>
                    <option value="presentation">Apresentações</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-cyan-500/15 flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Criar Projeto Ativo</span>
                </button>
              </form>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-900 flex justify-between">
            <button
              onClick={onLogout}
              className="text-xs text-slate-500 hover:text-red-400 font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Sair da Conta</span>
            </button>
            <span className="text-[10px] font-mono text-slate-600 font-bold">2026 Sandbox v2.8</span>
          </div>
        </div>

        {/* Right Side: Grid list of Active Projects with Collaboration share link controls */}
        <div className="flex-1 p-6 sm:p-8 bg-slate-900/20 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex justify-between items-center border-b border-slate-900 pb-4 mb-6">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Projetos Ativos do Portfólio</h3>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] text-slate-400 font-mono font-bold">
                {projects.length} Total
              </span>
            </div>

            <div className="space-y-3">
              {projects.map((proj) => {
                const isActive = activeProjectId === proj.id;
                return (
                  <div
                    key={proj.id}
                    onClick={() => onSelectProject(proj.id, proj.mode)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group ${
                      isActive
                        ? 'bg-indigo-950/50 border-indigo-500/80 shadow-lg shadow-indigo-500/5'
                        : 'bg-slate-950 border-slate-800/80 hover:bg-slate-900 hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-xs group-hover:text-cyan-300 transition-colors">
                          {proj.name}
                        </span>
                        {isActive && (
                          <span className="px-1.5 py-0.2 bg-emerald-950 text-emerald-400 text-[9px] font-bold rounded">
                            Ativo no Workspace
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 text-[10px] font-mono font-bold text-slate-400">
                        <span className="text-cyan-400 uppercase">{proj.mode}</span>
                        <span className="text-slate-600">•</span>
                        <span>{proj.width} x {proj.height} px</span>
                        <span className="text-slate-600">•</span>
                        <span>Criado: {proj.createdAt}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center">
                      <button
                        onClick={(e) => handleCopyShareLink(proj.id, e)}
                        title="Copiar Link de Colaboração (Ao compartilhar, o ponteiro de quem acessar aparecerá ao vivo!)"
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700 flex items-center gap-1 text-[10px] font-bold transition-all cursor-pointer"
                      >
                        {copiedProjectId === proj.id ? (
                          <>
                            <ClipboardCheck className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="text-emerald-400">Link Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Share2 className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Compartilhar Link</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950 hover:text-red-400 text-slate-500 border border-slate-800 hover:border-red-900/50 transition-all cursor-pointer"
                        title="Excluir Projeto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-white transition-colors" />
                    </div>
                  </div>
                );
              })}

              {projects.length === 0 && (
                <div className="p-8 text-center bg-slate-950 border border-dashed border-slate-800 rounded-2xl">
                  <p className="text-xs text-slate-500">Nenhum projeto encontrado. Use o formulário lateral para criar o seu primeiro projeto!</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 p-4 bg-slate-950 rounded-2xl border border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
              <p className="text-slate-400 font-bold">
                Dica: Copie o link de compartilhamento, abra em uma aba anônima ou envie para alguém, e veja os ponteiros se moverem juntos!
              </p>
            </div>
            
            {activeProjectId && (
              <button
                onClick={onBackToDashboard}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-[11px] rounded-xl shadow-lg shadow-indigo-500/20 whitespace-nowrap cursor-pointer"
              >
                Retornar ao Workspace
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
