
export interface UserPreferences {
  searchQuery?: string;
  cuisineType?: string;
  priceRange?: '$' | '$$' | '$$$' | '$$$$';
  dietaryRestrictions: string[];
  allergies: string[];
  useCurrentLocation: boolean;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Restaurant {
  id: string;
  name: string;
  imageUrl: string;
  cuisineType: string;
  rating: number;
  priceLevel: '$' | '$$' | '$$$' | '$$$$';
  address: string;
  distance: string;
  dietaryOptions: string[];
  pros: string[];
  cons: string[];
  // Adding missing properties
  phone?: string;
  website?: string;
  hours?: string[];
  allergyInfo?: string[];
  coordinates?: {
    lat: number;
    lng: number;
  };
}
