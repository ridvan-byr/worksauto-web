'use client';

import React, { useState } from 'react';
import {
  Send,
  X,
  Mail,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { WorkOrder } from '../types';
import { WORK_ORDER_STATUS_MAP, useNotifyWorkOrderStatus } from '../api/use-work-orders';

interface SendStatusNotificationModalProps {
  workOrder: WorkOrder | null;
  isOpen: boolean;
  onClose: () => void;
}

export function SendStatusNotificationModal({
  workOrder,
  isOpen,
  onClose,
}: SendStatusNotificationModalProps) {
  const notifyMutation = useNotifyWorkOrderStatus();

  const customer = workOrder?.customer;
  const vehicle = workOrder?.vehicle;

  const hasEmail = Boolean(customer?.email);
  const hasPhone = Boolean(customer?.phone);

  const [sendEmail, setSendEmail] = useState(true);
  const [sendWhatsApp, setSendWhatsApp] = useState(true);
  const [sendSms, setSendSms] = useState(false);
  const [customMessage, setCustomMessage] = useState('');

  // Reset when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSendEmail(hasEmail);
      setSendWhatsApp(hasPhone);
      setSendSms(false);
      setCustomMessage('');
    }
  }, [isOpen, hasEmail, hasPhone]);

  if (!isOpen || !workOrder) return null;

  const customerFullName = customer
    ? `${customer.firstName} ${customer.lastName || ''}`.trim()
    : 'Değerli Müşterimiz';
  const plate = vehicle?.plate || 'Belirtilmedi';
  const statusLabel = WORK_ORDER_STATUS_MAP[workOrder.status] || workOrder.status;

  const handleSend = async () => {
    const channels: ('EMAIL' | 'WHATSAPP' | 'SMS')[] = [];
    if (sendEmail && hasEmail) channels.push('EMAIL');
    if (sendWhatsApp && hasPhone) channels.push('WHATSAPP');
    if (sendSms && hasPhone) channels.push('SMS');

    if (channels.length === 0) {
      return;
    }

    try {
      await notifyMutation.mutateAsync({
        workOrderId: workOrder.id,
        channels,
        customMessage: customMessage.trim() || undefined,
      });
      onClose();
    } catch {
      // Handled by mutation toast
    }
  };

  const isChannelSelected =
    (sendEmail && hasEmail) ||
    (sendWhatsApp && hasPhone) ||
    (sendSms && hasPhone);

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center">
              <Send size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Müşteriye Durum Bildirimi Gönder
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {workOrder.workOrderNumber} • {plate}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Target Customer Info Box */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Alıcı Müşteri:
              </span>
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {customerFullName}
              </span>
            </div>
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Telefon:</span>
              <span className="font-mono">{customer?.phone || 'Yok'}</span>
            </div>
            {customer?.email && (
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>E-Posta:</span>
                <span className="font-mono">{customer.email}</span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Bildirilecek Aşama:
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 dark:bg-sky-950/50 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800">
                {statusLabel}
              </span>
            </div>
          </div>

          {/* Channel Selection */}
          <div className="space-y-2.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Gönderim Kanalları
            </label>
            <div className="grid grid-cols-3 gap-2">
              {/* E-posta */}
              <button
                type="button"
                disabled={!hasEmail}
                onClick={() => setSendEmail(!sendEmail)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  sendEmail && hasEmail
                    ? 'border-sky-500 bg-sky-50/60 dark:bg-sky-950/30 text-sky-900 dark:text-sky-200 ring-1 ring-sky-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 opacity-60'
                } ${!hasEmail ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-sky-300'}`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Mail size={16} />
                  {sendEmail && hasEmail && <CheckCircle2 size={14} className="text-sky-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold">E-Posta</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {hasEmail ? 'Kurumsal SMTP' : 'Kayıtlı Değil'}
                  </div>
                </div>
              </button>

              {/* WhatsApp */}
              <button
                type="button"
                disabled={!hasPhone}
                onClick={() => setSendWhatsApp(!sendWhatsApp)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  sendWhatsApp && hasPhone
                    ? 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 ring-1 ring-emerald-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 opacity-60'
                } ${!hasPhone ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-emerald-300'}`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <MessageSquare size={16} />
                  {sendWhatsApp && hasPhone && <CheckCircle2 size={14} className="text-emerald-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold">WhatsApp</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {hasPhone ? 'GOWA Gateway' : 'Kayıtlı Değil'}
                  </div>
                </div>
              </button>

              {/* SMS */}
              <button
                type="button"
                disabled={!hasPhone}
                onClick={() => setSendSms(!sendSms)}
                className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all ${
                  sendSms && hasPhone
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200 ring-1 ring-indigo-500'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 opacity-60'
                } ${!hasPhone ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:border-indigo-300'}`}
              >
                <div className="flex items-center justify-between w-full mb-1.5">
                  <Smartphone size={16} />
                  {sendSms && hasPhone && <CheckCircle2 size={14} className="text-indigo-600" />}
                </div>
                <div>
                  <div className="text-xs font-bold">SMS</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {hasPhone ? 'Netgsm / Operatör' : 'Kayıtlı Değil'}
                  </div>
                </div>
              </button>
            </div>
            {!isChannelSelected && (
              <p className="text-[11px] text-rose-500 flex items-center gap-1 mt-1">
                <AlertCircle size={12} /> Lütfen en az bir gönderim kanalı seçiniz.
              </p>
            )}
          </div>

          {/* Message Preview */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200">
              Mesaj Önizlemesi
            </label>
            <div className="p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed border border-slate-200 dark:border-slate-700 space-y-2">
              <p>
                Sayın <strong>{customerFullName}</strong>, {plate} plakalı aracınızın servis aşaması{' '}
                <strong>"{statusLabel}"</strong> olarak güncellenmiştir.
              </p>
              {customMessage.trim() && (
                <p className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-700/60 text-slate-800 dark:text-slate-200">
                  📌 <strong>Servis Notu:</strong> {customMessage.trim()}
                </p>
              )}
              <p className="text-[11px] text-slate-500 italic">
                (Canlı durum takip linki mesaja otomatik olarak eklenecektir.)
              </p>
            </div>
          </div>

          {/* Optional Custom Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>Müşteriye Özel Açıklama (İsteğe Bağlı)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {customMessage.length}/300
              </span>
            </label>
            <textarea
              rows={2}
              maxLength={300}
              placeholder="Örn: Sipariş edilen parçanın montajı bitti, test sürüşü yapılıyor..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={notifyMutation.isPending}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Vazgeç
          </button>
          <button
            type="button"
            onClick={handleSend}
            disabled={!isChannelSelected || notifyMutation.isPending}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold text-white bg-sky-600 hover:bg-sky-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-sky-500/20 flex items-center gap-2 transition-all cursor-pointer"
          >
            {notifyMutation.isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                <span>Gönderiliyor...</span>
              </>
            ) : (
              <>
                <Send size={14} />
                <span>Onayla ve Bildirimi Gönder</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
