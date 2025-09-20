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

  if (loading) return <div className="text-brand-cream/70">Loading...</div>
  if (!messages.length)
    return (
      <div className="rounded-3xl border border-white/8 bg-brand-onyx/60 p-6 text-brand-cream/70 shadow-[0_24px_60px_-40px_rgba(5,12,32,0.9)] backdrop-blur-xl">
        No messages yet.
      </div>
    )
  return (
    <ul className="space-y-3">
      {messages.map((msg) => (
        <li
          key={msg.id}
          className="rounded-3xl border border-white/8 bg-brand-onyx/75 p-4 text-brand-cream shadow-[0_26px_60px_-40px_rgba(5,12,32,0.9)] backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-brand-cream/60">
            <span>
              {msg.sender} → {msg.recipient}
            </span>
            <span>{formatTime(msg.created_at)}</span>
          </div>
          <p className="mt-2 max-h-14 overflow-hidden text-sm text-brand-cream/80" title={msg.body}>
            {msg.body}
          </p>
        </li>
      ))}
    </ul>
  )
}
