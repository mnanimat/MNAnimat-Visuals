import React, { useEffect, useState, useRef } from 'react';
import { MousePointer2, Sparkles, Radio } from 'lucide-react';
import { AppMode } from '../types';

export interface RemoteUser {
  id: string;
  name: string;
  color: string;
  x: number;
  y: number;
  mode?: AppMode;
  activeTool?: string;
  lastUpdated?: number;
}

interface CollaborativeCursorsProps {
  currentMode: AppMode;
  enabled?: boolean;
  onToggleEnabled?: () => void;
  projectId: string;
  onCollaboratorsChange?: (collaborators: any[]) => void;
}

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({
  currentMode,
  enabled = true,
  projectId,
  onCollaboratorsChange,
}) => {
  const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUser>>({});
  const [clickRipples, setClickRipples] = useState<
    { id: string; x: number; y: number; color: string }[]
  >([]);
  
  const myIdRef = useRef<string>('');
  const myNameRef = useRef<string>('');
  const myColorRef = useRef<string>('');

  const channelRef = useRef<BroadcastChannel | null>(null);

  // Initialize refs on component mount
  useEffect(() => {
    let savedId = localStorage.getItem('mn_my_collab_id');
    if (!savedId) {
      savedId = 'user_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('mn_my_collab_id', savedId);
    }
    myIdRef.current = savedId;

    const urlParams = new URLSearchParams(window.location.search);
    const isShared = urlParams.get('shared') === 'true';
    if (isShared) {
      myNameRef.current = 'Visitante Técnico (Remoto)';
      myColorRef.current = '#10b981';
    } else {
      const savedUser = localStorage.getItem('mn_user_name');
      myNameRef.current = savedUser ? `${savedUser} (Autor)` : 'Membro da Equipe';
      myColorRef.current = '#ec4899';
    }
  }, []);

  // Initialize Broadcast Channel
  useEffect(() => {
    if (!enabled || !projectId) return;

    try {
      const channel = new BroadcastChannel(`mnanimat_collab_cursors_${projectId}`);
      channelRef.current = channel;

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || data.senderId === myIdRef.current) return;

        if (data.type === 'cursor_move') {
          setRemoteUsers((prev) => ({
            ...prev,
            [data.senderId]: {
              id: data.senderId,
              name: data.name,
              color: data.color,
              x: data.x,
              y: data.y,
              mode: data.mode,
              activeTool: data.activeTool,
              lastUpdated: Date.now(),
            },
          }));
        } else if (data.type === 'click_event') {
          const rippleId = Math.random().toString();
          setClickRipples((prev) => [
            ...prev.slice(-10),
            { id: rippleId, x: data.x, y: data.y, color: data.color },
          ]);
          setTimeout(() => {
            setClickRipples((prev) => prev.filter((r) => r.id !== rippleId));
          }, 800);
        }
      };

      return () => {
        channel.close();
      };
    } catch (e) {
      console.warn('BroadcastChannel not supported or failed:', e);
    }
  }, [enabled, projectId]);

  useEffect(() => {
    if (onCollaboratorsChange) {
      const activeCollaborators = Object.values(remoteUsers).map((u: RemoteUser) => ({
        id: u.id,
        name: u.name,
        color: u.color,
        avatar: u.name.substring(0, 2).toUpperCase(),
        role: 'Colaborador',
        currentMode: u.mode,
        activeTool: u.activeTool,
      }));
      onCollaboratorsChange(activeCollaborators);
    }
  }, [remoteUsers, onCollaboratorsChange]);

  // Broadcast own mouse movements
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'cursor_move',
          senderId: myIdRef.current,
          name: myNameRef.current,
          color: myColorRef.current,
          x: e.clientX,
          y: e.clientY,
          mode: currentMode,
          activeTool: 'Ponteiro Ativo',
        });
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Local ripple feedback
      const rippleId = Math.random().toString();
      setClickRipples((prev) => [
        ...prev.slice(-10),
        { id: rippleId, x: e.clientX, y: e.clientY, color: myColorRef.current },
      ]);
      setTimeout(() => {
        setClickRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 800);

      // Broadcast click event
      if (channelRef.current) {
        channelRef.current.postMessage({
          type: 'click_event',
          senderId: myIdRef.current,
          color: myColorRef.current,
          x: e.clientX,
          y: e.clientY,
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [currentMode, enabled]);

  // Clean stale cursors (inactive for > 4 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setRemoteUsers((prev) => {
        const updated = { ...prev };
        let changed = false;
        Object.keys(updated).forEach((id) => {
          if (now - (updated[id].lastUpdated || 0) > 4000) {
            delete updated[id];
            changed = true;
          }
        });
        return changed ? updated : prev;
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  if (!enabled) return null;

  const displayUsers: RemoteUser[] = Object.values(remoteUsers);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* Click Ripples */}
      {clickRipples.map((ripple: { id: string; x: number; y: number; color: string }) => (
        <div
          key={ripple.id}
          className="absolute rounded-full border-2 animate-ping pointer-events-none"
          style={{
            left: ripple.x - 20,
            top: ripple.y - 20,
            width: 40,
            height: 40,
            borderColor: ripple.color,
            boxShadow: `0 0 15px ${ripple.color}`,
          }}
        />
      ))}

      {/* Real-time active cursors */}
      {displayUsers.map((user: RemoteUser) => (
        <div
          key={user.id}
          className="absolute transition-all duration-75 ease-out flex flex-col items-start"
          style={{
            transform: `translate3d(${user.x}px, ${user.y}px, 0)`,
          }}
        >
          {/* Custom Colored Cursor Pointer */}
          <div className="relative drop-shadow-md">
            <MousePointer2
              className="w-5 h-5 -rotate-45"
              style={{
                color: user.color,
                fill: user.color,
                filter: `drop-shadow(0 2px 6px ${user.color}88)`,
              }}
            />
            <span
              className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: user.color }}
            />
          </div>

          {/* User Badge Tag */}
          <div
            className="mt-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-white shadow-lg flex items-center gap-1.5 backdrop-blur-md border border-white/20 whitespace-nowrap"
            style={{ backgroundColor: user.color }}
          >
            <Radio className="w-2.5 h-2.5 animate-pulse text-white" />
            <span>{user.name}</span>
            {user.activeTool && (
              <span className="opacity-80 font-normal border-l border-white/30 pl-1">
                {user.activeTool}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
