'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { LiveKitRoom, useLocalParticipant, useRoomContext } from '@livekit/components-react';
import ScreenshareAnnotationOverlay from '../../components/classroom/ScreenshareAnnotationOverlay';

function OverlayContent() {
  const room = useRoomContext();
  const { localParticipant } = useLocalParticipant();

  if (!room || !localParticipant) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-black/40 text-white font-sans">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent animate-spin rounded-full mx-auto" />
          <p className="text-sm">Connecting to annotation session...</p>
        </div>
      </div>
    );
  }

  // Standalone desktop-overlay: isTeacher=true, isAllowedToAnnotate=true.
  // Passing null for screenShareTrack enables full-screen transparent canvas mode.
  return (
    <div className="w-screen h-screen relative overflow-hidden bg-transparent select-none">
      <ScreenshareAnnotationOverlay
        room={room}
        localParticipant={localParticipant}
        isTeacher={true}
        isAllowedToAnnotate={true}
        screenShareTrack={null}
        editor={null} // Whiteboard export disabled in standalone overlay (takes screenshots of actual desktop screen instead)
      />
    </div>
  );
}

function SearchParamsLoader({ 
  onLoaded 
}: { 
  onLoaded: (data: { room: string; token: string; serverUrl: string }) => void 
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const room = searchParams.get('room') || '';
    const token = searchParams.get('token') || '';
    const serverUrl = searchParams.get('server') || '';

    if (room && token && serverUrl) {
      onLoaded({ room, token, serverUrl });
    }
  }, [searchParams, onLoaded]);

  return null;
}

export default function DesktopOverlayPage() {
  const [params, setParams] = useState<{ room: string; token: string; serverUrl: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Timeout to verify parameters
    const t = setTimeout(() => {
      if (!params) {
        setError('Missing query parameters (room, token, server). Paste a valid companion URL.');
      }
    }, 5000);
    return () => clearTimeout(t);
  }, [params]);

  if (error && !params) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-900 text-red-400 font-sans p-6 text-center">
        <div className="space-y-2 max-w-md">
          <svg className="w-12 h-12 text-red-500 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <h2 className="text-lg font-semibold">Connection Failed</h2>
          <p className="text-sm text-zinc-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="w-screen h-screen flex items-center justify-center bg-zinc-900 text-white font-sans">
        <p className="text-sm">Loading session parameters...</p>
      </div>
    }>
      <SearchParamsLoader onLoaded={setParams} />
      {params && (
        <LiveKitRoom
          token={params.token}
          serverUrl={params.serverUrl}
          connect={true}
          style={{ width: '100vw', height: '100vh', backgroundColor: 'transparent' }}
        >
          <OverlayContent />
        </LiveKitRoom>
      )}
    </Suspense>
  );
}
