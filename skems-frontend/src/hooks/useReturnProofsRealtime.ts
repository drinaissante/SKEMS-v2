import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "../services/supabase"

export function useReturnProofsRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel("proofs-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "proofs" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["pending-return-proofs"] })
          queryClient.invalidateQueries({ queryKey: ["my-return-proofs"] })
          queryClient.invalidateQueries({ queryKey: ["my-event-items"] })
          queryClient.invalidateQueries({ queryKey: ["my-requests"] })
          queryClient.invalidateQueries({ queryKey: ["my-borrows"] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
