import { RoomServiceClient, WebhookReceiver, EgressClient } from 'livekit-server-sdk';
import { ENV } from './env';

export const getLivekitHttpUrl = (wsUrl: string): string => {
  return wsUrl.replace(/^ws(s)?:\/\//, 'http$1://');
};

const livekitHttpUrl = getLivekitHttpUrl(ENV.LIVEKIT_URL);

export const roomServiceClient = new RoomServiceClient(
  livekitHttpUrl,
  ENV.LIVEKIT_API_KEY,
  ENV.LIVEKIT_API_SECRET
);

export const webhookReceiver = new WebhookReceiver(
  ENV.LIVEKIT_API_KEY,
  ENV.LIVEKIT_API_SECRET
);

export const egressClient = new EgressClient(livekitHttpUrl, ENV.LIVEKIT_API_KEY, ENV.LIVEKIT_API_SECRET);

/** Recording is only possible when an S3 egress target is configured. */
export const isEgressConfigured = (): boolean =>
  Boolean(ENV.EGRESS_S3_BUCKET && ENV.EGRESS_S3_ACCESS_KEY && ENV.EGRESS_S3_SECRET_KEY);
