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

  if (loading) return <div className="text-brand-navy/60">Loading...</div>
  if (!messages.length)
    return (
      <div className="rounded-[1.85rem] border border-brand-navy/10 bg-white/80 p-6 text-sm text-brand-navy/70 shadow-[0_16px_40px_-35px_rgba(8,15,41,0.55)]">
        No messages yet.
      </div>
    )
  return (
    <ul className="space-y-3">
      {messages.map((msg) => (
        <li
          key={msg.id}
          className="group relative overflow-hidden rounded-[1.85rem] border border-brand-navy/10 bg-white/95 p-5 text-brand-navy shadow-[0_18px_35px_-30px_rgba(7,12,30,0.55)] transition-transform duration-200 hover:-translate-y-1"
        >
          <div className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.32em] text-brand-navy/60">
            <span>
              {msg.sender} → {msg.recipient}
            </span>
            <span>{formatTime(msg.created_at)}</span>
          </div>
          <p className="mt-3 max-h-16 overflow-hidden text-sm text-brand-navy/80" title={msg.body}>
            {msg.body}
          </p>
          <div className="pointer-events-none absolute inset-x-4 bottom-2 h-[1px] bg-gradient-to-r from-transparent via-brand-blue/20 to-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
        </li>
      ))}
    </ul>
  )
}
