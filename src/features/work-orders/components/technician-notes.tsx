"use client"

import * as React from "react"
import { MessageSquare, Send, Edit2, Trash2, Check, X, Sparkles, Shield, User as UserIcon } from "lucide-react"
import { WorkOrderNote } from "../types"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/features/auth/auth-context"
import { cn } from "@/lib/utils"

interface TechnicianNotesProps {
  notes: WorkOrderNote[]
  onAddNote: (text: string) => Promise<void> | void
  onUpdateNote?: (noteId: string, text: string) => Promise<void> | void
  onDeleteNote?: (noteId: string) => Promise<void> | void
  isLocked?: boolean
}

const QUICK_NOTES = [
  "⚡ Parça bekleniyor",
  "⚡ Müşteri onayı alındı",
  "⚡ Test sürüşü yapıldı",
  "⚡ Lift kontrolü tamamlandı",
]

export function TechnicianNotes({
  notes,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  isLocked = false,
}: TechnicianNotesProps) {
  const { user } = useAuth()
  const [newText, setNewText] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  // Edit state
  const [editingNoteId, setEditingNoteId] = React.useState<string | null>(null)
  const [editText, setEditText] = React.useState("")
  const [isUpdating, setIsUpdating] = React.useState(false)

  // Auto-scroll ref
  const messagesEndRef = React.useRef<HTMLDivElement | null>(null)
  const chatContainerRef = React.useRef<HTMLDivElement | null>(null)

  // Chronological sorting (oldest first, so newest is at the bottom)
  const sortedNotes = React.useMemo(() => {
    return [...notes].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [notes])

  // Scroll to bottom when new notes arrive or on mount
  React.useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [sortedNotes.length])

  const isCurrentUser = (note: WorkOrderNote) => {
    if (!user) return false
    if (note.authorId && note.authorId === user.id) return true
    const currentFullName = `${user.name || ""} ${user.surname || ""}`.trim().toLowerCase()
    if (note.authorName && note.authorName.trim().toLowerCase() === currentFullName) return true
    return false
  }

  const isManager = user?.role === "OWNER" || user?.role === "SERVICE_MANAGER"

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await onAddNote(newText.trim())
      setNewText("")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartEdit = (note: WorkOrderNote) => {
    setEditingNoteId(note.id)
    setEditText(note.text || note.note || "")
  }

  const handleCancelEdit = () => {
    setEditingNoteId(null)
    setEditText("")
  }

  const handleSaveEdit = async (noteId: string) => {
    if (!editText.trim() || !onUpdateNote || isUpdating) return
    setIsUpdating(true)
    try {
      await onUpdateNote(noteId, editText.trim())
      setEditingNoteId(null)
      setEditText("")
    } finally {
      setIsUpdating(false)
    }
  }

  const handleDelete = async (noteId: string) => {
    if (!onDeleteNote) return
    if (window.confirm("Bu mesajı silmek istediğinize emin misiniz?")) {
      await onDeleteNote(noteId)
    }
  }

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center">
            <MessageSquare size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>Dahili Usta & Atölye Notları</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                {notes.length}
              </span>
            </h3>
            <p className="text-[10px] text-slate-400">
              Personele özel canlı teknik not akışı (Müşteriye görünmez)
            </p>
          </div>
        </div>
      </div>

      {/* Modern Chat Stream Container (Aligned to bottom) */}
      <div
        ref={chatContainerRef}
        className="space-y-3 max-h-72 min-h-[170px] overflow-y-auto pr-1 flex flex-col justify-start"
      >
        {sortedNotes.length === 0 ? (
          <div className="my-auto text-center py-8 space-y-1">
            <p className="text-xs text-slate-400 italic">Henüz usta notu girilmedi.</p>
            <p className="text-[10px] text-slate-400">Aşağıdan ilk teknik notu ekleyerek ekibi bilgilendirin.</p>
          </div>
        ) : (
          sortedNotes.map((note) => {
            const isMine = isCurrentUser(note)
            const canEdit = isMine && !isLocked
            const canDelete = (isMine || isManager) && !isLocked
            const isEditingThis = editingNoteId === note.id
            const isEdited = Boolean(note.updatedAt && note.updatedAt !== note.createdAt)

            return (
              <div
                key={note.id}
                className={cn(
                  "group flex flex-col max-w-[85%] transition-all",
                  isMine ? "ml-auto items-end" : "mr-auto items-start"
                )}
              >
                {/* Author Info & Timestamp */}
                <div
                  className={cn(
                    "flex items-center gap-1.5 text-[10px] mb-1 px-1 font-medium",
                    isMine ? "text-sky-600 dark:text-sky-400" : "text-slate-500 dark:text-slate-400"
                  )}
                >
                  {isMine ? (
                    <>
                      <span className="font-bold">Siz ({user?.name || "Kullanıcı"})</span>
                      <span>•</span>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-slate-800 dark:text-slate-200">
                        {note.authorName || "Personel"}
                      </span>
                      <span>•</span>
                    </>
                  )}
                  <span className="font-mono text-[9px] text-slate-400">
                    {new Date(note.createdAt).toLocaleTimeString("tr-TR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  {isEdited && (
                    <span className="text-[9px] italic text-slate-400 font-normal">
                      (düzenlendi)
                    </span>
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={cn(
                    "relative rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-xs transition-all",
                    isMine
                      ? "bg-sky-600 text-white rounded-tr-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200/60 dark:border-slate-700/60"
                  )}
                >
                  {isEditingThis ? (
                    <div className="space-y-2 min-w-[200px] text-slate-900 dark:text-slate-100">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-400 resize-none"
                        rows={2}
                        autoFocus
                      />
                      <div className="flex justify-end gap-1.5">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={handleCancelEdit}
                          className="h-7 px-2 text-[11px] text-slate-500 hover:text-slate-800"
                          disabled={isUpdating}
                        >
                          <X size={12} className="mr-1" />
                          Vazgeç
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(note.id)}
                          className="h-7 px-2.5 text-[11px] bg-emerald-600 hover:bg-emerald-700 text-white"
                          disabled={isUpdating || !editText.trim()}
                        >
                          <Check size={12} className="mr-1" />
                          Kaydet
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap select-text">{note.text || note.note}</p>
                  )}
                </div>

                {/* Action icons on hover (Edit / Delete) */}
                {!isEditingThis && !isLocked && (canEdit || canDelete) && (
                  <div
                    className={cn(
                      "flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-1",
                      isMine ? "justify-end" : "justify-start"
                    )}
                  >
                    {canEdit && (
                      <button
                        type="button"
                        onClick={() => handleStartEdit(note)}
                        className="text-[10px] text-slate-400 hover:text-sky-500 p-0.5 rounded transition-colors"
                        title="Mesajı düzenle (yalnızca kendi mesajınız)"
                      >
                        <Edit2 size={11} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        className="text-[10px] text-slate-400 hover:text-rose-500 p-0.5 rounded transition-colors"
                        title={isMine ? "Mesajı sil" : "Yönetici olarak mesajı sil"}
                      >
                        <Trash2 size={11} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Status Chips */}
      {!isLocked && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {QUICK_NOTES.map((quick) => (
            <button
              key={quick}
              type="button"
              onClick={() => setNewText(quick.replace("⚡ ", ""))}
              className="text-[10px] font-medium px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 border border-slate-200/60 dark:border-slate-700/60 transition-colors cursor-pointer"
            >
              {quick}
            </button>
          ))}
        </div>
      )}

      {/* Add Note Input Bar */}
      {!isLocked && (
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 pt-2 border-t border-slate-200/70 dark:border-slate-800/70"
        >
          <input
            type="text"
            placeholder={`${user?.name ? `${user.name} olarak` : ""} teknik not yazın...`}
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            disabled={isSubmitting}
            className="flex-1 h-10 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
          <Button
            type="submit"
            className="h-10 px-4 text-xs font-semibold gap-1.5 cursor-pointer bg-sky-600 hover:bg-sky-700 text-white"
            disabled={!newText.trim() || isSubmitting}
          >
            <Send size={13} />
            <span>{isSubmitting ? "Ekleniyor..." : "Gönder"}</span>
          </Button>
        </form>
      )}
    </div>
  )
}
