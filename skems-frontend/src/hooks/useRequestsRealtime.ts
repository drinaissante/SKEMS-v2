import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "../services/supabase"

export function useRequestsRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel("requests-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "requests" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["my-requests"] })
          queryClient.invalidateQueries({ queryKey: ["admin-requests"] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
