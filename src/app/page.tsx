"use client";

import { useMemo } from "react";
import {
  SessionProvider,
  useSession,
  RoomAudioRenderer,
} from "@livekit/components-react";
import { TokenSource } from "livekit-client";
import { VoiceUI } from "@/lib/components/VoiceUI";

/**
 * Minimal voice pipeline:
 *   1. Create a token source pointing at your connection endpoint
 *   2. Establish a session with useSession
 *   3. Wrap in SessionProvider so child components can access the room
 *   4. Render RoomAudioRenderer to play agent audio
 *   5. Render your UI (VoiceUI handles all interaction + GenUI display)
 */
export default function VoicePage() {
  const tokenSource = useMemo(
    () => TokenSource.endpoint("/api/connection-details"),
    [],
  );
  const session = useSession(tokenSource);

  return (
    <SessionProvider session={session}>
      <RoomAudioRenderer />
      <VoiceUI />
    </SessionProvider>
  );
}
