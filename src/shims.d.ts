// Fontsource ships CSS with no type declarations; the side-effect import is handled by Vite.
declare module '@fontsource-variable/hanken-grotesk'

// Bundled exercise catalog — declared as Exercise[] so tsc doesn't infer a type from the ~0.8MB literal.
declare module '@/assets/exercises.json' {
  import type { Exercise } from '@/domain/types'
  const data: Exercise[]
  export default data
}
