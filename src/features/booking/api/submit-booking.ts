import { useMutation } from "@tanstack/react-query";

import { api } from "@/lib/api-client";
import type { ApiResponse } from "@/types";
import type { BookingInput } from "@/validations/booking";

type BookingResult = { reference: string };

export function useSubmitBooking() {
  return useMutation({
    mutationKey: ["booking", "submit"],
    mutationFn: (input: BookingInput) =>
      api.post<ApiResponse<BookingResult>>("/booking", input),
  });
}
