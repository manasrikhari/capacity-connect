import { LiveClassroomService } from './liveClassroom.service';

/**
 * In-memory transcript accumulator for a live class (Phase 4).
 *
 * Audio chunks are transcribed as they arrive (POST /api/transcribe) and their
 * text is appended here, tagged with the speaker. When the class ends the whole
 * transcript is handed to the LMS (`/api/live/transcript`), which stores it,
 * distils minutes and registers it as a knowledge source.
 *
 * In-memory for the same reasons as PresenceService: a transcript is a
 * throwaway working buffer until the class ends, and this backend is a single
 * process. Lines are capped so a marathon session can't exhaust memory.
 */

const MAX_LINES = 4000;

type RoomTranscript = { batchId: string | null; lines: string[]; summary?: string };

const rooms = new Map<string, RoomTranscript>();

export const TranscriptService = {
  /** Append one transcribed utterance. Empty text is ignored. */
  append(roomId: string, speaker: string | undefined, text: string, batchId: string | null = null): void {
    const clean = text.trim();
    if (!roomId || !clean) return;
    let room = rooms.get(roomId);
    if (!room) {
      room = { batchId, lines: [] };
      rooms.set(roomId, room);
    } else if (batchId && !room.batchId) {
      room.batchId = batchId;
    }
    const label = speaker?.trim();
    room.lines.push(label ? `${label}: ${clean}` : clean);
    if (room.lines.length > MAX_LINES) room.lines.splice(0, room.lines.length - MAX_LINES);
  },

  /** The transcript so far as a single string (for the rolling summary). */
  get(roomId: string): string {
    return rooms.get(roomId)?.lines.join('\n') ?? '';
  },

  /** Cache the latest rolling summary for a room (shown live in the classroom). */
  setSummary(roomId: string, summary: string): void {
    const room = rooms.get(roomId);
    if (room) room.summary = summary;
  },

  /** The cached rolling summary, if any. */
  getSummary(roomId: string): string | null {
    return rooms.get(roomId)?.summary ?? null;
  },

  /**
   * Hand the finished transcript to the LMS and clear it. Fire-and-forget,
   * like the other backend→LMS notifications. No-op when nothing was captured.
   */
  flushAndNotify(roomId: string, batchId: string | null): void {
    const room = rooms.get(roomId);
    if (!room || room.lines.length === 0) {
      rooms.delete(roomId);
      return;
    }
    const transcript = room.lines.join('\n');
    rooms.delete(roomId);
    LiveClassroomService.notifyLms('/api/live/transcript', roomId, batchId ?? room.batchId, {
      transcript,
      generateMinutes: true,
    });
  },

  /** Test/maintenance helper. */
  _reset(): void {
    rooms.clear();
  },
};
