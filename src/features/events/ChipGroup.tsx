import React from 'react';
import { Pressable, Text, View } from 'react-native';

/** Choix unique en pastilles (type, rappel). */
export function ChipGroup<T extends string>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <View className="gap-1.5">
      <Text className="font-bold text-[13px] text-text">{label}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={label}
        className="flex-row flex-wrap gap-1.5"
      >
        {options.map(option => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              className={`min-h-[40px] justify-center rounded-full border px-3.5 ${
                selected ? 'border-primary bg-primary' : 'border-border bg-card'
              }`}
            >
              <Text
                className={`font-bold text-[13px] ${
                  selected ? 'text-on-primary' : 'text-text'
                }`}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
