
import { Restaurant, UserPreferences } from '@/lib/types';

// This would be your actual API key from Google Places, Yelp, etc.
// In a production app, this should be stored in environment variables
const API_KEY = 'YOUR_API_KEY';

/**
 * Converts user preferences to API parameters
 */
const buildApiParams = (preferences: UserPreferences) => {
  // Build query parameters based on user preferences
  const params = new URLSearchParams();
  
  // Location parameters (required by most APIs)
  if (preferences.coordinates) {
    params.append('latitude', preferences.coordinates.lat.toString());
    params.append('longitude', preferences.coordinates.lng.toString());
  } else if (preferences.location) {
    params.append('location', preferences.location);
  } else {
    // Default to a location if none provided
    params.append('location', 'San Francisco');
  }
  
  // Add radius (most APIs use meters)
  params.append('radius', '2000'); // 2km default radius
  
  // Add cuisine type if provided
  if (preferences.cuisineType) {
    params.append('categories', preferences.cuisineType.toLowerCase());
  }
  
  // Add price level if provided
  if (preferences.priceRange) {
    // Convert from $ notation to 1-4 notation used by some APIs
    const priceLevel = preferences.priceRange.length.toString();
    params.append('price', priceLevel);
  }
  
  // Additional filters could be added here
  // For open now, dietary restrictions, etc.
  if (preferences.dietaryRestrictions && preferences.dietaryRestrictions.length > 0) {
    // Some APIs allow comma-separated attributes
    params.append('attributes', preferences.dietaryRestrictions.join(',').toLowerCase());
  }
  
  return params;
};

/**
 * Transforms raw API results to our Restaurant type
 */
const transformApiResults = (results: any[]): Restaurant[] => {
  return results.map(item => {
    // Convert price to the correct format based on the Restaurant type
    let priceLevel: '$' | '$$' | '$$$' | '$$$$' = '$$'; // Default
    
    if (item.price) {
      // Ensure priceLevel is one of the allowed values
      switch (item.price) {
        case '$':
        case '1':
          priceLevel = '$';
          break;
        case '$$':
        case '2':
          priceLevel = '$$';
          break;
        case '$$$':
        case '3':
          priceLevel = '$$$';
          break;
        case '$$$$':
        case '4':
          priceLevel = '$$$$';
          break;
        default:
          priceLevel = '$$'; // Default to mid-range if unknown format
      }
    }
    
    // This transformation will depend on the specific API you're using
    return {
      id: item.id || String(Math.random()),
      name: item.name,
      imageUrl: item.image_url || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop',
      cuisineType: item.categories?.[0]?.title || 'Restaurant',
      rating: item.rating || 4.0,
      priceLevel: priceLevel,
      address: item.location?.address1 || 'Address unavailable',
      distance: `${(item.distance / 1609).toFixed(1)} miles`, // Convert meters to miles
      dietaryOptions: [], // These would need to be extracted from the API data if available
      pros: [], // These would typically come from reviews or AI analysis
      cons: [],
      phone: item.phone,
      website: item.url,
      hours: item.hours?.[0]?.open?.map((h: any) => `${h.day}: ${h.start}-${h.end}`) || [],
      allergyInfo: [],
      coordinates: item.coordinates ? {
        lat: item.coordinates.latitude,
        lng: item.coordinates.longitude
      } : undefined
    };
  });
};

/**
 * Mock API function - this simulates an API call
 * In a real implementation, this would fetch from an actual API
 */
const mockFetchFromApi = async (params: URLSearchParams): Promise<any[]> => {
  console.log('API parameters:', Object.fromEntries(params.entries()));
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Return mock data (in a real app, this would be the API response)
  return [
    {
      id: 'real-1',
      name: 'The Local Trattoria',
      image_url: 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?q=80&w=2070&auto=format&fit=crop',
      categories: [{ title: 'Italian' }],
      rating: 4.8,
      price: '$$',
      location: { address1: '123 Main St, Nearby Town' },
      distance: 1200, // meters
      phone: '+1-555-123-4567',
      url: 'https://example.com/local-trattoria',
      coordinates: { latitude: 37.7749, longitude: -122.4194 }
    },
    {
      id: 'real-2',
      name: 'Sakura Sushi',
      image_url: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop',
      categories: [{ title: 'Japanese' }],
      rating: 4.5,
      price: '$$$',
      location: { address1: '456 Oak St, Nearby Town' },
      distance: 800, // meters
      phone: '+1-555-987-6543',
      url: 'https://example.com/sakura-sushi',
      coordinates: { latitude: 37.7739, longitude: -122.4312 }
    },
    {
      id: 'real-3',
      name: 'Green Garden Vegan',
      image_url: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?q=80&w=2070&auto=format&fit=crop',
      categories: [{ title: 'Vegetarian' }],
      rating: 4.7,
      price: '$$',
      location: { address1: '789 Pine Ave, Nearby Town' },
      distance: 1500, // meters
      phone: '+1-555-789-0123',
      url: 'https://example.com/green-garden',
      coordinates: { latitude: 37.7831, longitude: -122.4100 }
    },
    {
      id: 'real-4',
      name: 'Spice Paradise',
      image_url: 'https://images.unsplash.com/photo-1535850836387-0f9dfce30846?q=80&w=2070&auto=format&fit=crop',
      categories: [{ title: 'Indian' }],
      rating: 4.6,
      price: '$$',
      location: { address1: '321 Curry Lane, Nearby Town' },
      distance: 1100, // meters
      phone: '+1-555-456-7890',
      url: 'https://example.com/spice-paradise',
      coordinates: { latitude: 37.7712, longitude: -122.4231 }
    },
    {
      id: 'real-5',
      name: 'Taco Fiesta',
      image_url: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=2080&auto=format&fit=crop',
      categories: [{ title: 'Mexican' }],
      rating: 4.3,
      price: '$',
      location: { address1: '567 Salsa Street, Nearby Town' },
      distance: 950, // meters
      phone: '+1-555-234-5678',
      url: 'https://example.com/taco-fiesta',
      coordinates: { latitude: 37.7792, longitude: -122.4153 }
    }
  ];
};

/**
 * Function to search for restaurants based on user preferences
 */
export const searchRestaurants = async (preferences: UserPreferences): Promise<Restaurant[]> => {
  try {
    // Build API parameters from user preferences
    const params = buildApiParams(preferences);
    
    // In a real implementation, you would fetch from an actual API endpoint
    // For example: const response = await fetch(`https://api.yelp.com/v3/businesses/search?${params}`, { headers: {...} });
    
    // For now, use our mock API function
    const results = await mockFetchFromApi(params);
    
    // Transform the results to match our Restaurant type
    return transformApiResults(results);
    
  } catch (error) {
    console.error('Error searching restaurants:', error);
    return [];
  }
};

/**
 * Function to process natural language restaurant queries
 * In a real implementation, this would call an LLM API like OpenAI
 */
export const processNaturalLanguageQuery = async (query: string): Promise<UserPreferences> => {
  // In a real implementation, this would send the query to an AI model
  // For now, we'll use simple keyword matching
  const lowerQuery = query.toLowerCase();
  
  const preferences: UserPreferences = {
    dietaryRestrictions: [],
    allergies: [],
    useCurrentLocation: true,
  };
  
  // Extract cuisine types
  if (lowerQuery.includes('italian') || lowerQuery.includes('pasta') || lowerQuery.includes('pizza')) {
    preferences.cuisineType = 'Italian';
  } else if (lowerQuery.includes('japanese') || lowerQuery.includes('sushi')) {
    preferences.cuisineType = 'Japanese';
  } else if (lowerQuery.includes('chinese')) {
    preferences.cuisineType = 'Chinese';
  } else if (lowerQuery.includes('mexican') || lowerQuery.includes('taco')) {
    preferences.cuisineType = 'Mexican';
  } else if (lowerQuery.includes('indian') || lowerQuery.includes('curry') || lowerQuery.includes('spicy')) {
    preferences.cuisineType = 'Indian';
  } else if (lowerQuery.includes('thai')) {
    preferences.cuisineType = 'Thai';
  } else if (lowerQuery.includes('vegetarian') || lowerQuery.includes('vegan')) {
    preferences.cuisineType = 'Vegetarian';
  }
  
  // Extract dietary restrictions
  if (lowerQuery.includes('vegetarian')) {
    preferences.dietaryRestrictions.push('Vegetarian');
  }
  if (lowerQuery.includes('vegan')) {
    preferences.dietaryRestrictions.push('Vegan');
  }
  if (lowerQuery.includes('gluten') && lowerQuery.includes('free')) {
    preferences.dietaryRestrictions.push('Gluten-Free');
  }
  if (lowerQuery.includes('halal')) {
    preferences.dietaryRestrictions.push('Halal');
  }
  if (lowerQuery.includes('kosher')) {
    preferences.dietaryRestrictions.push('Kosher');
  }
  if (lowerQuery.includes('dairy') && lowerQuery.includes('free')) {
    preferences.dietaryRestrictions.push('Dairy-Free');
  }
  if (lowerQuery.includes('nut') && lowerQuery.includes('free')) {
    preferences.dietaryRestrictions.push('Nut-Free');
  }
  
  // Extract price range
  if (lowerQuery.includes('cheap') || lowerQuery.includes('inexpensive') || lowerQuery.includes('budget')) {
    preferences.priceRange = '$';
  } else if (lowerQuery.includes('moderate') || lowerQuery.includes('mid-range')) {
    preferences.priceRange = '$$';
  } else if (lowerQuery.includes('expensive') || lowerQuery.includes('high-end')) {
    preferences.priceRange = '$$$';
  } else if (lowerQuery.includes('luxury') || lowerQuery.includes('fine dining')) {
    preferences.priceRange = '$$$$';
  }
  
  // Extract location preferences
  if (lowerQuery.includes('near me') || lowerQuery.includes('nearby') || lowerQuery.includes('close by')) {
    preferences.useCurrentLocation = true;
  }
  
  // Extract distance preferences (miles)
  const distanceRegex = /within (\d+) miles?/i;
  const distanceMatch = lowerQuery.match(distanceRegex);
  if (distanceMatch && distanceMatch[1]) {
    const miles = parseInt(distanceMatch[1], 10);
    const meters = miles * 1609; // Convert miles to meters
    const radiusParam = new URLSearchParams();
    radiusParam.append('radius', meters.toString());
  }
  
  // Extract "open now" preference
  if (lowerQuery.includes('open now') || lowerQuery.includes('currently open')) {
    const openNowParam = new URLSearchParams();
    openNowParam.append('open_now', 'true');
  }
  
  // Extract specific allergy information
  const allergyKeywords = {
    'peanut': 'Peanuts',
    'nut': 'Tree Nuts',
    'dairy': 'Milk',
    'egg': 'Eggs',
    'fish': 'Fish',
    'shellfish': 'Shellfish',
    'wheat': 'Wheat',
    'gluten': 'Wheat',
    'soy': 'Soy'
  };
  
  Object.entries(allergyKeywords).forEach(([keyword, allergyName]) => {
    if ((lowerQuery.includes(`no ${keyword}`) || 
         lowerQuery.includes(`${keyword} allergy`) ||
         lowerQuery.includes(`${keyword}-free`)) && 
        !preferences.allergies.includes(allergyName)) {
      preferences.allergies.push(allergyName);
    }
  });
  
  return preferences;
};

/**
 * Function to get restaurant details
 */
export const getRestaurantDetails = async (id: string): Promise<Restaurant | null> => {
  try {
    // In a real implementation, fetch the restaurant details from API
    if (id === 'real-1') {
      return {
        id: 'real-1',
        name: 'The Local Trattoria',
        imageUrl: 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?q=80&w=2070&auto=format&fit=crop',
        cuisineType: 'Italian',
        rating: 4.8,
        priceLevel: '$$',
        address: '123 Main St, Nearby Town',
        distance: '0.7 miles',
        dietaryOptions: ['Vegetarian Options', 'Gluten-Free Options'],
        pros: ['Authentic Italian cuisine', 'Homemade pasta', 'Great wine selection', 'Cozy atmosphere'],
        cons: ['Can be busy on weekends', 'Limited parking nearby'],
        phone: '+1-555-123-4567',
        website: 'https://example.com/local-trattoria',
        hours: [
          'Monday - Thursday: 11:00 AM - 10:00 PM',
          'Friday - Saturday: 11:00 AM - 11:00 PM',
          'Sunday: 12:00 PM - 9:00 PM'
        ],
        allergyInfo: ['Contains: Wheat, Dairy', 'Ask server for complete allergen information'],
        coordinates: {
          lat: 37.7749,
          lng: -122.4194
        }
      };
    } else if (id === 'real-2') {
      return {
        id: 'real-2',
        name: 'Sakura Sushi',
        imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=2070&auto=format&fit=crop',
        cuisineType: 'Japanese',
        rating: 4.5,
        priceLevel: '$$$',
        address: '456 Oak St, Nearby Town',
        distance: '0.5 miles',
        dietaryOptions: ['Vegetarian Options', 'Gluten-Free Options Available'],
        pros: ['Fresh fish daily', 'Authentic Japanese techniques', 'Great sake selection', 'Elegant ambiance'],
        cons: ['Higher price point', 'Wait times on weekends'],
        phone: '+1-555-987-6543',
        website: 'https://example.com/sakura-sushi',
        hours: [
          'Monday - Thursday: 12:00 PM - 10:00 PM',
          'Friday - Saturday: 12:00 PM - 11:00 PM',
          'Sunday: 1:00 PM - 9:00 PM'
        ],
        allergyInfo: ['Contains: Fish, Shellfish, Soy', 'Ask server about cross-contamination concerns'],
        coordinates: {
          lat: 37.7739,
          lng: -122.4312
        }
      };
    } else if (id === 'real-3') {
      return {
        id: 'real-3',
        name: 'Green Garden Vegan',
        imageUrl: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?q=80&w=2070&auto=format&fit=crop',
        cuisineType: 'Vegetarian',
        rating: 4.7,
        priceLevel: '$$',
        address: '789 Pine Ave, Nearby Town',
        distance: '0.9 miles',
        dietaryOptions: ['Vegan', 'Gluten-Free', 'Organic', 'Nut-Free Options'],
        pros: ['100% plant-based menu', 'Locally sourced ingredients', 'Great atmosphere', 'Friendly staff'],
        cons: ['Limited parking', 'Can get crowded during peak hours'],
        phone: '+1-555-789-0123',
        website: 'https://example.com/green-garden',
        hours: [
          'Monday - Friday: 10:00 AM - 9:00 PM',
          'Saturday - Sunday: 9:00 AM - 10:00 PM'
        ],
        allergyInfo: ['Nut-free options available', 'Kitchen handles wheat products', 'Ask about soy allergies'],
        coordinates: {
          lat: 37.7831,
          lng: -122.4100
        }
      };
    }
    
    // Return null if restaurant not found
    return null;
    
  } catch (error) {
    console.error('Error getting restaurant details:', error);
    return null;
  }
};

/**
 * Generate personalized restaurant recommendations based on previous choices
 * This would be more sophisticated in a real app with actual user data
 */
export const generatePersonalizedRecommendations = async (
  previousChoices: string[],
  location: { lat: number; lng: number } | null
): Promise<Restaurant[]> => {
  // In a real app, you would analyze previous choices and make recommendations
  // For now, just return some mock restaurants
  const mockRecommendations: Restaurant[] = [
    {
      id: 'rec-1',
      name: 'Recommended Place 1',
      imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2074&auto=format&fit=crop',
      cuisineType: 'Fusion',
      rating: 4.7,
      priceLevel: '$$',
      address: '101 Recommendation Ave, Nearby Town',
      distance: '1.2 miles',
      dietaryOptions: ['Vegetarian Options', 'Gluten-Free Options'],
      pros: ['Innovative menu', 'Great for date nights', 'Excellent service'],
      cons: ['Reservations recommended', 'Limited menu options'],
      phone: '+1-555-777-8888',
      website: 'https://example.com/recommended-place-1',
      hours: ['Daily: 11:00 AM - 10:00 PM'],
      allergyInfo: ['Contains various allergens', 'Ask server for details'],
      coordinates: location || { lat: 37.7749, lng: -122.4194 }
    }
  ];
  
  return mockRecommendations;
};
