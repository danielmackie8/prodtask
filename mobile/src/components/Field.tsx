import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, TextInput } from 'react-native';
import { useTheme } from '../ThemeContext';
import { FONT, MONO } from '../theme';

function FieldLabel({ children }: { children: React.ReactNode }) {
  const { T } = useTheme();
  return (
    <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted, fontFamily: MONO, marginBottom: 6 }}>
      {children}
    </Text>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
  accent,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  accent?: string;
}) {
  const { T } = useTheme();
  const [open, setOpen] = useState(false);
  const ac = accent || '#4f8ef7';
  return (
    <View style={{ flexGrow: 1, minWidth: 130 }}>
      <FieldLabel>{label}</FieldLabel>
      <Pressable
        onPress={() => setOpen(true)}
        style={{
          backgroundColor: T.bg,
          borderWidth: 1,
          borderColor: T.border,
          borderRadius: 8,
          paddingVertical: 11,
          paddingHorizontal: 12,
        }}
      >
        <Text style={{ color: T.text, fontSize: 15, fontFamily: FONT }}>{value || 'None'}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={{ flex: 1, backgroundColor: 'rgba(8,10,18,0.6)', justifyContent: 'flex-end' }} onPress={() => setOpen(false)}>
          <Pressable
            style={{ backgroundColor: T.surface, borderTopLeftRadius: 16, borderTopRightRadius: 16, paddingBottom: 24, maxHeight: '60%' }}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: T.border }}>
              <Text style={{ fontSize: 15, fontWeight: '600', color: T.white, fontFamily: FONT }}>{label}</Text>
            </View>
            <ScrollView>
              {options.map((o) => (
                <Pressable
                  key={o || '__none__'}
                  onPress={() => {
                    onChange(o);
                    setOpen(false);
                  }}
                  style={{
                    paddingVertical: 14,
                    paddingHorizontal: 18,
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderBottomColor: T.border,
                    backgroundColor: o === value ? `${ac}18` : 'transparent',
                  }}
                >
                  <Text style={{ fontSize: 15, color: o === value ? ac : T.text, fontFamily: FONT }}>{o || 'None'}</Text>
                  {o === value && <Text style={{ color: ac }}>✓</Text>}
                </Pressable>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

export function TextField({
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  accent,
  autoFocus,
  onSubmitEditing,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  accent?: string;
  autoFocus?: boolean;
  onSubmitEditing?: () => void;
}) {
  const { T } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={T.muted}
        multiline={multiline}
        autoFocus={autoFocus}
        onSubmitEditing={multiline ? undefined : onSubmitEditing}
        style={{
          backgroundColor: T.surface,
          borderWidth: 1,
          borderColor: T.border,
          borderRadius: 8,
          color: T.text,
          fontSize: 15,
          paddingVertical: multiline ? 10 : 12,
          paddingHorizontal: 12,
          fontFamily: FONT,
          minHeight: multiline ? 80 : undefined,
          textAlignVertical: multiline ? 'top' : 'center',
        }}
      />
    </View>
  );
}
