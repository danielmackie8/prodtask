import React, { useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../ThemeContext';
import { FONT, FONT_MEDIUM, MONO } from '../theme';
import { addDays, toDateInputValue } from '../utils';

export function DateField({ value, onChange, accent }: { value: string; onChange: (v: string) => void; accent?: string }) {
  const { T } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const ac = accent || '#4f8ef7';
  const displayDate = value
    ? new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
    : 'No due date';

  return (
    <View>
      <Text style={{ fontSize: 11, fontWeight: '600', letterSpacing: 1, textTransform: 'uppercase', color: T.muted, fontFamily: MONO, marginBottom: 6 }}>
        Due date
      </Text>
      <Pressable
        onPress={() => setShowPicker(true)}
        style={{ backgroundColor: T.bg, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingVertical: 11, paddingHorizontal: 12, marginBottom: 8 }}
      >
        <Text style={{ color: value ? T.text : T.muted, fontSize: 15, fontFamily: FONT }}>{displayDate}</Text>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <QuickDateBtn label="Today" onPress={() => onChange(toDateInputValue(new Date()))} accent={ac} />
        <QuickDateBtn label="Tomorrow" onPress={() => onChange(toDateInputValue(addDays(new Date(), 1)))} accent={ac} />
        {!!value && <QuickDateBtn label="Clear" onPress={() => onChange('')} accent={ac} />}
      </View>
      {showPicker && (
        <DateTimePicker
          value={value ? new Date(value) : new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'inline' : 'default'}
          onChange={(event, selected) => {
            setShowPicker(Platform.OS === 'ios' ? showPicker : false);
            if (event.type === 'dismissed') {
              setShowPicker(false);
              return;
            }
            if (selected) onChange(toDateInputValue(selected));
            if (Platform.OS !== 'ios') setShowPicker(false);
          }}
        />
      )}
      {showPicker && Platform.OS === 'ios' && (
        <Pressable onPress={() => setShowPicker(false)} style={{ alignSelf: 'flex-end', marginTop: 6 }}>
          <Text style={{ color: ac, fontFamily: FONT_MEDIUM, fontSize: 13 }}>Done</Text>
        </Pressable>
      )}
    </View>
  );
}

function QuickDateBtn({ label, onPress, accent }: { label: string; onPress: () => void; accent: string }) {
  const { T } = useTheme();
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: T.card, borderWidth: 1, borderColor: T.border, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 }}>
      <Text style={{ color: T.textSoft, fontSize: 13, fontFamily: FONT }}>{label}</Text>
    </Pressable>
  );
}
