import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
import RegisterPage from '../pages/RegisterPage.vue'
import LoginPage from '../pages/LoginPage.vue'
import EmployerDashboard from '../pages/EmployerDashboard.vue'
import HomePage from '../pages/HomePage.vue'
import JobForm from '../components/JobForm.vue'
import JobList from '../components/JobList.vue' 
import JobDetails from '../pages/JobDetails.vue'
import AboutPage from '../pages/AboutPage.vue'
import NotFoundPage from '../pages/NotFoundPage.vue'
import EmployerJobsPage from '../pages/EmployerJobsPage.vue'

const routes = [
  { path: '/',name:'HomePage', component: HomePage  },
  { path: '/register',name:'RegisterPage', component: RegisterPage },
  { path: '/login',name:'LoginPage', component: LoginPage },
  { path: '/employer', name: 'EmployerDashboard', component: EmployerDashboard , meta: { requiresAuth: true, role: 'employer' }},
  { path: '/addJob',name:'JobForm', component: JobForm , meta: { requiresAuth: true, role: 'employer' } },
  { path: '/jobs',name: 'joblist', component: JobList },
  { path: '/job/:id', component: JobDetails , meta: { requiresAuth: true, role: 'employee' } },
  { path: '/about', component: AboutPage },
  { path: '/EmployerJobspage', component: EmployerJobsPage , meta: { requiresAuth: true, role: 'employer' }  },
  { path: '/employerjob/:id', name: 'EmployerJob', component: () => import('../pages/EmployerJob.vue'), meta: { requiresAuth: true, role: 'employer' } },
  { path: '/:pathMatch(.*)*', component: NotFoundPage },

]

export const router = createRouter({
  history: createWebHistory(),
  routes, 
  scrollBehavior() {
    return { top: 0 }
  }
}) 

let isUserFetched = false;

router.beforeEach(async(to, from, next) => {
  const authStore = useAuthStore()
  if (!isUserFetched) {
    try {
      await authStore.fetchUser(); 
    } catch (error) {

    }
    isUserFetched = true;
  }
  const isLoggedIn = authStore.isLoggedIn
  const role = authStore.role


  if (to.meta.requiresAuth && !isLoggedIn) {
    return next('/login')
  }

  if ((to.path === '/login' || to.path === '/register') && isLoggedIn) {
    return next(role === 'employer' ? '/employer' : '/');
  }

 
  if (to.meta.role && to.meta.role !== role) {
    return next('/')
  }

  next()
})


export default router