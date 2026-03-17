"use client";

import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { pusherClient } from "@/lib/pusher";
import { useRouter } from "next/navigation";

type Notification = {
  id: string;
  type: string;
  message: string;
  orderId: string;
  read: boolean;
  createdAt: string;
};

export default function NotificationBell() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);

  const unread = notifications.filter((n) => !n.read).length;

  function playAlert() {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  }

  useEffect(() => {
    fetch("/api/notifications")
      .then((r) => r.json())
      .then(setNotifications);

    const channel = pusherClient.subscribe("admin-notifications");
    channel.bind("new-notification", (data: Notification) => {
      setNotifications((prev) => [{ ...data, read: false }, ...prev]);
      playAlert();
    });

    return () => pusherClient.unsubscribe("admin-notifications");
  }, []);

  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleClick(orderId: string) {
    setOpen(false);
    router.push(`/admin/orders?id=${orderId}`);
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setOpen(!open);
          if (unread > 0) markAllRead();
        }}
        className="relative rounded-full p-2 hover:bg-muted"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-xs text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-80 rounded-xl border border-border bg-card shadow-lg">
          <div className="border-b border-border px-4 py-3">
            <p className="font-semibold">Notificações</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 && (
              <p className="p-4 text-sm text-muted-foreground">
                Nenhuma notificação
              </p>
            )}
            {notifications.map((n) => (
              <button
                key={n.id}
                onClick={() => handleClick(n.orderId)}
                className="w-full px-4 py-3 text-left text-sm hover:bg-muted border-b border-border last:border-0"
              >
                <p className={n.read ? "text-muted-foreground" : "font-medium"}>
                  {n.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.createdAt).toLocaleString("pt-BR")}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
