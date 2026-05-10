"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../../../lib/firebase";

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export default function RoomPage() {
    const router = useRouter();
    const { id: room_id } = useParams();
    const [uid, setUid] = useState<string | null>(null);
    const [username, setUsername] = useState<string | null>(null);
    const [room, setRoom] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!room_id) return;

        const unsub = onAuthStateChanged(auth, (user) => {
            if (!user) { router.push("/auth"); return; }
            setUid(user.uid);
            const stored = localStorage.getItem(`username:${user.uid}`);
            setUsername(stored || "Player");
        });
        return () => unsub();
    }, [room_id, router]);

    useEffect(() => {
        if (!room_id) return;

        const fetchRoom = () =>
            fetch(`${BACKEND_URL}/rooms/${room_id}`)
                .then((r) => r.ok ? r.json() : null)
                .then((data) => {
                    if (!data) setError("Room not found.");
                    else setRoom(data);
                })
                .catch(() => setError("Could not load room."));

        fetchRoom();
        const interval = setInterval(fetchRoom, 10000);
        return () => clearInterval(interval);
    }, [room_id]);

    function handleLeave() {
        fetch(`${BACKEND_URL}/rooms/${room_id}/leave?user_id=${uid}`, {
            method: "DELETE",
        }).finally(() => router.push("/lobby"));
    }

    if (error) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
            <div className="text-red-400">{error}</div>
        </div>
    );

    if (!room) return (
        <div className="min-h-screen flex items-center justify-center bg-[#0a0e1a]">
            <div className="text-slate-400 text-sm">Loading room...</div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
            {/* Header */}
            <header className="border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-2xl">🏝️</span>
                    <span className="text-white font-bold text-lg">{room.name}</span>
                </div>
                <div className="flex items-center gap-4">
                    <span className="text-slate-400 text-sm font-mono tracking-widest">{room.code}</span>
                    <button
                        onClick={handleLeave}
                        className="text-slate-500 hover:text-red-400 text-sm transition-colors"
                    >
                        Leave room
                    </button>
                </div>
            </header>

            <main className="flex-1 flex items-center justify-center px-6 py-12">
                <div className="w-full max-w-2xl flex flex-col gap-6">

                    {/* Room code to share */}
                    <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6 text-center">
                        <p className="text-slate-400 text-sm mb-2">Share this code to invite friends</p>
                        <div className="text-4xl font-mono font-bold text-white tracking-widest">{room.code}</div>
                    </div>

                    {/* Members */}
                    <div className="bg-[#111827] border border-slate-700 rounded-2xl p-6">
                        <h2 className="text-white font-semibold mb-4">
                            Players ({room.members?.length || 0})
                        </h2>
                        <div className="flex flex-col gap-2">
                            {room.members?.map((memberId: string) => (
                                <div key={memberId} className="flex items-center gap-3 bg-[#0a0e1a] rounded-xl px-4 py-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span className="text-white text-sm font-mono">
                                        {memberId === uid ? `${username} (you)` : memberId}
                                    </span>
                                    {memberId === room.host_id && (
                                        <span className="ml-auto text-xs text-yellow-400">host</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={() => router.push(`/game?room_id=${room_id}`)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-4 rounded-xl transition-colors text-base"
                    >
                        Enter island →
                    </button>

                </div>
            </main>
        </div>
    );
}