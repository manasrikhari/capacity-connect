import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { getSession } from "@/lib/session";
import { pusherServer } from "@/lib/pusher-server";
import { parseBatchChannel, parseUserChannel } from "@/lib/pusher-channels";
import { prisma } from "@/lib/prisma";

async function isAuthorizedForChannel(session: Session, channelName: string): Promise<boolean> {
  const targetUserId = parseUserChannel(channelName);
  if (targetUserId !== null) {
    return targetUserId === session.user.id;
  }

  const batchId = parseBatchChannel(channelName);
  if (batchId !== null) {
    if (session.user.role === "SUPER_ADMIN") return true;

    if (session.user.role === "ADMIN") {
      const batch = await prisma.batch.findUnique({ where: { id: batchId }, select: { teacherId: true } });
      return batch?.teacherId === session.user.id;
    }

    if (session.user.role === "STUDENT") {
      const enrollment = await prisma.enrollment.findUnique({
        where: { studentId_batchId: { studentId: session.user.id, batchId } },
      });
      return enrollment?.status === "APPROVED";
    }
  }

  return false;
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const formData = await request.formData();
  const socketId = formData.get("socket_id");
  const channelName = formData.get("channel_name");

  if (typeof socketId !== "string" || typeof channelName !== "string") {
    return new NextResponse("Bad Request", { status: 400 });
  }

  if (!(await isAuthorizedForChannel(session, channelName))) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  try {
    const authResponse = pusherServer.authorizeChannel(socketId, channelName);
    return NextResponse.json(authResponse);
  } catch (err) {
    console.error("[Pusher] Failed to authorize channel (check PUSHER_* env vars):", err);
    return new NextResponse("Pusher misconfigured", { status: 500 });
  }
}
