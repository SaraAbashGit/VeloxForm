import React from 'react';
import path from 'path';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { Form, SubmissionAnswer } from '@/types/form';

// Bundled with the app (see outputFileTracingIncludes in next.config): a remote font made PDF generation fail
// whenever the CDN was slow or blocked. Alef covers Hebrew AND Latin/digits (emails, phones, dates).
const FONT_DIR = path.join(process.cwd(), 'lib/pdf/fonts');
Font.register({
  family: 'Alef',
  fonts: [
    { src: path.join(FONT_DIR, 'Alef-Regular.ttf') },
    { src: path.join(FONT_DIR, 'Alef-Bold.ttf'), fontWeight: 'bold' },
  ],
});
// Hebrew words must not be split with hyphens
Font.registerHyphenationCallback((word) => [word]);

const C = { ink: '#191918', teal: '#294248', cyan: '#64ccd0', sage: '#879983', muted: '#5a6b6e', line: '#d9dfd8', soft: '#eef1ec' };

const styles = StyleSheet.create({
  page: { paddingBottom: 60, fontFamily: 'Alef', fontSize: 11, color: C.teal },
  header: { backgroundColor: C.teal, color: '#ffffff', paddingVertical: 18, paddingHorizontal: 36, flexDirection: 'row-reverse', justifyContent: 'space-between', alignItems: 'center' },
  businessName: { fontSize: 16, fontWeight: 'bold' },
  brandTiles: { flexDirection: 'row' },
  tile: { width: 10, height: 10, marginLeft: 3 },
  body: { paddingHorizontal: 36, paddingTop: 24 },
  title: { fontSize: 20, fontWeight: 'bold', textAlign: 'right', marginBottom: 4 },
  description: { fontSize: 11, color: C.muted, textAlign: 'right', marginBottom: 14 },
  meta: { backgroundColor: C.soft, borderRadius: 4, padding: 10, flexDirection: 'row-reverse', justifyContent: 'space-between', marginBottom: 18 },
  metaText: { fontSize: 10, color: C.muted, textAlign: 'right' },
  row: { flexDirection: 'row-reverse', borderBottomWidth: 1, borderBottomColor: C.line, paddingVertical: 8 },
  label: { width: '35%', fontSize: 10, color: C.muted, textAlign: 'right', paddingLeft: 10 },
  value: { width: '65%', fontSize: 11, textAlign: 'right' },
  signatureBox: { marginTop: 22, alignItems: 'flex-end' },
  signatureLabel: { fontSize: 10, color: C.muted, marginBottom: 4, textAlign: 'right' },
  signature: { width: 180, height: 60, objectFit: 'contain' },
  signatureLine: { width: 200, borderTopWidth: 1, borderTopColor: C.teal, marginTop: 2 },
  signedAt: { fontSize: 9, color: C.muted, marginTop: 3, textAlign: 'right' },
  footer: { position: 'absolute', bottom: 24, left: 36, right: 36, flexDirection: 'row-reverse', justifyContent: 'space-between', fontSize: 9, color: C.sage },
});

interface SubmissionDocumentProps {
  form: Form;
  answers: SubmissionAnswer[];
  businessName?: string;
  submissionId?: string;
  submittedAt?: string;
}

// The PDF engine orders each Hebrew line left-to-right, which puts trailing punctuation ("?", ":", "!")
// on the wrong side. Moving it to the front of the string makes it render at the visual end.
// (Unicode direction marks can't be used: Alef draws them as visible glyphs.)
function rtlPunct(text: string) {
  const m = text.match(/^([sS]*?)([?!:.]+)$/);
  return m && /[֐-׿]/.test(m[1]) ? m[2] + m[1] : text;
}

function fileName(value: string) {
  try {
    return (JSON.parse(value) as { name?: string }).name ?? 'קובץ מצורף';
  } catch {
    return 'קובץ מצורף';
  }
}

export function SubmissionDocument({ form, answers, businessName, submittedAt }: SubmissionDocumentProps) {
  const answerMap = Object.fromEntries(answers.map((a) => [a.field_id, a.answer_value ?? '']));
  const fields = form.form_fields ?? [];
  const signatures = fields.filter((f) => f.type === 'signature' && (answerMap[f.id] ?? '').startsWith('data:image'));
  const date = submittedAt ? new Date(submittedAt) : new Date();
  const when = date.toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', dateStyle: 'short', timeStyle: 'short' });

  return (
    <Document title={form.title}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.businessName}>{businessName || form.title}</Text>
          <View style={styles.brandTiles}>
            <View style={[styles.tile, { backgroundColor: C.cyan }]} />
            <View style={[styles.tile, { backgroundColor: C.sage }]} />
            <View style={[styles.tile, { backgroundColor: C.ink }]} />
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.title}>{rtlPunct(form.title)}</Text>
          {form.description ? <Text style={styles.description}>{rtlPunct(form.description)}</Text> : null}

          <View style={styles.meta}>
            <Text style={styles.metaText}>תאריך ושעת שליחה: {when}</Text>
          </View>

          {fields
            .filter((f) => f.type !== 'signature')
            .map((field) => {
              const value = answerMap[field.id] ?? '';
              return (
                <View key={field.id} style={styles.row} wrap={false}>
                  <Text style={styles.label}>{rtlPunct(field.label)}</Text>
                  <Text style={styles.value}>{field.type === 'file_upload' ? (value ? fileName(value) : '—') : value || '—'}</Text>
                </View>
              );
            })}

          {signatures.map((field) => (
            <View key={field.id} style={styles.signatureBox} wrap={false}>
              <Text style={styles.signatureLabel}>{rtlPunct(field.label)}</Text>
              {/* eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop */}
              <Image src={answerMap[field.id]} style={styles.signature} />
              <View style={styles.signatureLine} />
              <Text style={styles.signedAt}>נחתם דיגיטלית בתאריך {when}</Text>
            </View>
          ))}
        </View>

        <View style={styles.footer} fixed>
          <Text render={({ pageNumber, totalPages }) => `עמוד ${pageNumber} מתוך ${totalPages}`} />
          <Text>Generated by FormAI</Text>
        </View>
      </Page>
    </Document>
  );
}
