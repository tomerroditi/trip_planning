// The app reads the same shapes the Worker returns. Re-export the shared
// contract so app code imports from one place.
export type {
  Trip,
  Segment,
  Day,
  DayWithItems,
  SegmentWithDays,
  PlanItem,
  Accommodation,
  Booking,
  BudgetCategory,
  DocumentItem,
  Note,
  TripState,
  StayStatus,
  DocumentKind,
} from "../../shared/types";
