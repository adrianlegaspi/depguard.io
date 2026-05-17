import * as React from 'react';
import { TextInput } from 'react-native';
import { cn } from '../../lib/utils';

/**
 * @param {{
 *   className?: string,
 *   error?: boolean,
 *   multiline?: boolean,
 *   numberOfLines?: number,
 *   placeholder?: string,
 *   value?: string,
 *   onChangeText?: (text: string) => void,
 *   editable?: boolean,
 *   autoCapitalize?: string,
 *   autoCorrect?: boolean,
 *   keyboardType?: string,
 *   returnKeyType?: string,
 *   onSubmitEditing?: () => void,
 * } & import('react-native').TextInputProps} props
 */
export function Input({ className, error, ...props }) {
  return (
    <TextInput
      placeholderTextColor="rgba(0,0,0,0.4)"
      className={cn(
        'border-2 bg-paper px-4 py-3 font-mono text-sm text-ink',
        error ? 'border-critical' : 'border-ink',
        'focus:border-ink',
        className
      )}
      {...props}
    />
  );
}
