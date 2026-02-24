import { NextResponse } from "next/server";
import {
  AccessToken,
  type AccessTokenOptions,
  type VideoGrant,
} from "livekit-server-sdk";
import { RoomConfiguration } from "@livekit/protocol";

type ConnectionDetails = {
  serverUrl: string;
  roomName: string;
  participantName: string;
  participantToken: string;
};

const API_KEY = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;
const LIVEKIT_URL = process.env.LIVEKIT_URL;

export const revalidate = 0;

export async function POST() {
  if (!LIVEKIT_URL || !API_KEY || !API_SECRET) {
    return new NextResponse(
      "Missing LIVEKIT_URL, LIVEKIT_API_KEY, or LIVEKIT_API_SECRET",
      { status: 500 }
    );
  }

  const participantName = "user";
  const participantIdentity = `user_${Math.floor(Math.random() * 10_000)}`;
  const roomName = `voice_genui_room_${Math.floor(Math.random() * 10_000)}`;

  const participantToken = await createParticipantToken(
    { identity: participantIdentity, name: participantName },
    roomName
  );

  const data: ConnectionDetails = {
    serverUrl: LIVEKIT_URL,
    roomName,
    participantToken,
    participantName,
  };

  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

function createParticipantToken(
  userInfo: AccessTokenOptions,
  roomName: string
): Promise<string> {
  const at = new AccessToken(API_KEY, API_SECRET, {
    ...userInfo,
    ttl: "15m",
  });

  const grant: VideoGrant = {
    room: roomName,
    roomJoin: true,
    canPublish: true,
    canPublishData: true,
    canSubscribe: true,
  };
  at.addGrant(grant);

  at.roomConfig = new RoomConfiguration({
    agents: [{ agentName: "voice-genui-agent" }],
  });

  return at.toJwt();
}
