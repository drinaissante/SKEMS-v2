import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "../services/supabase"

export function useBorrowedRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel("borrowed-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "borrow_records" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["borrowed-items"] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
