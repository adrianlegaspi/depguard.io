import * as React from 'react';
import { View, Text, Pressable, Modal, FlatList } from 'react-native';
import { cn } from '../../lib/utils';

/**
 * @typedef {{ label: string, value: string }} SelectOption
 */

/**
 * @param {{
 *   value: string,
 *   onValueChange: (val: string) => void,
 *   options: SelectOption[],
 *   placeholder?: string,
 *   className?: string,
 *   accessibilityLabel?: string,
 * }} props
 */
export function Select({ value, onValueChange, options, placeholder = 'Select…', className, accessibilityLabel }) {
  const [open, setOpen] = React.useState(false);
  const selected = options.find(o => o.value === value);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? `${placeholder}: ${selected?.label ?? 'none'}`}
        accessibilityState={{ expanded: open }}
        className={cn(
          'flex-row items-center justify-between border-2 border-ink bg-paper px-4 py-3 web:cursor-pointer hover:bg-ink/5 active:bg-ink/10',
          className
        )}
      >
        <Text className="font-mono text-sm text-ink" numberOfLines={1}>
          {selected?.label ?? placeholder}
        </Text>
        <Text className="font-mono text-sm text-muted ml-2">▼</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable
          className="flex-1 bg-ink/60"
          onPress={() => setOpen(false)}
          accessibilityLabel="Close menu"
        >
          <Pressable
            onPress={() => {}}
            className="mx-4 mt-24 border-2 border-ink bg-paper"
          >
            <FlatList
              data={options}
              keyExtractor={item => item.value}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <Pressable
                    onPress={() => { onValueChange(item.value); setOpen(false); }}
                    accessibilityRole="menuitem"
                    accessibilityState={{ selected: isSelected }}
                    className={cn(
                      'border-b border-divider px-4 py-3 web:cursor-pointer',
                      isSelected ? 'bg-ink hover:bg-ink/90' : 'hover:bg-ink/5 active:bg-ink/10'
                    )}
                  >
                    <Text
                      className={cn(
                        'font-mono text-sm',
                        isSelected ? 'text-paper' : 'text-ink'
                      )}
                    >
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
