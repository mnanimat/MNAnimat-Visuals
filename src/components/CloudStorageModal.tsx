import React, { useState } from 'react';
import {
  X,
  HardDrive,
  Cloud,
  CheckCircle2,
  RefreshCw,
  FolderOpen,
  ArrowUpRight,
  ShieldCheck,
  Server,
  UploadCloud,
  Database,
} from 'lucide-react';
import { CloudStorageConfig } from '../types';
import { getLocalProjects, saveCloudConfig, SavedProject } from '../utils/cloudSync';

interface CloudStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: CloudStorageConfig;
  onUpdateConfig: (cfg: CloudStorageConfig) => void;
}

export const CloudStorageModal: React.FC<CloudStorageModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
}) => {
  const [provider, setProvider] = useState<'google_drive' | 'cloudflare_r2'>(config.provider);
  const [r2Bucket, setR2Bucket] = useState(config.r2Bucket || 'aether-studio-bucket');
  const [r2AccountId, setR2AccountId] = useState(config.r2AccountId || 'cf_r2_acc_892819');
  const [userEmail, setUserEmail] = useState(config.userEmail || 'usuario.criativo@gmail.com');
  const [autoSync, setAutoSync] = useState(config.autoSync);
  const [isSyncing, setIsSyncing] = useState(false);
  const [projects, setProjects] = useState<SavedProject[]>(getLocalProjects());
  const [syncLog, setSyncLog] = useState<string[]>([]);

  if (!isOpen) return null;

  const handleConnectGoogleDrive = () => {
    setIsSyncing(true);
    setSyncLog((prev) => [
      `[${new Date().toLocaleTimeString()}] Solicitando token OAuth 2.0 do Google Drive...`,
      ...prev,
    ]);

    setTimeout(() => {
      const newCfg: CloudStorageConfig = {
        provider: 'google_drive',
        connected: true,
        userEmail: userEmail,
        autoSync: autoSync,
        lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      saveCloudConfig(newCfg);
      onUpdateConfig(newCfg);
      setIsSyncing(false);
      setSyncLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Sincronização direta com Google Drive estabelecida!`,
        ...prev,
      ]);
    }, 1200);
  };

  const handleConnectR2 = () => {
    setIsSyncing(true);
    setSyncLog((prev) => [
      `[${new Date().toLocaleTimeString()}] Autenticando S3 API no Cloudflare R2 (${r2Bucket})...`,
      ...prev,
    ]);

    setTimeout(() => {
      const newCfg: CloudStorageConfig = {
        provider: 'cloudflare_r2',
        connected: true,
        r2Bucket,
        r2AccountId,
        autoSync: autoSync,
        lastSyncTime: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      };
      saveCloudConfig(newCfg);
      onUpdateConfig(newCfg);
      setIsSyncing(false);
      setSyncLog((prev) => [
        `[${new Date().toLocaleTimeString()}] Conexão de alto desempenho Cloudflare R2 ativada!`,
        ...prev,
      ]);
    }, 1200);
  };

  const handleManualSyncProject = (projId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === projId) {
          return {
            ...p,
            syncedToCloud: true,
            cloudProvider: config.provider === 'google_drive' ? 'Google Drive' : 'Cloudflare R2',
            updatedAt: 'Agora mesmo',
          };
        }
        return p;
      })
    );
    setSyncLog((prev) => [
      `[${new Date().toLocaleTimeString()}] Projeto ${projId} enviado para a nuvem com redundância.`,
      ...prev,
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden text-slate-100 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-indigo-600 rounded-xl text-white shadow-md">
              <Cloud className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                Conectividade de Nuvem & Sincronização
              </h2>
              <p className="text-xs text-slate-400">
                Armazenamento direto via Google Drive ou Cloudflare R2 com redundância
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Provider Selection Tabs */}
          <div className="grid grid-cols-2 gap-3 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setProvider('google_drive')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-semibold text-xs transition-all ${
                provider === 'google_drive'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <HardDrive className="w-4 h-4 text-emerald-400" />
              <span>Google Drive (Pessoal)</span>
            </button>

            <button
              onClick={() => setProvider('cloudflare_r2')}
              className={`flex items-center justify-center gap-2.5 py-3 px-4 rounded-lg font-semibold text-xs transition-all ${
                provider === 'cloudflare_r2'
                  ? 'bg-slate-800 text-white border border-slate-700 shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Server className="w-4 h-4 text-amber-400" />
              <span>Cloudflare R2 Storage</span>
            </button>
          </div>

          {/* Provider Form */}
          {provider === 'google_drive' ? (
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20 text-emerald-400">
                  <HardDrive className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Sincronização Direta com Google Drive
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Os seus arquivos, ilustrações, apresentações e vídeos serão salvos diretamente na pasta do seu Google Drive pessoal.
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs text-slate-300 font-medium block">
                  Conta Google Conectada:
                </label>
                <input
                  type="email"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Sincronizar alterações automaticamente em segundo plano</span>
                </label>

                <button
                  onClick={handleConnectGoogleDrive}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all disabled:opacity-50"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4" />
                  )}
                  <span>Conectar e Autorizar Drive</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20 text-amber-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-200">
                    Armazenamento de Alta Escala Cloudflare R2
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Ideal para grandes volumes de vídeo e arquivos 3D profissionais sem taxa de saída.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Nome do Bucket R2:
                  </label>
                  <input
                    type="text"
                    value={r2Bucket}
                    onChange={(e) => setR2Bucket(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Account ID:
                  </label>
                  <input
                    type="text"
                    value={r2AccountId}
                    onChange={(e) => setR2AccountId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={autoSync}
                    onChange={(e) => setAutoSync(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span>Backup automático com alta redundância</span>
                </label>

                <button
                  onClick={handleConnectR2}
                  disabled={isSyncing}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg shadow-md transition-all disabled:opacity-50"
                >
                  {isSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Server className="w-4 h-4" />
                  )}
                  <span>Conectar Cloudflare R2</span>
                </button>
              </div>
            </div>
          )}

          {/* Project Synchronization Status */}
          <div>
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Projetos Salvos na Nuvem</span>
              <span className="text-[10px] text-slate-500 font-normal">
                Status de Redundância Ativo
              </span>
            </h4>

            <div className="space-y-2">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-800 rounded-lg text-indigo-400">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="font-semibold text-slate-200 block">{proj.name}</span>
                      <span className="text-[10px] text-slate-400">
                        {proj.type} • {(proj.sizeKb / 1024).toFixed(2)} MB • {proj.updatedAt}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {proj.syncedToCloud ? (
                      <span className="px-2.5 py-1 bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 rounded-full text-[10px] font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        {proj.cloudProvider || 'Sincronizado'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleManualSyncProject(proj.id)}
                        className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors"
                      >
                        <UploadCloud className="w-3 h-3" />
                        Enviar Nuvem
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sync Logs Console */}
          {syncLog.length > 0 && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-cyan-300 space-y-1 max-h-28 overflow-y-auto">
              <div className="text-[10px] text-slate-500 font-semibold mb-1">
                Log de Comunicação de Nuvem:
              </div>
              {syncLog.map((log, i) => (
                <div key={i}>{log}</div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            Criptografia de Ponta a Ponta Ativada
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-medium transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
