<template>
  <header class="app-header">
    <div class="header-brand">
      <!-- Dynamic visual indicator status color ring -->
      <span class="brand-logo" :class="statusClass">●</span>
      <h1 class="brand-title">Music Mimic</h1>
    </div>

    <!-- Warning Banner elements visible inside the 15-minute expiration threshold -->
    <div v-if="isWarning" class="token-warning-banner">
      <span
        >Session will expire in
        <strong>{{ minutesRemaining }}m {{ secondsRemaining }}s</strong>.</span
      >
      <button
        @click="handleRefresh"
        class="refresh-inline-btn"
        :disabled="isRefreshing"
      >
        {{ isRefreshing ? "Renewing..." : "Stay Active" }}
      </button>
    </div>

    <nav class="header-nav">
      <template v-if="isLoggedIn">
        <RouterLink to="/dashboard" class="nav-link" active-class="active-link"
          >Home</RouterLink
        >
        <button @click="handleLogout" class="logout-btn">Log Out</button>
      </template>
      <template v-else>
        <RouterLink to="/" class="nav-link" active-class="active-link"
          >Welcome</RouterLink
        >
      </template>
    </nav>
  </header>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { RouterLink, useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

// Authentication State
const isLoggedIn = ref(false);
const tokenTimeLeft = ref(0);
const isRefreshing = ref(false);
let timerInterval = null;

// Countdown
const minutesRemaining = computed(() =>
  Math.max(0, Math.floor(tokenTimeLeft.value / 60)),
);
const secondsRemaining = computed(() =>
  Math.max(0, Math.floor(tokenTimeLeft.value % 60)),
);

// Token Status
const tokenStatus = computed(() => {
  if (!isLoggedIn.value) return "expired";
  if (tokenTimeLeft.value <= 0) return "expired";
  if (tokenTimeLeft.value <= 15 * 60) return "warning"; // Under 15 Minutes
  return "active";
});

const statusClass = computed(() => `status-${tokenStatus.value}`);
const isWarning = computed(() => tokenStatus.value === "warning");

// Parsing for JWT
const getJwtPayload = (token) => {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(base64));
  } catch (e) {
    return null;
  }
};

// Validate auth tokens
const checkAuth = () => {
  const token = localStorage.getItem("app_jwt");
  if (!token) {
    clearSessionState();
    return;
  }

  const payload = getJwtPayload(token);
  if (!payload || !payload.exp) {
    handleExpiredToken();
    return;
  }

  const currentTime = Math.floor(Date.now() / 1000);
  const timeLeft = payload.exp - currentTime;

  if (timeLeft <= 0) {
    handleExpiredToken();
  } else {
    isLoggedIn.value = true;
    tokenTimeLeft.value = timeLeft;
  }
};

// Clear States
const clearSessionState = () => {
  localStorage.removeItem("app_jwt");
  isLoggedIn.value = false;
  tokenTimeLeft.value = 0;
};

// Redirect for Expired
const handleExpiredToken = () => {
  stopTimer();
  clearSessionState();
  if (route.path !== "/") {
    router.push("/");
  }
};

// User Actions
const handleRefresh = async () => {
  const currentToken = localStorage.getItem("app_jwt");
  if (!currentToken || isRefreshing.value) return;

  isRefreshing.value = true;
  try {
    const response = await fetch("http://127.0.0", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${currentToken}`,
        "Content-Type": "application/json",
      },
    });

    if (response.ok) {
      const data = await response.json();
      localStorage.setItem("app_jwt", data.token);
      checkAuth(); // Recalculate Lifetime left
    } else {
      handleExpiredToken();
    }
  } catch (error) {
    console.error("Session refresh handshake aborted:", error);
    handleExpiredToken();
  } finally {
    isRefreshing.value = false;
  }
};

const handleLogout = () => {
  handleExpiredToken();
};

const startTimer = () => {
  stopTimer();
  timerInterval = setInterval(() => {
    if (isLoggedIn.value) {
      if (tokenTimeLeft.value > 1) {
        tokenTimeLeft.value--;
      } else {
        handleExpiredToken();
      }
    }
  }, 1000);
};

const stopTimer = () => {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
};

watch(
  () => route.path,
  () => {
    checkAuth();
  },
);

onMounted(() => {
  checkAuth();
  startTimer();
});

onUnmounted(() => {
  stopTimer();
});
</script>

<style scoped>
.brand-logo {
  font-size: 1.6rem;
  margin-right: 8px;
  user-select: none;
  transition: color 0.4s ease;
}

/* Color definitions matching token lifespans */
.status-active {
  color: #2ecc71; /* Green */
}
.status-warning {
  color: #f1c40f; /* Yellow */
}
.status-expired {
  color: #e74c3c; /* Red */
}

/* Notification Header Styling elements */
.token-warning-banner {
  background-color: #e67e22;
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 4px;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 12px;
  animation: fadeIn 0.3s ease-in-out;
}

.refresh-inline-btn {
  background-color: #ffffff;
  color: #d35400;
  border: none;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 3px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.refresh-inline-btn:hover:not(:disabled) {
  background-color: #f1f1f1;
}

.refresh-inline-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-4px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
