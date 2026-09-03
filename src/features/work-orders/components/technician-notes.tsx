"use client"

import * as React from "react"
import { MessageSquare, Plus, ShieldCheck, Send } from "lucide-react"
import { WorkOrderNote } from "../types"
import { Button } from "@/components/ui/button"

interface TechnicianNotesProps {
  notes: WorkOrderNote[]
  onAddNote: (text: string) => void
}

export function TechnicianNotes({ notes, onAddNote }: TechnicianNotesProps) {
  const [newText, setNewText] = React.useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newText.trim()) return
    onAddNote(newText.trim())
    setNewText("")
  }

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">
              Dahili Usta & Atölye Notları
            </h3>
            <p className="text-[10px] text-slate-400">
              Personele özel teknik not akışı (Müşteriye görünmez)
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
          {notes.length} Not
        </span>
      </div>

      {/* Notes Stream */}
      <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
        {notes.length === 0 ? (
          <p className="text-center py-6 text-xs text-slate-400 italic">
            Henüz usta notu girilmedi.
          </p>
        ) : (
          notes.map((note) => (
            <div
              key={note.id}
              className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200/70 dark:border-slate-800/70 space-y-1 text-xs"
            >
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  {note.authorName}
                </span>
                <span className="text-slate-400 font-mono">
                  {new Date(note.createdAt).toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {note.text}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Add Note Form */}
      <form onSubmit={handleSubmit} className="flex gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70">
        <input
          type="text"
          placeholder="Usta notu yazın (Örn: Sağ amortisör patlak, parça istendi)..."
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <Button
          type="submit"
          className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer"
          disabled={!newText.trim()}
        >
          <Send size={13} />
          <span>Ekle</span>
        </Button>
      </form>
    </div>
  )
}
