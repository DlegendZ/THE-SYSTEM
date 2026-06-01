// Claude typography: Lora (serif) for display/headers/big numerals,
// Inter (sans) for body/UI. Family names match the keys registered in
// App.tsx's useFonts so styles can reference them directly.
export const FONTS = {
  display: 'Lora_600SemiBold',
  displayRegular: 'Lora_400Regular',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemibold: 'Inter_600SemiBold',
} as const;
