
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '@/components/Header';
import SearchForm from '@/components/SearchForm';
import RestaurantCard from '@/components/RestaurantCard';
import { UserPreferences, Restaurant } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/sonner';
import { searchRestaurants, generatePersonalizedRecommendations } from '@/services/restaurantApi';

const Index = () => {
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: [],
    allergies: [],
    useCurrentLocation: true,
  });
  const [searchResults, setSearchResults] = useState<Restaurant[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [previousSearches, setPreviousSearches] = useState<string[]>([]);
  
  // Get user's location when component mounts
  useEffect(() => {
    if (preferences.useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          toast.error("Couldn't access your location. Please check your browser settings.");
        }
      );
    }
  }, []);
  
  // Get personalized recommendations based on previous choices
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['recommendations', previousSearches, userLocation],
    queryFn: () => generatePersonalizedRecommendations(previousSearches, userLocation),
    enabled: !hasSearched && previousSearches.length > 0 && userLocation !== null,
    staleTime: 1000 * 60 * 15 // 15 minutes
  });
  
  const handleSearch = async (searchPreferences: UserPreferences) => {
    setIsLoading(true);
    
    console.log('Searching with preferences:', searchPreferences);
    
    try {
      // Call our API service to get real restaurant data
      const results = await searchRestaurants(searchPreferences);
      
      setSearchResults(results);
      setHasSearched(true);
      
      // Add search to previous searches for personalization
      if (searchPreferences.cuisineType) {
        setPreviousSearches(prev => 
          [searchPreferences.cuisineType as string, ...prev].slice(0, 5)
        );
      }
      
      if (results.length > 0) {
        toast.success(`Found ${results.length} restaurants that match your preferences!`, {
          position: 'top-center',
        });
      } else {
        toast.error("No restaurants found matching your criteria. Try adjusting your preferences.", {
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error searching restaurants:', error);
      toast.error("An error occurred while searching for restaurants.", {
        position: 'top-center',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({
      ...prev,
      ...newPreferences
    }));
  };

  const triggerSearch = () => {
    handleSearch({
      ...preferences,
      searchQuery: ''
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        {/* Hero Section */}
        {!hasSearched && (
          <div 
            className="bg-cover bg-center py-16 md:py-24"
            style={{ 
              backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.6), rgba(0,0,0,0.3)), url(https://images.unsplash.com/photo-1555396273-367ea4eb4db5?q=80&w=2074&auto=format&fit=crop)'
            }}
          >
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center text-white mb-8">
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">Find Your Perfect Dining Experience</h1>
                <p className="text-lg md:text-xl opacity-90 mb-8">
                  DineFineAI helps you discover restaurants that fit your dietary needs, preferences, and location.
                </p>
              </div>
              
              <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-xl p-6">
                <SearchForm onSearch={handleSearch} />
              </div>
            </div>
          </div>
        )}
        
        {/* Search Results */}
        {hasSearched && (
          <div className="container mx-auto px-4 py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <h2 className="text-2xl font-bold mb-2 md:mb-0">
                {searchResults.length > 0 
                  ? `Found ${searchResults.length} restaurants` 
                  : "No restaurants found"}
              </h2>
              <Button 
                variant="outline" 
                onClick={() => setHasSearched(false)}
                className="self-start"
              >
                Modify Search
              </Button>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foodRed"></div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {searchResults.map(restaurant => (
                  <RestaurantCard key={restaurant.id} restaurant={restaurant} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="text-center max-w-md">
                  <h3 className="text-xl font-semibold mb-2">No restaurants found</h3>
                  <p className="text-foodGray mb-6">
                    We couldn't find any restaurants matching your criteria. Try adjusting your search preferences.
                  </p>
                  <Button 
                    variant="default" 
                    className="bg-foodRed hover:bg-foodRed/90"
                    onClick={() => setHasSearched(false)}
                  >
                    Start a New Search
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Recommendations (when not searching) */}
        {!hasSearched && previousSearches.length > 0 && recommendations && recommendations.length > 0 && (
          <div className="container mx-auto px-4 py-12">
            <h2 className="text-2xl font-bold mb-6">Recommended For You</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.map(restaurant => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant} />
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
