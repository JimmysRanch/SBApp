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

  if (loading) return <div className="text-slate-300">Loading...</div>
  if (!messages.length)
    return (
      <div className="rounded-[1.75rem] border border-dashed border-white/15 bg-slate-950/40 p-6 text-sm text-slate-400 backdrop-blur">
        No messages yet.
      </div>
    )
  return (
    <ul className="space-y-3">
      {messages.map((msg) => (
        <li
          key={msg.id}
          className="relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-slate-950/60 p-5 text-brand-cream shadow-[0_24px_55px_-35px_rgba(15,23,42,0.9)] backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3 text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-slate-400">
            <span>
              {msg.sender} → {msg.recipient}
            </span>
            <span className="text-slate-500">{formatTime(msg.created_at)}</span>
          </div>
          <p className="mt-3 max-h-16 overflow-hidden text-sm text-brand-cream/90" title={msg.body}>
            {msg.body}
          </p>
        </li>
      ))}
    </ul>
  )
}
