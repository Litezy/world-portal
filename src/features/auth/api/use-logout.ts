import { useRouter } from "next/navigation";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import { internalApi } from "@/lib/api-client";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["auth", "logout"],
    mutationFn: () => internalApi.post<{ data: { ok: true } }>("/admin/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      router.replace("/admin/login");
      router.refresh();
    },
  });
}
