export interface ScannedFormFields {
  full_name: string
  date: string
  position_department: string
  owner: string
  equipment_requested: string
  purpose_of_use: string
  date_time_borrowing: string
  date_time_return: string
  pickup_location: string
  return_location: string
}

export interface BorrowRecord extends ScannedFormFields {
  equipment_id: string
  quantity: number
  condition_before: string
  condition_after: string
  notes: string
  scanned_by: string
  created_at: string
  updated_at: string
}

export interface BorrowUpdate {
  condition_before?: string
  condition_after?: string
  notes?: string
}
