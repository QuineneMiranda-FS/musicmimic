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
      path: "/dashboard",
      name: "Dashboard",
      component: () => import("../views/Dashboard.vue"),
      meta: { requiresAuth: true },
    },
    {
      path: "/track-details",
      name: "SongDetails",
      component: () => import("../views/SongDetailsView.vue"),
      meta: { requiresAuth: true },
    },
    // Catch All Redirect to Dashboard
    {
      path: "/:pathMatch(.*)*",
      redirect: "/dashboard",
    },
  ],
});

router.beforeEach(async (to) => {
  const token = localStorage.getItem("app_jwt");
  const urlParams = new URLSearchParams(window.location.search);
  const tokenFromUrl = urlParams.get("token");

  if (tokenFromUrl && to.path === "/dashboard") {
    localStorage.setItem("app_jwt", tokenFromUrl);

    // Clear token from URL address bar
    const cleanUrl =
      window.location.protocol +
      "//" +
      window.location.host +
      window.location.pathname;
    window.history.replaceState({}, "", cleanUrl);

    return true;
  }

  // Handle users with tokens in URL
  if (tokenFromUrl) {
    return { path: "/dashboard", replace: true };
  }

  // Deny unauthorized users access
  if (to.meta.requiresAuth && !token) {
    return { name: "login" };
  }

  // Authenticated users skip login
  if (to.name === "login" && token) {
    return { path: "/dashboard" };
  }

  return true;
});

export default router;
