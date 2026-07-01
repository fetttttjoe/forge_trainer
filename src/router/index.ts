import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AppShell from '@/components/AppShell.vue'

// Tab screens live inside AppShell (shared header + bottom nav). Everything else is a full-screen
// route so the browser back button and deep links behave naturally.
const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: AppShell,
    children: [
      { path: '', name: 'home', component: () => import('@/views/HomeView.vue') },
      { path: 'plans', name: 'plans', component: () => import('@/views/PlansView.vue') },
      { path: 'library', name: 'library', component: () => import('@/views/LibraryView.vue') },
      { path: 'progress', name: 'progress', component: () => import('@/views/ProgressView.vue') },
    ],
  },
  { path: '/workout', name: 'workout', component: () => import('@/views/WorkoutRunnerView.vue') },
  { path: '/rate', name: 'rate', component: () => import('@/views/RateView.vue') },
  { path: '/plan/:id', name: 'plan', component: () => import('@/views/PlanBuilderView.vue'), props: true },
  {
    path: '/plan/:id/day/:dayId/pick',
    name: 'pick',
    component: () => import('@/views/PickerView.vue'),
    props: true,
  },
  { path: '/exercise/:id', name: 'exercise', component: () => import('@/views/ExerciseDetailView.vue'), props: true },
  {
    path: '/exercise/:id/add-to-plan',
    name: 'addToPlan',
    component: () => import('@/views/AddToPlanView.vue'),
    props: true,
  },
  { path: '/create', name: 'create', component: () => import('@/views/CreateExerciseView.vue') },
  { path: '/settings', name: 'settings', component: () => import('@/views/SettingsView.vue') },
  { path: '/session/:id', name: 'session', component: () => import('@/views/SessionDetailView.vue'), props: true },
  {
    path: '/planned/:planId/:dayId',
    name: 'planned',
    component: () => import('@/views/PlannedDayView.vue'),
    props: true,
  },
  { path: '/calendar', name: 'calendar', component: () => import('@/views/CalendarView.vue') },
  { path: '/start', name: 'start', component: () => import('@/views/StartWorkoutView.vue') },
  { path: '/coach', name: 'coach', component: () => import('@/views/BalanceCoachView.vue') },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  // Hash history works reliably inside the Capacitor webview (no server-side SPA fallback needed).
  history: createWebHashHistory(),
  routes,
})
