import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Font } from '@react-pdf/renderer';
import type { Form, SubmissionAnswer } from '@/types/form';

Font.register({
  family: 'NotoSansHebrew',
  src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@main/hinted/ttf/NotoSansHebrew/NotoSansHebrew-Regular.ttf',
});

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'NotoSansHebrew', direction: 'rtl' },
  title: { fontSize: 20, marginBottom: 8, textAlign: 'right' },
  description: { fontSize: 12, color: '#666', marginBottom: 24, textAlign: 'right' },
  field: { marginBottom: 16 },
  label: { fontSize: 11, color: '#888', marginBottom: 4, textAlign: 'right' },
  value: { fontSize: 13, textAlign: 'right' },
  signature: { width: 200, height: 60, marginTop: 4 },
  footer: { position: 'absolute', bottom: 30, left: 40, right: 40, fontSize: 10, color: '#aaa', textAlign: 'right' },
});

interface SubmissionDocumentProps {
  form: Form;
  answers: SubmissionAnswer[];
}

export function SubmissionDocument({ form, answers }: SubmissionDocumentProps) {
  const answerMap = Object.fromEntries(answers.map((a) => [a.field_id, a.answer_value]));
  const fields = form.form_fields ?? [];

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{form.title}</Text>
        {form.description && <Text style={styles.description}>{form.description}</Text>}

        {fields.map((field) => {
          const value = answerMap[field.id] ?? '';
          const isSignature = field.type === 'signature' && value.startsWith('data:image');
          const isFile = field.type === 'file_upload';

          return (
            <View key={field.id} style={styles.field}>
              <Text style={styles.label}>{field.label}</Text>
              {isSignature ? (
                // eslint-disable-next-line jsx-a11y/alt-text -- react-pdf Image has no alt prop
                <Image src={value} style={styles.signature} />
              ) : isFile ? (
                <Text style={styles.value}>
                  {(() => {
                    try {
                      const parsed = JSON.parse(value) as { name: string };
                      return parsed.name ?? 'קובץ מצורף';
                    } catch {
                      return 'קובץ מצורף';
                    }
                  })()}
                </Text>
              ) : (
                <Text style={styles.value}>{String(value)}</Text>
              )}
            </View>
          );
        })}

        <Text style={styles.footer}>
          נוצר ב-{new Date().toLocaleDateString('he-IL')} | FormAI
        </Text>
      </Page>
    </Document>
  );
}
