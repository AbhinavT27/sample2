
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/sonner';
import { Bookmark, Loader2, Trash2, Filter } from 'lucide-react';
import { Restaurant } from '@/lib/types';
import RestaurantCard from '@/components/RestaurantCard';
import Header from '@/components/Header';
import TagManager from '@/components/TagManager';

interface UserTag {
  id: string;
  tag_name: string;
  color: string;
}

const SavedList = () => {
  const { user } = useAuth();
  const [savedRestaurants, setSavedRestaurants] = useState<Restaurant[]>([]);
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [selectedTagId, setSelectedTagId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchSavedRestaurants();
      fetchUserTags();
    }
  }, [user, selectedTagId]);

  const fetchUserTags = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', user?.id)
        .order('tag_name');

      if (error) throw error;
      setUserTags(data || []);
    } catch (error) {
      console.error('Error fetching user tags:', error);
    }
  };

  const fetchSavedRestaurants = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('saved_restaurants')
        .select('*')
        .eq('user_id', user?.id);

      // If a tag is selected, filter by restaurants with that tag
      if (selectedTagId) {
        const { data: taggedRestaurantIds, error: tagError } = await supabase
          .from('restaurant_tags')
          .select('restaurant_id')
          .eq('user_id', user?.id)
          .eq('tag_id', selectedTagId);

        if (tagError) throw tagError;

        const restaurantIds = taggedRestaurantIds?.map(item => item.restaurant_id) || [];
        
        if (restaurantIds.length === 0) {
          setSavedRestaurants([]);
          setIsLoading(false);
          return;
        }

        query = query.in('restaurant_id', restaurantIds);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Extract restaurant data from the restaurant_data column with proper type conversion
      const restaurants = data?.map(item => item.restaurant_data as unknown as Restaurant) || [];
      setSavedRestaurants(restaurants);
    } catch (error: any) {
      console.error('Error fetching saved restaurants:', error);
      toast.error('Failed to load saved restaurants');
    } finally {
      setIsLoading(false);
    }
  };

  const removeFromSavedList = async (restaurantId: string) => {
    try {
      const { error } = await supabase
        .from('saved_restaurants')
        .delete()
        .eq('user_id', user?.id)
        .eq('restaurant_id', restaurantId);

      if (error) throw error;

      setSavedRestaurants(savedRestaurants.filter(r => r.id !== restaurantId));
      toast.success('Restaurant removed from saved list');
    } catch (error: any) {
      console.error('Error removing restaurant:', error);
      toast.error('Failed to remove restaurant');
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow">
        <div className="container max-w-6xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Tags sidebar */}
            <div className="lg:col-span-1">
              <TagManager onTagsChange={fetchUserTags} />
              
              {userTags.length > 0 && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Filter className="h-5 w-5" />
                      Filter by Tag
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Button
                        variant={selectedTagId === '' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setSelectedTagId('')}
                        className="w-full justify-start"
                      >
                        All Restaurants
                      </Button>
                      {userTags.map((tag) => (
                        <Button
                          key={tag.id}
                          variant={selectedTagId === tag.id ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSelectedTagId(tag.id)}
                          className="w-full justify-start"
                        >
                          <Badge
                            variant="secondary"
                            className="mr-2 text-xs"
                            style={{ backgroundColor: tag.color + '20', color: tag.color }}
                          >
                            {tag.tag_name}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Main content */}
            <div className="lg:col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    <Bookmark className="h-6 w-6 text-foodRed" />
                    My Saved Restaurants
                    {selectedTagId && (
                      <Badge variant="secondary" className="ml-2">
                        Filtered by: {userTags.find(t => t.id === selectedTagId)?.tag_name}
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <Loader2 className="h-8 w-8 animate-spin text-foodRed" />
                    </div>
                  ) : savedRestaurants.length === 0 ? (
                    <div className="text-center py-10">
                      <p className="text-muted-foreground">
                        {selectedTagId 
                          ? "No restaurants found with this tag." 
                          : "You haven't saved any restaurants yet."
                        }
                      </p>
                      <Button 
                        variant="outline" 
                        className="mt-4"
                        onClick={() => window.location.href = '/home'}
                      >
                        Explore Restaurants
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {savedRestaurants.map((restaurant) => (
                        <div key={restaurant.id} className="relative">
                          <Button 
                            variant="destructive"
                            size="sm"
                            className="absolute top-2 right-2 z-10"
                            onClick={() => removeFromSavedList(restaurant.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                          <RestaurantCard restaurant={restaurant} />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SavedList;
