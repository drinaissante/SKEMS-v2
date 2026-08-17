import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "../services/supabase"

export function useGradingRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel("gradings-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "gradings" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["gradings"] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
