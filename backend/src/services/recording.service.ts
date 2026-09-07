import {
  EncodedFileOutput,
  EncodedFileType,
  S3Upload,
  type EgressInfo,
} from 'livekit-server-sdk';
import { ENV } from '../config/env';
import { egressClient, isEgressConfigured } from '../config/livekit';
import { LiveClassroomService } from './liveClassroom.service';

/**
 * Room-composite recording (Phase 4). When an S3 egress target is configured we
 * start a recording as the class begins; when LiveKit reports the egress
 * finished we hand the playable URL to the LMS, which files it as a
 * RECORDED_LECTURE. Entirely optional — with no S3 config, recording is a no-op
 * and a class simply produces no recording (graceful degradation, house style).
 */

// roomId → the egress key we chose, so egress_ended can build a stable URL even
// when the event's own location field is empty.
const egressKeyByRoom = new Map<string, string>();

function publicUrlFor(key: string, eventLocation?: string): string {
  if (ENV.EGRESS_PUBLIC_BASE_URL) {
    return `${ENV.EGRESS_PUBLIC_BASE_URL.replace(/\/$/, '')}/${key}`;
  }
  if (eventLocation) return eventLocation;
  const base = ENV.EGRESS_S3_ENDPOINT
    ? `${ENV.EGRESS_S3_ENDPOINT.replace(/\/$/, '')}/${ENV.EGRESS_S3_BUCKET}`
    : `https://${ENV.EGRESS_S3_BUCKET}.s3.${ENV.EGRESS_S3_REGION}.amazonaws.com`;
  return `${base}/${key}`;
}

export const RecordingService = {
  /** Begin recording a room, if egress is configured. Never throws. */
  async start(roomId: string): Promise<void> {
    if (!roomId || !isEgressConfigured() || egressKeyByRoom.has(roomId)) return;

    const key = `recordings/${roomId}/${Date.now()}.mp4`;
    const output = new EncodedFileOutput({
      fileType: EncodedFileType.MP4,
      filepath: key,
      output: {
        case: 's3',
        value: new S3Upload({
          accessKey: ENV.EGRESS_S3_ACCESS_KEY,
          secret: ENV.EGRESS_S3_SECRET_KEY,
          bucket: ENV.EGRESS_S3_BUCKET,
          region: ENV.EGRESS_S3_REGION,
          ...(ENV.EGRESS_S3_ENDPOINT ? { endpoint: ENV.EGRESS_S3_ENDPOINT, forcePathStyle: true } : {}),
        }),
      },
    });

    try {
      egressKeyByRoom.set(roomId, key); // reserve first so a race can't double-start
      await egressClient.startRoomCompositeEgress(roomId, { file: output });
      console.log(`[Recording] Started egress for room ${roomId} → ${key}`);
    } catch (err: any) {
      egressKeyByRoom.delete(roomId);
      console.warn(`[Recording] Failed to start egress for ${roomId}: ${err?.message || err}`);
    }
  },

  /**
   * Handle an egress_ended webhook: resolve the file URL and notify the LMS.
   * batchId is left null — the LMS resolves it from the LiveSession, which is
   * authoritative.
   */
  onEgressEnded(info: EgressInfo | undefined): void {
    const roomId = info?.roomName;
    if (!roomId) return;

    const reservedKey = egressKeyByRoom.get(roomId);
    egressKeyByRoom.delete(roomId);

    const file = info?.fileResults?.[0];
    const key = file?.filename || reservedKey;
    if (!key) {
      console.warn(`[Recording] egress_ended for ${roomId} carried no file — skipping`);
      return;
    }

    const fileUrl = publicUrlFor(key, file?.location);
    const sizeBytes = file?.size ? Number(file.size) : undefined;
    const durationSeconds = file?.duration ? Math.round(Number(file.duration) / 1_000_000_000) : undefined;

    LiveClassroomService.notifyLms('/api/live/recording', roomId, null, {
      fileUrl,
      ...(sizeBytes ? { fileSizeBytes: sizeBytes } : {}),
      ...(durationSeconds ? { durationSeconds } : {}),
    });
  },

  /** Test/maintenance helper. */
  _reset(): void {
    egressKeyByRoom.clear();
  },
};
