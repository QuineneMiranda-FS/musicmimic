import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";

export function useLoginLogic() {
  const route = useRoute();
  const router = useRouter();

  onMounted(() => {
    const token = route.query.token;
    if (token) {
      localStorage.setItem("app_jwt", token);
      router.push("/dashboard");
    }
  });
}
