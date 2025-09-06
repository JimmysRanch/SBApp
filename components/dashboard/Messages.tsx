"use client";

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'

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

  if (loading) return <div>Loading...</div>
  if (!messages.length) return <div>No messages.</div>
  return (
    <ul className="space-y-2">
      {messages.map((msg) => (
        <li key={msg.id} className="border rounded-lg p-2 bg-gray-50">
          <p className="text-sm font-medium">{msg.sender} → {msg.recipient}</p>
          <p className="text-sm text-gray-700 truncate" title={msg.body}>{msg.body}</p>
        </li>
      ))}
    </ul>
  )
}
