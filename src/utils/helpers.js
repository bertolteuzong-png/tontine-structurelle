import { messaging, getToken, VAPID_KEY } from '../firebase';
import { onMessage } from 'firebase/messaging';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const fmt = n => new Intl.NumberFormat('fr-FR').format(n) + ' FCFA';

export const fileToBase64 = (file) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onload = () => resolve(reader.result);
  reader.onerror = reject;
  reader.readAsDataURL(file);
});

// Compresses an image file client-side before it's ever sent to Firestore.
// A typical 3-4MB phone photo becomes roughly 50-150KB, which keeps well
// clear of Firestore's 1MB-per-document limit even with several images
// referenced from the same tontine.
export const compressImage = (file, { maxDimension = 1000, quality = 0.7 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier sélectionné n\'est pas une image.'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = () => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        // JPEG output regardless of source format -- smaller than PNG for photos
        // and avoids carrying an alpha channel we don't need for avatars/chat images.
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });

export const generateInviteCode = () => Math.random().toString(36).slice(2, 10).toUpperCase().replace(/[0-9]/g, 'X');

export const generateId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

export const getFrequencyLabel = (freq, t) => {
  const map = { weekly: t.weekly, biweekly: t.biweekly, monthly: t.monthly, bimonthly: t.bimonthly };
  return map[freq] || freq;
};

export const getNextDate = (startDate, frequency, position) => {
  const start = new Date(startDate);
  const days = { weekly: 7, biweekly: 14, monthly: 30, bimonthly: 60 };
  const d = days[frequency] || 7;
  const next = new Date(start.getTime() + (position - 1) * d * 24 * 60 * 60 * 1000);
  return next.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// FCM notifications
export const requestNotificationPermission = async () => {
  if (!messaging) return null;
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const token = await getToken(messaging, { vapidKey: VAPID_KEY });
      return token;
    }
  } catch (e) {
    console.log('Notification error:', e);
  }
  return null;
};

export const onForegroundMessage = (callback) => {
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
};

// PDF Export
export const exportHistoryPDF = (history, tontineName, period) => {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.setTextColor(230, 57, 70);
  doc.text('Tontine Structurelle', 14, 20);
  doc.setFontSize(12);
  doc.setTextColor(0, 0, 0);
  doc.text(`Tontine: ${tontineName}`, 14, 30);
  doc.text(`Période: ${period}`, 14, 38);
  doc.text(`Exporté le: ${new Date().toLocaleDateString('fr-FR')}`, 14, 46);

  const typeLabels = { paid: 'Cotisation', penalty: 'Pénalité', benefit: 'Bénéficiaire', aid: 'Aide' };

  autoTable(doc, {
    startY: 55,
    head: [['Type', 'Membre', 'Montant', 'Date', 'Heure']],
    body: history.map(h => [
      typeLabels[h.type] || h.type,
      h.member || h.title || '—',
      fmt(h.amount),
      h.date,
      h.time,
    ]),
    headStyles: { fillColor: [230, 57, 70] },
    alternateRowStyles: { fillColor: [248, 249, 255] },
  });

  doc.save(`historique-${tontineName}-${period}.pdf`);
};

export const exportReceiptPDF = (memberName, amount, tontineName, date) => {
  const doc = new jsPDF();
  doc.setFontSize(22);
  doc.setTextColor(230, 57, 70);
  doc.text('🇨🇲 Tontine Structurelle', 14, 25);
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('REÇU DE COTISATION', 14, 40);
  doc.setFontSize(12);
  doc.text(`Membre: ${memberName}`, 14, 58);
  doc.text(`Tontine: ${tontineName}`, 14, 68);
  doc.text(`Montant: ${fmt(amount)}`, 14, 78);
  doc.text(`Date: ${date}`, 14, 88);
  doc.text(`Heure: ${new Date().toLocaleTimeString('fr-FR')}`, 14, 98);
  doc.setFontSize(10);
  doc.setTextColor(150, 150, 150);
  doc.text('Ce reçu confirme votre cotisation à la tontine.', 14, 115);
  doc.save(`recu-${memberName}-${date}.pdf`);
};

// ─── AUDIO RECORDING ───────────────────────────────────────────────────────
// Wraps the browser's MediaRecorder API so ChatTab can capture a real voice
// message instead of just logging a duration as text. Returns a small
// controller object: call .stop() to end recording and get back a Base64
// data URL (webm/opus, small enough to store inline in Firestore for short
// voice notes) plus the actual recorded duration.
export const startAudioRecording = async () => {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('L\'enregistrement audio n\'est pas supporté sur cet appareil.');
  }
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
    ? 'audio/webm;codecs=opus'
    : 'audio/webm';
  const recorder = new MediaRecorder(stream, { mimeType });
  const chunks = [];
  const startedAt = Date.now();

  recorder.addEventListener('dataavailable', (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  });

  recorder.start();

  return {
    stop: () => new Promise((resolve, reject) => {
      recorder.addEventListener('stop', () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(chunks, { type: mimeType });
        const durationSec = Math.round((Date.now() - startedAt) / 1000);
        const reader = new FileReader();
        reader.onerror = reject;
        reader.onload = () => resolve({ dataUrl: reader.result, durationSec });
        reader.readAsDataURL(blob);
      });
      recorder.stop();
    }),
    cancel: () => {
      stream.getTracks().forEach(track => track.stop());
    },
  };
};

// Computes a member's real participation rate from their actual contribution
// history, instead of relying on a stored field that was only ever set once
// at creation (100% for the creator, 0% for joiners) and never updated
// afterwards. Returns null when there's no history yet, so callers can show
// "—" instead of a misleading 0%.
export const computeParticipationRate = (memberName, history) => {
  const relevant = (history || []).filter(
    h => h.member === memberName && (h.type === 'paid' || h.type === 'penalty')
  );
  if (relevant.length === 0) return null;
  const paidCount = relevant.filter(h => h.type === 'paid').length;
  return Math.round((paidCount / relevant.length) * 100);
};
