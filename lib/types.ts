export type Role = "seeker" | "lokater";

export type Orientation = "portrait" | "landscape";
export type Angle = "looking-up" | "eye-level" | "looking-down";
export type Timing = "now" | "scheduled";
export type RequestStatus = "open" | "claimed" | "submitted" | "completed";

export interface PhotoRequest {
  id: string;
  seekerId: string;
  latitude: number;
  longitude: number;
  locationName: string;
  orientation: Orientation;
  angle: Angle;
  timing: Timing;
  scheduledTime?: string;
  reward: number;
  status: RequestStatus;
  createdAt: string;
  claimedBy?: string;
  photoUri?: string;
  submittedAt?: string;
  note?: string;
}

export interface UserProfile {
  role: Role;
  name: string;
  earnings: number;
  requestsCreated: number;
  requestsFulfilled: number;
}
