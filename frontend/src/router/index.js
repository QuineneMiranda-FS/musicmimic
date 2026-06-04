import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "login",
      component: LoginView,
      meta: { requiresAuth: false },
    },
    {
      path: "/search",
      name: "search",
      // Loads view only when the user visits it
      component: () => import("../views/SearchView.vue"),
      meta: { requiresAuth: true },
    },
  ],
});

// Nav Guard Intercept
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem("app_jwt");

  // Check for new token
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");

  if (tokenFromUrl) {
    localStorage.setItem("app_jwt", tokenFromUrl);
    // Clear token fm address bar
    return next({ path: "/search", replace: true });
  }

  // If no token, redirect to login
  if (to.meta.requiresAuth && !token) {
    return next({ name: "login" });
  }

  // Skip login for users already authenticated
  if (to.name === "login" && token) {
    return next({ name: "search" });
  }

  next();
});

export default router;
