export type UserRole = "CUSTOMER" | "ADMIN";

export interface UserSession {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

export type PaintingStatus = "AVAILABLE" | "SOLD";

export interface Painting {
  id: string;
  title: string;
  description: string;
  price: number;
  dimensions: string;
  medium: string;
  imageUrl: string;
  status: PaintingStatus;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = "PLACED" | "CANCELLED";

export interface Order {
  id: string;
  userId: string;
  paintingId: string;
  amount: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
  painting?: Painting;
}

export type BookingStatus = "REQUESTED" | "CONFIRMED" | "DECLINED" | "CANCELLED";

export interface WallBooking {
  id: string;
  userId: string;
  bookingDate: string; // YYYY-MM-DD
  wallSizeSqFt: number;
  ratePerSqFt: number;
  totalPrice: number;
  address: string;
  notes?: string | null;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export type PotteryStatus = "REQUESTED" | "ACCEPTED" | "DECLINED" | "CANCELLED";

export interface PotteryRequest {
  id: string;
  userId: string;
  item: string;
  glaze: string;
  quantity: number;
  neededByDate: string; // YYYY-MM-DD
  notes?: string | null;
  status: PotteryStatus;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface PotterySeedItem {
  id: string;
  name: string;
  description: string;
  basePrice: number;
}

export interface PotterySeedGlaze {
  id: string;
  name: string;
  hexColor: string;
  finish: string;
}
