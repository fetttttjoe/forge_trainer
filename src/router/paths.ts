// Every route name and path in one place — navigation never hardcodes URL strings.
// The parameterized builders double as route patterns: the route table calls them with
// ':id'-style placeholders, so the pattern and the navigation URL can't drift apart.

export const RouteName = {
  Home: 'home',
  Plans: 'plans',
  Library: 'library',
  Progress: 'progress',
  Workout: 'workout',
  Rate: 'rate',
  Plan: 'plan',
  Pick: 'pick',
  Exercise: 'exercise',
  AddToPlan: 'addToPlan',
  Create: 'create',
  Settings: 'settings',
  Session: 'session',
  Planned: 'planned',
  Calendar: 'calendar',
  Start: 'start',
  Coach: 'coach',
} as const

export const paths = {
  home: '/',
  plans: '/plans',
  library: '/library',
  progress: '/progress',
  workout: '/workout',
  rate: '/rate',
  create: '/create',
  settings: '/settings',
  calendar: '/calendar',
  start: '/start',
  coach: '/coach',
  plan: (id: string) => `/plan/${id}`,
  pick: (planId: string, dayId: string) => `/plan/${planId}/day/${dayId}/pick`,
  exercise: (id: string) => `/exercise/${id}`,
  addToPlan: (id: string) => `/exercise/${id}/add-to-plan`,
  session: (id: string) => `/session/${id}`,
  planned: (planId: string, dayId: string) => `/planned/${planId}/${dayId}`,
} as const
