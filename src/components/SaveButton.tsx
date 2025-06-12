
import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';
import { Restaurant } from '@/lib/types';
import RestaurantTagger from './RestaurantTagger';

interface SaveButtonProps {
  restaurant: Restaurant;
  className?: string;
}

const SaveButton: React.FC<SaveButtonProps> = ({ restaurant, className = '' }) => {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if restaurant is already saved
  useEffect(() => {
    if (user) {
      checkIfSaved();
    }
  }, [user, restaurant.id]);

  const checkIfSaved = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('saved_restaurants')
        .select('id')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurant.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setIsSaved(!!data);
    } catch (error) {
      console.error('Error checking if restaurant is saved:', error);
    }
  };

  const handleSaveToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please log in to save restaurants');
      return;
    }

    setIsLoading(true);

    try {
      if (isSaved) {
        // Remove from saved list
        const { error } = await supabase
          .from('saved_restaurants')
          .delete()
          .eq('user_id', user.id)
          .eq('restaurant_id', restaurant.id);

        if (error) throw error;

        setIsSaved(false);
        toast.success('Restaurant removed from saved list');
      } else {
        // Add to saved list - convert Restaurant to Json
        const { error } = await supabase
          .from('saved_restaurants')
          .insert({
            user_id: user.id,
            restaurant_id: restaurant.id,
            restaurant_data: restaurant as any
          });

        if (error) throw error;

        setIsSaved(true);
        toast.success('Restaurant saved successfully!');
      }
    } catch (error: any) {
      console.error('Error toggling save status:', error);
      toast.error('Failed to update saved status');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${className} flex flex-col gap-2`}>
      <Button
        variant="ghost"
        size="sm"
        onClick={handleSaveToggle}
        disabled={isLoading}
        className={`${isSaved ? 'text-foodRed' : 'text-gray-400'} hover:text-foodRed`}
      >
        <Heart 
          className={`h-5 w-5 ${isSaved ? 'fill-current' : ''}`} 
        />
      </Button>
      
      <RestaurantTagger restaurant={restaurant} />
    </div>
  );
};

export default SaveButton;
