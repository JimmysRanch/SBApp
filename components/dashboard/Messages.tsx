"use client";
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Message {
  id: string
  sender: string
  recipient: string
  body: string
  created_at: string
}

export default function Messages() {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      if (!error && data) setMessages(data as unknown as Message[])
      setLoading(false)
    }
    fetchMessages()
  }, [])

  const formatTime = (date: string) =>
    new Date(date).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit'
    })

  if (loading) return <div className="flex items-center gap-2 text-white/80">📬 Fetching party gossip...</div>
  if (!messages.length)
    return (
      <div className="rounded-[2rem] border border-dashed border-white/35 bg-white/10 p-6 text-white/80 backdrop-blur-xl">
        Inbox is snoozing—send a glittery hello!
      </div>
    )
  return (
    <ul className="space-y-4 text-white">
      {messages.map((msg) => (
        <li
          key={msg.id}
          className="group relative overflow-hidden rounded-[1.85rem] border border-white/20 bg-gradient-to-r from-white/20 via-white/10 to-white/5 p-5 shadow-[0_26px_50px_-28px_rgba(120,92,255,0.45)] backdrop-blur-2xl"
        >
          <div className="pointer-events-none absolute -right-16 top-0 h-40 w-40 rounded-full bg-white/12 blur-3xl" />
          <div className="pointer-events-none absolute -left-14 bottom-0 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
          <div className="relative flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3 text-[0.6rem] uppercase tracking-[0.4em] text-white/75">
              <span className="inline-flex items-center gap-2">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-xs">💌</span>
                {msg.sender} → {msg.recipient}
              </span>
              <span className="rounded-full bg-white/15 px-3 py-1 text-white/80">{formatTime(msg.created_at)}</span>
            </div>
            <p className="text-sm leading-relaxed text-white/85" title={msg.body}>
              {msg.body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
