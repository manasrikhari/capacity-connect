import { LiveClassroomService } from './liveClassroom.service';

/**
 * In-memory presence tracker for auto-attendance (Phase 4).
 *
 * LiveKit emits participant_joined / participant_left / room_finished webhooks.
 * We accumulate how long each trainee was in the room and, when the room
 * finishes, POST a roster to the LMS (`/api/live/attendance`), which turns it
 * into Attendance rows.
 *
 * Why in-memory: presence is inherently ephemeral and this backend runs as a
 * single process against LiveKit Cloud. The map is keyed by room and cleared on
 * flush, so it never grows unbounded. If the process restarts mid-class the
 * accrued presence for that class is lost — an acceptable trade for not adding a
 * write on every join/leave. The mapping from a LiveKit identity to the LMS user
 * id is captured at token-mint (registerParticipant), because the identity is
 * the backend user id, which only *usually* equals the LMS id.
 */

type Participant = { lmsUserId: string; name: string };

type RoomState = {
  batchId: string | null;
  startedAt: number;
  /** LiveKit identity (backend userId) → LMS participant. */
  identityToLms: Map<string, Participant>;
  /** lmsUserId → accumulated present seconds. */
  totalSeconds: Map<string, number>;
  /** LiveKit identity → epoch ms of the current, still-open stint. */
  activeSince: Map<string, number>;
};

const rooms = new Map<string, RoomState>();

/** The overlay companion view joins as a second participant for the same person. */
function isOverlay(identity: string): boolean {
  return identity.endsWith('-overlay');
}

function ensureRoom(roomId: string, batchId: string | null): RoomState {
  let state = rooms.get(roomId);
  if (!state) {
    state = {
      batchId: batchId ?? null,
      startedAt: Date.now(),
      identityToLms: new Map(),
      totalSeconds: new Map(),
      activeSince: new Map(),
    };
    rooms.set(roomId, state);
  } else if (batchId && !state.batchId) {
    state.batchId = batchId; // fill in once we learn it
  }
  return state;
}

export const PresenceService = {
  /** Called at LiveKit token mint, when both the identity and the LMS id are known. */
  registerParticipant(
    roomId: string,
    batchId: string | null,
    identity: string,
    lmsUserId: string,
    name: string,
  ): void {
    if (!roomId || !identity || !lmsUserId || isOverlay(identity)) return;
    const state = ensureRoom(roomId, batchId);
    state.identityToLms.set(identity, { lmsUserId, name });
  },

  /** participant_joined: open a stint for this identity. */
  onParticipantJoined(roomId: string, identity: string | undefined): void {
    if (!roomId || !identity || isOverlay(identity)) return;
    const state = ensureRoom(roomId, null);
    state.activeSince.set(identity, Date.now());
  },

  /** participant_left: close the open stint and bank the seconds. */
  onParticipantLeft(roomId: string, identity: string | undefined): void {
    if (!roomId || !identity || isOverlay(identity)) return;
    const state = rooms.get(roomId);
    if (!state) return;
    this._bank(state, identity, Date.now());
  },

  _bank(state: RoomState, identity: string, now: number): void {
    const since = state.activeSince.get(identity);
    if (since === undefined) return;
    state.activeSince.delete(identity);
    const participant = state.identityToLms.get(identity);
    if (!participant) return; // can't attribute to an LMS user — drop it
    const secs = Math.max(0, Math.round((now - since) / 1000));
    state.totalSeconds.set(participant.lmsUserId, (state.totalSeconds.get(participant.lmsUserId) ?? 0) + secs);
  },

  /**
   * room_finished: close any open stints, build the roster and hand it to the
   * LMS. Returns the payload (also for tests) or null when nothing was tracked.
   */
  flush(roomId: string): {
    batchId: string | null;
    durationSeconds: number;
    participants: { userId: string; presenceSeconds: number }[];
  } | null {
    const state = rooms.get(roomId);
    if (!state) return null;

    const now = Date.now();
    for (const identity of [...state.activeSince.keys()]) {
      this._bank(state, identity, now);
    }

    const participants = [...state.totalSeconds.entries()].map(([userId, presenceSeconds]) => ({
      userId,
      presenceSeconds,
    }));
    const durationSeconds = Math.max(0, Math.round((now - state.startedAt) / 1000));
    rooms.delete(roomId);

    return { batchId: state.batchId, durationSeconds, participants };
  },

  /**
   * flush() and, if there's anything to report, notify the LMS. Fire-and-forget,
   * mirroring the other backend→LMS calls.
   */
  flushAndNotify(roomId: string): void {
    const payload = this.flush(roomId);
    if (!payload || payload.participants.length === 0) return;
    LiveClassroomService.notifyLms('/api/live/attendance', roomId, payload.batchId, {
      durationSeconds: payload.durationSeconds,
      participants: payload.participants,
    });
  },

  /** Test/maintenance helper. */
  _reset(): void {
    rooms.clear();
  },
};
