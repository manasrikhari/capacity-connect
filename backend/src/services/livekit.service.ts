import { AccessToken, VideoGrant } from 'livekit-server-sdk';
import { ENV } from '../config/env';
import { roomServiceClient, webhookReceiver } from '../config/livekit';
import { db } from '../config/db';
import { Role } from '@prisma/client';

export class LivekitService {
  /**
   * Generate a secure WebRTC Access Token for LiveKit Cloud
   */
  static async generateToken(params: {
    roomId: string;
    userId: string;
    userName: string;
    role: Role;
  }) {
    const isHost = params.role === Role.TRAINER || params.role === Role.ADMIN || params.role === Role.SUPER_ADMIN;

    const at = new AccessToken(ENV.LIVEKIT_API_KEY, ENV.LIVEKIT_API_SECRET, {
      identity: params.userId,
      name: params.userName,
      ttl: '4h',
      metadata: JSON.stringify({
        userId: params.userId,
        role: params.role,
        isHost,
      }),
    });

    const grant: VideoGrant = {
      room: params.roomId,
      roomJoin: true,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      roomAdmin: isHost,
      roomCreate: isHost,
    };

    at.addGrant(grant);

    const token = await at.toJwt();

    return {
      token,
      livekitUrl: ENV.LIVEKIT_URL,
      roomId: params.roomId,
      participant: {
        id: params.userId,
        name: params.userName,
        isHost,
        role: params.role,
      },
    };
  }

  /**
   * Start or create a live training classroom session
   */
  static async startSession(programId: string, title: string) {
    const roomId = `room-${programId.slice(-6)}-${Date.now().toString().slice(-4)}`;

    const session = await db.liveSession.create({
      data: {
        programId,
        roomId,
        title,
        status: 'LIVE',
        scheduledStart: new Date(),
        scheduledEnd: new Date(Date.now() + 2 * 60 * 60 * 1000), // default 2 hrs
        actualStart: new Date(),
      },
    });

    return session;
  }

  /**
   * End a live session and mark as completed
   */
  static async endSession(roomId: string) {
    try {
      await roomServiceClient.deleteRoom(roomId);
    } catch (e) {
      console.warn(`[LiveKit Warning] Failed to explicitly delete room on LiveKit server: ${e}`);
    }

    return db.liveSession.update({
      where: { roomId },
      data: {
        status: 'COMPLETED',
        actualEnd: new Date(),
      },
    });
  }

  /**
   * Process LiveKit Webhooks
   */
  static async handleWebhook(body: string | Buffer, authHeader: string) {
    const rawString = typeof body === 'string' ? body : body.toString('utf-8');
    const event = await webhookReceiver.receive(rawString, authHeader);
    console.log(`[LiveKit Webhook Received] Event: ${event.event}, Room: ${event.room?.name}`);

    if (event.event === 'room_finished' && event.room?.name) {
      await db.liveSession.updateMany({
        where: { roomId: event.room.name },
        data: {
          status: 'COMPLETED',
          actualEnd: new Date(),
        },
      });
    }

    return event;
  }
}
