import React, { useEffect, useState, useRef } from 'react';
import { MousePointer2, Sparkles, Eye, EyeOff, Radio } from 'lucide-react';
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
  isSimulated?: boolean;
}

interface CollaborativeCursorsProps {
  currentMode: AppMode;
  enabled?: boolean;
  onToggleEnabled?: () => void;
}

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({
  currentMode,
  enabled = true,
  onToggleEnabled,
}) => {
  const [remoteUsers, setRemoteUsers] = useState<Record<string, RemoteUser>>({});
  const [clickRipples, setClickRipples] = useState<
    { id: string; x: number; y: number; color: string }[]
  >([]);
  const wsRef = useRef<WebSocket | null>(null);
  const animRef = useRef<number | null>(null);

  // Simulated collaborators when alone to demonstrate real-time indicators
  const simulatedRef = useRef<{
    user1: RemoteUser;
    user2: RemoteUser;
    angle1: number;
    angle2: number;
  }>({
    user1: {
      id: 'sim_ana',
      name: 'Ana (Design UX)',
      color: '#06b6d4',
      x: 350,
      y: 220,
      mode: 'vector',
      activeTool: 'Pen Bézier',
      isSimulated: true,
    },
    user2: {
      id: 'sim_carlos',
      name: 'Carlos (3D & FX)',
      color: '#ec4899',
      x: 620,
      y: 380,
      mode: '3d_render',
      activeTool: 'Texturas PBR',
      isSimulated: true,
    },
    angle1: 0,
    angle2: Math.PI / 2,
  });

  // Track mouse position and send over WebSocket
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX;
      const y = e.clientY;

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'cursor',
            x,
            y,
            mode: currentMode,
            activeTool: 'Ponteiro',
          })
        );
      }
    };

    const handleClick = (e: MouseEvent) => {
      // Create subtle local click ripple for feedback
      const rippleId = Math.random().toString();
      setClickRipples((prev) => [
        ...prev.slice(-10),
        { id: rippleId, x: e.clientX, y: e.clientY, color: '#38bdf8' },
      ]);
      setTimeout(() => {
        setClickRipples((prev) => prev.filter((r) => r.id !== rippleId));
      }, 800);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('click', handleClick);
    };
  }, [currentMode, enabled]);

  // Establish WebSocket Connection
  useEffect(() => {
    if (!enabled) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws/collaborate`;

    try {
      const socket = new WebSocket(wsUrl);
      wsRef.current = socket;

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'cursor_update') {
            setRemoteUsers((prev) => ({
              ...prev,
              [data.id]: {
                id: data.id,
                name: data.name || 'Colaborador',
                color: data.color || '#3b82f6',
                x: data.x,
                y: data.y,
                mode: data.mode,
                activeTool: data.activeTool,
                lastUpdated: Date.now(),
              },
            }));
          } else if (data.type === 'presence') {
            const list = data.users || [];
            const newUsersMap: Record<string, RemoteUser> = {};
            list.forEach((u: any) => {
              newUsersMap[u.id] = {
                id: u.id,
                name: u.name,
                color: u.color,
                x: u.x,
                y: u.y,
                mode: u.mode,
                activeTool: u.activeTool,
                lastUpdated: Date.now(),
              };
            });
            setRemoteUsers(newUsersMap);
          }
        } catch (err) {
          // parse error
        }
      };

      return () => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close();
        }
      };
    } catch (e) {
      console.warn('WebSocket connection fallback:', e);
    }
  }, [enabled]);

  // Smooth animation loop for simulated team cursors when single-user
  useEffect(() => {
    if (!enabled) return;

    let lastTime = performance.now();
    const updateSimulated = (now: number) => {
      const delta = (now - lastTime) / 1000;
      lastTime = now;

      simulatedRef.current.angle1 += delta * 0.8;
      simulatedRef.current.angle2 += delta * 0.6;

      const a1 = simulatedRef.current.angle1;
      const a2 = simulatedRef.current.angle2;

      // Lissajous curve paths across workspace
      const x1 = Math.round(450 + Math.sin(a1) * 220 + Math.cos(a1 * 0.5) * 80);
      const y1 = Math.round(280 + Math.cos(a1 * 1.2) * 140);

      const x2 = Math.round(750 + Math.cos(a2 * 0.7) * 200);
      const y2 = Math.round(420 + Math.sin(a2 * 1.1) * 160);

      simulatedRef.current.user1.x = x1;
      simulatedRef.current.user1.y = y1;
      simulatedRef.current.user2.x = x2;
      simulatedRef.current.user2.y = y2;

      // Randomly spawn a click ripple for simulated collaborators
      if (Math.random() < 0.008) {
        const rippleId = Math.random().toString();
        setClickRipples((prev) => [
          ...prev.slice(-10),
          { id: rippleId, x: x1, y: y1, color: simulatedRef.current.user1.color },
        ]);
        setTimeout(() => {
          setClickRipples((prev) => prev.filter((r) => r.id !== rippleId));
        }, 800);
      }

      animRef.current = requestAnimationFrame(updateSimulated);
    };

    animRef.current = requestAnimationFrame(updateSimulated);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [enabled]);

  if (!enabled) return null;

  // Combine real WebSocket users + simulated users if fewer than 2 real users
  const realUsersList = Object.values(remoteUsers);
  const displayUsers: RemoteUser[] =
    realUsersList.length >= 2
      ? realUsersList
      : [
          ...realUsersList,
          simulatedRef.current.user1,
          simulatedRef.current.user2,
        ];

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none">
      {/* Click Ripples */}
      {clickRipples.map((ripple) => (
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

      {/* Collaborator Mouse Cursors */}
      {displayUsers.map((user) => (
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
            <Radio className="w-2.5 h-2.5 animate-pulse" />
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
