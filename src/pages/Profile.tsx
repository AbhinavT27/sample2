import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

// Same dietary and allergy options from SearchForm component
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

const Profile = () => {
  const navigate = useNavigate();
  const { user, userPreferences, refreshUserPreferences, isNewUser, setIsNewUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isProfileFromUrl, setIsProfileFromUrl] = useState(false);
  
  // Form states
  const [username, setUsername] = useState(userPreferences?.username || '');
  const [phoneNumber, setPhoneNumber] = useState(userPreferences?.phone_number || '');
  
  // Dietary preferences and allergies management
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(
    userPreferences?.dietary_preferences || []
  );
  const [allergies, setAllergies] = useState<string[]>(
    userPreferences?.allergies || []
  );
  
  // New item inputs
  const [newDietaryPreference, setNewDietaryPreference] = useState('');
  const [newAllergy, setNewAllergy] = useState('');

  useEffect(() => {
    // Check URL params to see if user is newly registered
    const params = new URLSearchParams(window.location.search);
    const newUserParam = params.get('newUser') === 'true';
    
    if (newUserParam) {
      setIsProfileFromUrl(true);
      setIsNewUser(true);
    }
    
    // Update form when userPreferences changes
    if (userPreferences) {
      setUsername(userPreferences.username || '');
      setPhoneNumber(userPreferences.phone_number || '');
      setDietaryPreferences(userPreferences.dietary_preferences || []);
      setAllergies(userPreferences.allergies || []);
    }
  }, [userPreferences, setIsNewUser]);
  
  // Handle dietary preference checkbox change
  const handleDietaryChange = (option: string) => {
    setDietaryPreferences(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };
  
  // Handle allergy checkbox change
  const handleAllergyChange = (option: string) => {
    setAllergies(prev => {
      if (prev.includes(option)) {
        return prev.filter(item => item !== option);
      } else {
        return [...prev, option];
      }
    });
  };
  
  // Add new dietary preference
  const addDietaryPreference = () => {
    if (!newDietaryPreference.trim()) return;
    
    // Check if already exists
    if (dietaryPreferences.includes(newDietaryPreference.trim())) {
      toast.error('This dietary preference already exists');
      return;
    }
    
    setDietaryPreferences([...dietaryPreferences, newDietaryPreference.trim()]);
    setNewDietaryPreference('');
  };
  
  // Remove dietary preference
  const removeDietaryPreference = (preference: string) => {
    setDietaryPreferences(dietaryPreferences.filter(item => item !== preference));
  };
  
  // Add new allergy
  const addAllergy = () => {
    if (!newAllergy.trim()) return;
    
    // Check if already exists
    if (allergies.includes(newAllergy.trim())) {
      toast.error('This allergy already exists');
      return;
    }
    
    setAllergies([...allergies, newAllergy.trim()]);
    setNewAllergy('');
  };
  
  // Remove allergy
  const removeAllergy = (allergy: string) => {
    setAllergies(allergies.filter(item => item !== allergy));
  };
  
  // Navigate to home after skipping preferences
  const handleSkip = () => {
    setIsNewUser(false); // No longer a new user
    navigate('/home');
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('You must be logged in to update your profile');
      navigate('/auth');
      return;
    }
    
    setIsLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          phone_number: phoneNumber,
          dietary_preferences: dietaryPreferences,
          allergies
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      // Refresh user data in context
      await refreshUserPreferences();
      
      setIsNewUser(false); // No longer a new user after saving
      
      // Remove newUser parameter from URL if present
      if (isProfileFromUrl) {
        navigate('/home', { replace: true });
      } else {
        toast.success('Profile updated successfully');
        navigate('/home');
      }
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      {isNewUser && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-md">
          <p className="text-blue-700 font-medium">Welcome to DineFineAI!</p>
          <p className="text-blue-600">Please take a moment to set up your profile with your dietary preferences and allergies to get personalized restaurant recommendations.</p>
        </div>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Your Profile</CardTitle>
          <CardDescription>
            Update your profile information and preferences
          </CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* Account Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Account Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input 
                    id="username" 
                    value={username} 
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Your username"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    value={user?.email} 
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input 
                    id="phone" 
                    value={phoneNumber} 
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
            </div>
            
            {/* Dietary Preferences */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Dietary Preferences</h3>
              <p className="text-sm text-muted-foreground">
                Select your dietary preferences to help us find the best restaurants for you
              </p>
              
              {/* Dietary checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {dietaryOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`dietary-${option}`}
                      checked={dietaryPreferences.includes(option)}
                      onCheckedChange={() => handleDietaryChange(option)}
                    />
                    <Label htmlFor={`dietary-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
              
              {/* Custom dietary preferences that are already added */}
              <div className="flex flex-wrap gap-2">
                {dietaryPreferences
                  .filter(pref => !dietaryOptions.includes(pref))
                  .map((preference) => (
                    <Badge key={preference} variant="secondary" className="py-1.5">
                      {preference}
                      <button 
                        type="button"
                        onClick={() => removeDietaryPreference(preference)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {preference}</span>
                      </button>
                    </Badge>
                  ))}
              </div>
              
              {/* Add custom dietary preference */}
              <div className="flex space-x-2">
                <Input 
                  value={newDietaryPreference}
                  onChange={(e) => setNewDietaryPreference(e.target.value)}
                  placeholder="Add a custom dietary preference"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addDietaryPreference}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
            
            {/* Allergies */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Allergies</h3>
              <p className="text-sm text-muted-foreground">
                Select any food allergies to help us find safe restaurants for you
              </p>
              
              {/* Allergy checkboxes */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {allergyOptions.map((option) => (
                  <div key={option} className="flex items-center space-x-2">
                    <Checkbox
                      id={`allergy-${option}`}
                      checked={allergies.includes(option)}
                      onCheckedChange={() => handleAllergyChange(option)}
                    />
                    <Label htmlFor={`allergy-${option}`} className="text-sm">{option}</Label>
                  </div>
                ))}
              </div>
              
              {/* Custom allergies that are already added */}
              <div className="flex flex-wrap gap-2">
                {allergies
                  .filter(allergy => !allergyOptions.includes(allergy))
                  .map((allergy) => (
                    <Badge key={allergy} variant="secondary" className="py-1.5">
                      {allergy}
                      <button 
                        type="button"
                        onClick={() => removeAllergy(allergy)}
                        className="ml-1 text-muted-foreground hover:text-foreground"
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Remove {allergy}</span>
                      </button>
                    </Badge>
                  ))}
              </div>
              
              {/* Add custom allergy */}
              <div className="flex space-x-2">
                <Input 
                  value={newAllergy}
                  onChange={(e) => setNewAllergy(e.target.value)}
                  placeholder="Add a custom allergy"
                  className="flex-1"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addAllergy}
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="flex justify-between">
            <Button 
              type="button"
              variant="outline"
              onClick={() => navigate('/')}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? 'Saving changes...' : 'Save changes'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Profile;
