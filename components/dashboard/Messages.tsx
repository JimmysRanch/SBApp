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

  if (loading) return <div className="text-white/80">Loading...</div>
  if (!messages.length)
    return (
      <div className="rounded-3xl border border-white/25 bg-white/10 p-6 text-white/80 backdrop-blur-lg">
        No messages yet.
      </div>
    )
  return (
    <ul className="space-y-3">
      {messages.map((msg) => (
        <li
          key={msg.id}
          className="rounded-3xl border border-white/25 bg-white/95 p-4 text-brand-navy shadow-lg backdrop-blur"
        >
          <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-brand-navy/70">
            <span>
              {msg.sender} → {msg.recipient}
            </span>
            <span>{formatTime(msg.created_at)}</span>
          </div>
          <p className="mt-2 max-h-14 overflow-hidden text-sm text-brand-navy/80" title={msg.body}>
            {msg.body}
          </p>
        </li>
      ))}
    </ul>
  )
}
