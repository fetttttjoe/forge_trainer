import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router'
import AppShell from '@/components/AppShell.vue'
import { RouteName, paths } from './paths'

// Tab screens live inside AppShell (shared header + bottom nav). Everything else is a full-screen
// route so the browser back button and deep links behave naturally.
const routes: RouteRecordRaw[] = [
  {
    path: paths.home,
    component: AppShell,
    children: [
      { path: paths.home, name: RouteName.Home, component: () => import('@/views/HomeView.vue') },
      { path: paths.plans, name: RouteName.Plans, component: () => import('@/views/PlansView.vue') },
      { path: paths.library, name: RouteName.Library, component: () => import('@/views/LibraryView.vue') },
      { path: paths.progress, name: RouteName.Progress, component: () => import('@/views/ProgressView.vue') },
    ],
  },
  { path: paths.workout, name: RouteName.Workout, component: () => import('@/views/WorkoutRunnerView.vue') },
  { path: paths.rate, name: RouteName.Rate, component: () => import('@/views/RateView.vue') },
  {
    path: paths.plan(':id'),
    name: RouteName.Plan,
    component: () => import('@/views/PlanBuilderView.vue'),
    props: true,
  },
  {
    path: paths.pick(':id', ':dayId'),
    name: RouteName.Pick,
    component: () => import('@/views/PickerView.vue'),
    props: true,
  },
  {
    path: paths.exercise(':id'),
    name: RouteName.Exercise,
    component: () => import('@/views/ExerciseDetailView.vue'),
    props: true,
  },
  {
    path: paths.addToPlan(':id'),
    name: RouteName.AddToPlan,
    component: () => import('@/views/AddToPlanView.vue'),
    props: true,
  },
  { path: paths.create, name: RouteName.Create, component: () => import('@/views/CreateExerciseView.vue') },
  { path: paths.settings, name: RouteName.Settings, component: () => import('@/views/SettingsView.vue') },
  {
    path: paths.session(':id'),
    name: RouteName.Session,
    component: () => import('@/views/SessionDetailView.vue'),
    props: true,
  },
  {
    path: paths.planned(':planId', ':dayId'),
    name: RouteName.Planned,
    component: () => import('@/views/PlannedDayView.vue'),
    props: true,
  },
  { path: paths.calendar, name: RouteName.Calendar, component: () => import('@/views/CalendarView.vue') },
  { path: paths.start, name: RouteName.Start, component: () => import('@/views/StartWorkoutView.vue') },
  { path: paths.coach, name: RouteName.Coach, component: () => import('@/views/BalanceCoachView.vue') },
  { path: '/:pathMatch(.*)*', redirect: paths.home },
]

export const router = createRouter({
  // Hash history works reliably inside the Capacitor webview (no server-side SPA fallback needed).
  history: createWebHashHistory(),
  routes,
})
