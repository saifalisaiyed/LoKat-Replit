export type Orientation = "portrait" | "landscape";
export type Angle = "looking-up" | "eye-level" | "looking-down";
export type Timing = "now" | "scheduled";
export type RequestStatus = "open" | "accepted" | "submitted" | "completed" | "abandoned";

export type Category =
  | "landmarks"
  | "nature"
  | "markets"
  | "beaches"
  | "cityscapes"
  | "food"
  | "hidden-gems"
  | "events";

export const CATEGORIES: { key: Category; label: string; icon: string }[] = [
  { key: "landmarks", label: "Landmarks", icon: "flag-outline" },
  { key: "nature", label: "Nature", icon: "leaf-outline" },
  { key: "markets", label: "Markets", icon: "storefront-outline" },
  { key: "beaches", label: "Beaches & Water", icon: "umbrella-outline" },
  { key: "cityscapes", label: "Cityscapes", icon: "business-outline" },
  { key: "food", label: "Food & Drink", icon: "restaurant-outline" },
  { key: "hidden-gems", label: "Hidden Gems", icon: "diamond-outline" },
  { key: "events", label: "Events", icon: "calendar-outline" },
];

export interface PhotoRequest {
  id: string;
  creatorId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  address: string;
  category: Category;
  orientation: Orientation;
  angle: Angle;
  timing: Timing;
  scheduledTime?: string;
  scheduledDate?: string;
  reward: number;
  status: RequestStatus;
  createdAt: string;
  acceptedBy?: string;
  photoUri?: string;
  submittedAt?: string;
  note?: string;
  specificSpotName?: string | null;
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "accepted" | "submitted" | "completed" | "new_request" | "message";
  requestId?: string;
  createdAt: string;
  read: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  earnings: number;
  requestsCreated: number;
  requestsFulfilled: number;
  createdAt?: string;
}

export interface ChatMessage {
  id: string;
  requestId: string;
  senderId: string;
  text: string;
  createdAt: string;
}
