"use client";

import { useEffect, useRef } from "react";
import PusherClient from "pusher-js";

let client: PusherClient | null = null;
let activeSubscribers = 0;

/**
 * Lazily creates a single shared Pusher client connection for the browser tab.
 * Connection lifecycle (connect/disconnect) is managed by usePusherChannels,
 * not here — this just hands back the singleton instance.
 *
 * Deliberately NOT tied to document.visibilitychange: a background tab (e.g.
 * a second tab in the same window, or any tab you're not currently looking
 * at) is exactly when a live notification is most useful. Disconnecting on
 * tab-hidden would silently drop events for the entire time that tab isn't
 * focused, which defeats the point of a background toast/refresh.
 */
let warnedMissingConfig = false;

/**
 * Returns null (instead of throwing) if NEXT_PUBLIC_PUSHER_KEY/CLUSTER aren't
 * set — e.g. a deploy that hasn't had its env vars configured yet. Pusher is
 * additive: a missing/broken config must degrade to "no live updates," never
 * crash the page that everything else on it still renders correctly from the DB.
 */
export function getPusherClient(): PusherClient | null {
  if (client) return client;

  const key = process.env.NEXT_PUBLIC_PUSHER_KEY;
  const cluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;
  if (!key || !cluster) {
    if (!warnedMissingConfig) {
      warnedMissingConfig = true;
      console.warn(
        "[Pusher] NEXT_PUBLIC_PUSHER_KEY/NEXT_PUBLIC_PUSHER_CLUSTER are not set — live updates are disabled for this session. The page still works, just without real-time updates until this is configured and redeployed."
      );
    }
    return null;
  }

  client = new PusherClient(key, {
    cluster,
    channelAuthorization: {
      endpoint: "/api/pusher/auth",
      transport: "ajax",
    },
  });
  return client;
}

type EventBindings = Record<string, (data: unknown) => void>;

/**
 * Subscribes to `channelNames` for the life of the calling component and
 * tears the subscriptions down on unmount or when the channel list changes.
 * Handlers are read through a ref so callers can pass a fresh inline object
 * each render without tearing down and resubscribing every time.
 */
export function usePusherChannels(channelNames: string[], bindings: EventBindings) {
  const bindingsRef = useRef(bindings);
  useEffect(() => {
    bindingsRef.current = bindings;
  });

  const key = channelNames.join(",");

  useEffect(() => {
    if (channelNames.length === 0) return;

    const pusher = getPusherClient();
    if (!pusher) return;
    activeSubscribers++;
    if (pusher.connection.state !== "connected" && pusher.connection.state !== "connecting") {
      pusher.connect();
    }

    const channels = channelNames.map((name) => pusher.subscribe(name));
    const events = Object.keys(bindingsRef.current);
    const handlers = events.map((event) => (data: unknown) => bindingsRef.current[event]?.(data));
    const onAuthError = (err: unknown) => console.error("[Pusher] subscription denied:", err);

    channels.forEach((channel) => {
      events.forEach((event, i) => channel.bind(event, handlers[i]));
      channel.bind("pusher:subscription_error", onAuthError);
    });

    return () => {
      channels.forEach((channel) => {
        events.forEach((event, i) => channel.unbind(event, handlers[i]));
        channel.unbind("pusher:subscription_error", onAuthError);
        pusher.unsubscribe(channel.name);
      });

      // Last consumer on the page (or app) gone — drop the socket entirely
      // rather than leaving an idle connection open on pages that don't need it.
      activeSubscribers = Math.max(0, activeSubscribers - 1);
      if (activeSubscribers === 0) {
        pusher.disconnect();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
}
