import { RoomServiceClient, WebhookReceiver } from 'livekit-server-sdk';
import { ENV } from './env';

export const getLivekitHttpUrl = (wsUrl: string): string => {
  return wsUrl.replace(/^ws(s)?:\/\//, 'http$1://');
};

export const roomServiceClient = new RoomServiceClient(
  getLivekitHttpUrl(ENV.LIVEKIT_URL),
  ENV.LIVEKIT_API_KEY,
  ENV.LIVEKIT_API_SECRET
);

export const webhookReceiver = new WebhookReceiver(
  ENV.LIVEKIT_API_KEY,
  ENV.LIVEKIT_API_SECRET
);
