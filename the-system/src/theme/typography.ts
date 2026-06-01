// Single-typeface system: Lora (serif) everywhere — one font family across the
// whole app, varied only by weight/italic. Family names match the keys
// registered in App.tsx's useFonts so styles can reference them directly.
export const FONTS = {
  display: 'Lora_600SemiBold',
  displayRegular: 'Lora_400Regular',
  body: 'Lora_400Regular',
  bodyMedium: 'Lora_500Medium',
  bodySemibold: 'Lora_600SemiBold',
  bold: 'Lora_700Bold',
  italic: 'Lora_400Regular_Italic',
} as const;
