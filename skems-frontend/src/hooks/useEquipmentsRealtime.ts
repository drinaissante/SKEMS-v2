import { useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { supabase } from "../services/supabase"

export function useEquipmentsRealtime() {
  const queryClient = useQueryClient()

  useEffect(() => {
    const channel = supabase
      .channel("equipments-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "equipments" },
        () => {
          queryClient.invalidateQueries({ queryKey: ["equipments"] })
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])
}
