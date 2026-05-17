import * as React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { cn } from '../../lib/utils';

const TabsContext = React.createContext({ value: '', onValueChange: () => {} });

/**
 * @param {{
 *   value: string,
 *   onValueChange: (val: string) => void,
 *   className?: string,
 *   children: React.ReactNode,
 * }} props
 */
export function Tabs({ value, onValueChange, className, children }) {
  return (
    <TabsContext.Provider value={{ value, onValueChange }}>
      <View className={cn('', className)}>{children}</View>
    </TabsContext.Provider>
  );
}

/**
 * @param {{ className?: string, children: React.ReactNode }} props
 */
export function TabsList({ className, children }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn('border-b-2 border-ink', className)}
      contentContainerClassName="flex-row"
      accessibilityRole="tablist"
    >
      {children}
    </ScrollView>
  );
}

/**
 * @param {{ value: string, className?: string, children: React.ReactNode }} props
 */
export function TabsTrigger({ value, className, children }) {
  const ctx = React.useContext(TabsContext);
  const active = ctx.value === value;

  return (
    <Pressable
      onPress={() => ctx.onValueChange(value)}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      className={cn(
        'border-r-2 border-ink px-5 py-3 web:cursor-pointer transition-colors',
        active
          ? 'bg-ink hover:bg-ink/90'
          : 'bg-paper hover:bg-ink/5 active:bg-ink/10',
        className
      )}
    >
      <Text
        className={cn(
          'font-mono-bold text-xs uppercase tracking-widest',
          active ? 'text-paper' : 'text-ink'
        )}
      >
        {children}
      </Text>
    </Pressable>
  );
}

/**
 * @param {{ value: string, className?: string, children: React.ReactNode }} props
 */
export function TabsContent({ value, className, children }) {
  const ctx = React.useContext(TabsContext);
  if (ctx.value !== value) return null;
  return (
    <View className={cn('', className)} accessibilityRole="tabpanel">{children}</View>
  );
}
