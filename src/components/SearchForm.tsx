import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { UserPreferences } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Search, Filter, MapPin, Mic, MicOff, Send, Save } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { processNaturalLanguageQuery } from '@/services/restaurantApi';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface SearchFormProps {
  onSearch: (preferences: UserPreferences) => void;
}

const dietaryOptions = [
  'Vegetarian',
  'Vegan',
  'Gluten-Free',
  'Halal',
  'Kosher',
  'Dairy-Free',
  'Nut-Free'
];

const allergyOptions = [
  'Peanuts',
  'Tree Nuts',
  'Milk',
  'Eggs',
  'Fish',
  'Shellfish',
  'Wheat',
  'Soy'
];

const cuisineTypes = [
  'Italian',
  'Chinese',
  'Mexican',
  'Indian',
  'Japanese',
  'Thai',
  'American',
  'Mediterranean',
  'French'
];

const priceRanges = [
  { label: 'Budget ($0 - $15)', value: '$' },
  { label: 'Moderate ($15 - $30)', value: '$$' },
  { label: 'High-End ($30 - $60)', value: '$$$' },
  { label: 'Fine Dining ($60+)', value: '$$$$' }
];

const SearchForm: React.FC<SearchFormProps> = ({ onSearch }) => {
  const { userPreferences, refreshUserPreferences, user } = useAuth();
  
  // Initialize preferences from userPreferences if available
  const [preferences, setPreferences] = useState<UserPreferences>({
    dietaryRestrictions: userPreferences?.dietary_preferences || [],
    allergies: userPreferences?.allergies || [],
    useCurrentLocation: true,
    coordinates: undefined,
  });
  
  // Update the preferences when userPreferences change
  useEffect(() => {
    if (userPreferences) {
      setPreferences(prev => ({
        ...prev,
        dietaryRestrictions: userPreferences.dietary_preferences || [],
        allergies: userPreferences.allergies || []
      }));
    }
  }, [userPreferences]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentAddress, setCurrentAddress] = useState('');
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // AI Chat integration
  const [isChatMode, setIsChatMode] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Custom input fields for dietary and allergies
  const [customDietary, setCustomDietary] = useState('');
  const [customAllergy, setCustomAllergy] = useState('');

  // Get the user's current location
  const getUserLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser");
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsGettingLocation(true);
    setLocationError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Update preferences with coordinates
        setPreferences(prev => ({
          ...prev,
          coordinates: { lat: latitude, lng: longitude }
        }));
        
        try {
          // Reverse geocode to get address
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          
          if (!response.ok) {
            throw new Error("Failed to fetch address");
          }
          
          const data = await response.json();
          const address = data.display_name || "Address not found";
          
          setCurrentAddress(address);
          setIsGettingLocation(false);
        } catch (error) {
          console.error("Error getting address:", error);
          setCurrentAddress(`Location found (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);
          setIsGettingLocation(false);
        }
      },
      (error) => {
        setIsGettingLocation(false);
        
        let errorMessage = "Unknown error occurred while getting location";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please allow location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        setLocationError(errorMessage);
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  // Initialize location when component mounts or when useCurrentLocation changes
  useEffect(() => {
    if (preferences.useCurrentLocation && !currentAddress && !isGettingLocation) {
      getUserLocation();
    } else if (!preferences.useCurrentLocation) {
      // Clear the current address if user wants to enter manually
      setCurrentAddress('');
      setPreferences(prev => ({
        ...prev,
        coordinates: undefined
      }));
    }
  }, [preferences.useCurrentLocation]);

  const handleDietaryChange = (option: string) => {
    setPreferences(prev => {
      if (prev.dietaryRestrictions.includes(option)) {
        return {
          ...prev,
          dietaryRestrictions: prev.dietaryRestrictions.filter(item => item !== option)
        };
      } else {
        return {
          ...prev,
          dietaryRestrictions: [...prev.dietaryRestrictions, option]
        };
      }
    });
  };

  const handleAllergyChange = (option: string) => {
    setPreferences(prev => {
      if (prev.allergies.includes(option)) {
        return {
          ...prev,
          allergies: prev.allergies.filter(item => item !== option)
        };
      } else {
        return {
          ...prev,
          allergies: [...prev.allergies, option]
        };
      }
    });
  };

  // Save dietary preferences and allergies to user profile
  const handleSavePreferences = async () => {
    if (!user) {
      toast.error("You need to be logged in to save preferences");
      return;
    }

    setIsSaving(true);
    try {
      // Get all dietary preferences and allergies from state
      // This includes both checked items and custom items
      const allDietaryPreferences = [...preferences.dietaryRestrictions];
      const allAllergies = [...preferences.allergies];
      
      console.log("Saving preferences to Supabase:", {
        dietary: allDietaryPreferences,
        allergies: allAllergies
      });
      
      const { error } = await supabase
        .from('profiles')
        .update({
          dietary_preferences: allDietaryPreferences,
          allergies: allAllergies
        })
        .eq('id', user.id);

      if (error) throw error;
      
      await refreshUserPreferences();
      toast.success("Preferences saved successfully!");
    } catch (error: any) {
      console.error("Error saving preferences:", error);
      toast.error("Failed to save preferences");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePriceChange = (value: string) => {
    // Ensure the value is one of the allowed price range values
    if (['$', '$$', '$$$', '$$$$'].includes(value)) {
      setPreferences(prev => ({
        ...prev,
        priceRange: value as '$' | '$$' | '$$$' | '$$$$'
      }));
    }
  };

  const handleCuisineChange = (value: string) => {
    setPreferences(prev => ({
      ...prev,
      cuisineType: value === prev.cuisineType ? undefined : value
    }));
  };

  const handleLocationToggle = () => {
    setPreferences(prev => ({
      ...prev,
      useCurrentLocation: !prev.useCurrentLocation
    }));

    if (!preferences.useCurrentLocation) {
      // User is enabling current location, trigger location request
      getUserLocation();
    } else {
      // Clear the current address if user wants to enter manually
      setCurrentAddress('');
      setPreferences(prev => ({
        ...prev,
        coordinates: undefined
      }));
    }
  };

  // Voice recognition functions
  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast.error("Speech recognition is not supported in your browser");
      return;
    }

    setIsListening(true);
    
    // @ts-ignore - WebkitSpeechRecognition is not in the TypeScript types
    const recognition = new window.webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
      processAiQuery(transcript);
    };
    
    recognition.onerror = () => {
      setIsListening(false);
      toast.error("Error occurred in speech recognition");
    };
    
    recognition.onend = () => {
      setIsListening(false);
    };
    
    recognition.start();
  };

  // Process AI query
  const processAiQuery = async (query: string) => {
    setAiResponse(null);
    setIsTyping(true);
    
    try {
      // Use our NLP function to extract preferences from the query
      const extractedPreferences = await processNaturalLanguageQuery(query);
      
      // Create an appropriate response based on the extracted preferences
      let response = '';
      
      if (extractedPreferences.cuisineType) {
        response = `I'll look for ${extractedPreferences.cuisineType} restaurants near your location.`;
      } else if (extractedPreferences.dietaryRestrictions.length > 0) {
        response = `Looking for restaurants with ${extractedPreferences.dietaryRestrictions.join(', ')} options.`;
      } else if (extractedPreferences.priceRange) {
        let priceDesc = '';
        switch (extractedPreferences.priceRange) {
          case '$': priceDesc = 'budget-friendly'; break;
          case '$$': priceDesc = 'moderately priced'; break;
          case '$$$': priceDesc = 'upscale'; break;
          case '$$$$': priceDesc = 'fine dining'; break;
        }
        response = `Searching for ${priceDesc} restaurants in your area.`;
      } else {
        response = `Searching for "${query}" near your location.`;
      }
      
      // Update preferences based on AI understanding
      setPreferences(prev => ({
        ...prev,
        ...extractedPreferences
      }));
      
      setAiResponse(response);
      setIsTyping(false);
      
      // Auto-search after a delay
      setTimeout(() => {
        handleSubmit(new Event('submit') as any);
      }, 1500);
      
    } catch (error) {
      console.error('Error processing query:', error);
      setAiResponse('Sorry, I had trouble understanding that. Let\'s try again.');
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Prepare search preferences
    const searchPreferences = {
      ...preferences,
      searchQuery
    };
    
    onSearch(searchPreferences);
    
    // Simulate loading
    setTimeout(() => {
      setIsLoading(false);
      setAiResponse(null); // Clear AI response after search
      setIsChatMode(false); // Exit chat mode after search
    }, 1500);
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (searchQuery.trim()) {
        if (isChatMode) {
          processAiQuery(searchQuery);
        } else {
          handleSubmit(e);
        }
      }
    }
  };

  // Add custom dietary restriction
  const handleAddCustomDietary = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customDietary.trim()) {
      if (preferences.dietaryRestrictions.includes(customDietary.trim())) {
        toast.error('This dietary preference already exists');
        return;
      }

      setPreferences(prev => ({
        ...prev,
        dietaryRestrictions: [...prev.dietaryRestrictions, customDietary.trim()]
      }));
      setCustomDietary('');
      e.preventDefault();
    }
  };

  // Add custom allergy
  const handleAddCustomAllergy = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && customAllergy.trim()) {
      if (preferences.allergies.includes(customAllergy.trim())) {
        toast.error('This allergy already exists');
        return;
      }

      setPreferences(prev => ({
        ...prev,
        allergies: [...prev.allergies, customAllergy.trim()]
      }));
      setCustomAllergy('');
      e.preventDefault();
    }
  };

  // Get display text for dietary & allergies
  const getDietaryAllergyDisplayText = () => {
    const totalSelections = preferences.dietaryRestrictions.length + preferences.allergies.length;
    
    if (totalSelections === 0) {
      return null;
    }
    
    if (totalSelections === 1) {
      if (preferences.dietaryRestrictions.length === 1) {
        return preferences.dietaryRestrictions[0];
      } else {
        return preferences.allergies[0];
      }
    }
    
    // Check for any custom entries (those not in the original lists)
    const hasCustomDietary = preferences.dietaryRestrictions.some(
      item => !dietaryOptions.includes(item)
    );
    
    const hasCustomAllergy = preferences.allergies.some(
      item => !allergyOptions.includes(item)
    );
    
    let displayText = `${totalSelections} selected`;
    if (hasCustomDietary || hasCustomAllergy) {
      displayText += " (Custom)";
    }
    
    return displayText;
  };

  // Get display text for price range
  const getPriceRangeDisplayText = () => {
    if (!preferences.priceRange) {
      return "Price Range";
    }
    
    return "Price Range";
  };

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div className="flex flex-col space-y-4">
        <div className="relative">
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={isChatMode ? "Ask me about restaurants..." : "What are you craving today?"}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleInputKeyDown}
            className="search-input pl-10 pr-16 py-6 text-lg shadow-sm rounded-xl"
          />
          
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
            {isChatMode ? 
              <Mic className={`text-${isListening ? 'foodRed' : 'foodGray'} cursor-pointer`} onClick={startListening} /> :
              <Search className="text-foodGray" />
            }
          </div>
          
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
            {searchQuery && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  if (isChatMode) {
                    processAiQuery(searchQuery);
                  } else {
                    setIsChatMode(true);
                    processAiQuery(searchQuery);
                  }
                }}
                className="h-8 w-8 rounded-full"
              >
                <Send className="h-4 w-4 text-foodRed" />
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setIsChatMode(!isChatMode)}
              className={`h-8 w-8 rounded-full ${isChatMode ? 'bg-foodRed text-white' : ''}`}
            >
              {isListening ? 
                <MicOff className="h-4 w-4" /> :
                <Mic className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>
        
        {/* AI Response Message */}
        {(isTyping || aiResponse) && (
          <div className="bg-muted p-3 rounded-lg text-sm animate-fade-in">
            {isTyping ? (
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-foodGray animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-foodGray animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 rounded-full bg-foodGray animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            ) : (
              <p>{aiResponse}</p>
            )}
          </div>
        )}
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                type="button"
                className="flex-1 justify-start text-left font-normal"
              >
                <Filter className="mr-2 h-4 w-4" />
                <span>Dietary & Allergies</span>
                {getDietaryAllergyDisplayText() && (
                  <span className="ml-auto text-xs text-foodGray">
                    {getDietaryAllergyDisplayText()}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0">
              <div className="p-4 max-h-96 overflow-y-auto">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Dietary Preferences</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {dietaryOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`dietary-${option}`}
                            checked={preferences.dietaryRestrictions.includes(option)}
                            onCheckedChange={() => handleDietaryChange(option)}
                          />
                          <Label htmlFor={`dietary-${option}`} className="text-sm">{option}</Label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Input
                        placeholder="Add custom dietary need"
                        value={customDietary}
                        onChange={(e) => setCustomDietary(e.target.value)}
                        onKeyDown={handleAddCustomDietary}
                        className="text-sm"
                      />
                      {preferences.dietaryRestrictions.some(item => !dietaryOptions.includes(item)) && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Custom dietary needs:</p>
                          <div className="flex flex-wrap gap-1">
                            {preferences.dietaryRestrictions
                              .filter(item => !dietaryOptions.includes(item))
                              .map(item => (
                                <div key={item} className="bg-muted text-xs px-2 py-1 rounded-md flex items-center">
                                  {item}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-1"
                                    onClick={() => handleDietaryChange(item)}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Allergies</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {allergyOptions.map((option) => (
                        <div key={option} className="flex items-center space-x-2">
                          <Checkbox
                            id={`allergy-${option}`}
                            checked={preferences.allergies.includes(option)}
                            onCheckedChange={() => handleAllergyChange(option)}
                          />
                          <Label htmlFor={`allergy-${option}`} className="text-sm">{option}</Label>
                        </div>
                      ))}
                    </div>
                    <div className="mt-2">
                      <Input
                        placeholder="Add custom allergy"
                        value={customAllergy}
                        onChange={(e) => setCustomAllergy(e.target.value)}
                        onKeyDown={handleAddCustomAllergy}
                        className="text-sm"
                      />
                      {preferences.allergies.some(item => !allergyOptions.includes(item)) && (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground mb-1">Custom allergies:</p>
                          <div className="flex flex-wrap gap-1">
                            {preferences.allergies
                              .filter(item => !allergyOptions.includes(item))
                              .map(item => (
                                <div key={item} className="bg-muted text-xs px-2 py-1 rounded-md flex items-center">
                                  {item}
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    className="h-4 w-4 p-0 ml-1"
                                    onClick={() => handleAllergyChange(item)}
                                  >
                                    ×
                                  </Button>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {user && (
                    <div className="pt-2 border-t">
                      <Button 
                        type="button" 
                        className="w-full" 
                        onClick={handleSavePreferences}
                        disabled={isSaving}
                      >
                        <Save className="mr-2 h-4 w-4" />
                        {isSaving ? "Saving..." : "Save Preferences"}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                type="button"
                className="flex-1 justify-start text-left font-normal"
              >
                <MapPin className="mr-2 h-4 w-4" />
                {preferences.useCurrentLocation ? 'Current Location' : 'Enter Location'}
                {preferences.useCurrentLocation && currentAddress && (
                  <span className="ml-2 text-xs text-foodGray truncate max-w-[120px]">
                    ({currentAddress})
                  </span>
                )}
                {isGettingLocation && (
                  <span className="ml-2 text-xs text-foodGray animate-pulse">
                    (Getting location...)
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4">
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="use-current-location"
                    checked={preferences.useCurrentLocation}
                    onCheckedChange={handleLocationToggle}
                  />
                  <Label htmlFor="use-current-location">Use current location</Label>
                </div>
                
                {preferences.useCurrentLocation && (
                  <div>
                    {isGettingLocation ? (
                      <div className="pl-6 text-sm text-foodGray animate-pulse">
                        Getting your location...
                      </div>
                    ) : locationError ? (
                      <div className="pl-6 text-sm text-red-500">
                        {locationError}
                        <Button 
                          variant="link" 
                          className="p-0 h-auto text-sm text-blue-500"
                          onClick={getUserLocation}
                        >
                          Try again
                        </Button>
                      </div>
                    ) : currentAddress && (
                      <div className="pl-6 text-sm text-foodGray break-words">
                        {currentAddress}
                      </div>
                    )}
                  </div>
                )}
                
                {!preferences.useCurrentLocation && (
                  <div>
                    <Label htmlFor="location-input" className="sr-only">Enter location</Label>
                    <Input
                      id="location-input"
                      placeholder="Enter address, city, or zip code"
                      value={preferences.location || ''}
                      onChange={(e) => setPreferences(prev => ({ ...prev, location: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                type="button"
                className="flex-1 justify-start text-left font-normal"
              >
                <span>Cuisine Type</span>
                {preferences.cuisineType && (
                  <span className="ml-auto text-xs text-foodGray">{preferences.cuisineType}</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="space-y-2">
                {cuisineTypes.map((cuisine) => (
                  <div
                    key={cuisine}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      preferences.cuisineType === cuisine ? 'bg-foodRed text-white' : 'hover:bg-muted'
                    }`}
                    onClick={() => handleCuisineChange(cuisine)}
                  >
                    {cuisine}
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
          
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                type="button"
                className="flex-1 justify-start text-left font-normal"
              >
                <span>Price Range</span>
                {preferences.priceRange && (
                  <span className="ml-auto text-xs text-foodGray">
                    {priceRanges.find(range => range.value === preferences.priceRange)?.label} ({preferences.priceRange})
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-4">
              <div className="space-y-2">
                {priceRanges.map((range) => (
                  <div
                    key={range.value}
                    className={`px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      preferences.priceRange === range.value ? 'bg-foodRed text-white' : 'hover:bg-muted'
                    }`}
                    onClick={() => handlePriceChange(range.value)}
                  >
                    <span>{range.label}</span>
                    <span className="float-right font-medium">{range.value}</span>
                  </div>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        </div>
        
        <Button 
          type="submit" 
          className="bg-foodRed hover:bg-foodRed/90 py-6 text-lg"
          disabled={isLoading}
        >
          {isLoading ? "Finding restaurants..." : "Find Restaurants"}
        </Button>
      </div>
    </form>
  );
};

export default SearchForm;
