
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/sonner';
import { Tag } from 'lucide-react';
import { Restaurant } from '@/lib/types';

interface UserTag {
  id: string;
  tag_name: string;
  color: string;
}

interface RestaurantTag {
  id: string;
  tag_id: string;
  user_tags: UserTag;
}

interface RestaurantTaggerProps {
  restaurant: Restaurant;
  className?: string;
}

const RestaurantTagger: React.FC<RestaurantTaggerProps> = ({ restaurant, className = '' }) => {
  const { user } = useAuth();
  const [userTags, setUserTags] = useState<UserTag[]>([]);
  const [restaurantTags, setRestaurantTags] = useState<RestaurantTag[]>([]);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user && isDialogOpen) {
      fetchUserTags();
      fetchRestaurantTags();
    }
  }, [user, restaurant.id, isDialogOpen]);

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

  const fetchRestaurantTags = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_tags')
        .select(`
          id,
          tag_id,
          user_tags (
            id,
            tag_name,
            color
          )
        `)
        .eq('user_id', user?.id)
        .eq('restaurant_id', restaurant.id);

      if (error) throw error;
      
      const tags = data || [];
      setRestaurantTags(tags);
      setSelectedTagIds(tags.map(tag => tag.tag_id));
    } catch (error) {
      console.error('Error fetching restaurant tags:', error);
    }
  };

  const handleTagToggle = (tagId: string, checked: boolean) => {
    if (checked) {
      setSelectedTagIds([...selectedTagIds, tagId]);
    } else {
      setSelectedTagIds(selectedTagIds.filter(id => id !== tagId));
    }
  };

  const saveTags = async () => {
    setIsLoading(true);
    try {
      // Get current tag IDs for this restaurant
      const currentTagIds = restaurantTags.map(tag => tag.tag_id);
      
      // Find tags to add and remove
      const tagsToAdd = selectedTagIds.filter(id => !currentTagIds.includes(id));
      const tagsToRemove = currentTagIds.filter(id => !selectedTagIds.includes(id));

      // Remove tags
      if (tagsToRemove.length > 0) {
        const { error: deleteError } = await supabase
          .from('restaurant_tags')
          .delete()
          .eq('user_id', user?.id)
          .eq('restaurant_id', restaurant.id)
          .in('tag_id', tagsToRemove);

        if (deleteError) throw deleteError;
      }

      // Add new tags
      if (tagsToAdd.length > 0) {
        const { error: insertError } = await supabase
          .from('restaurant_tags')
          .insert(
            tagsToAdd.map(tagId => ({
              user_id: user?.id,
              restaurant_id: restaurant.id,
              tag_id: tagId
            }))
          );

        if (insertError) throw insertError;
      }

      await fetchRestaurantTags();
      setIsDialogOpen(false);
      toast.success('Tags updated successfully!');
    } catch (error) {
      console.error('Error saving tags:', error);
      toast.error('Failed to update tags');
    } finally {
      setIsLoading(false);
    }
  };

  const displayTags = restaurantTags.map(tag => tag.user_tags);

  return (
    <div className={className}>
      {displayTags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {displayTags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="text-xs px-2 py-1"
              style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
            >
              {tag.tag_name}
            </Badge>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700">
            <Tag className="h-4 w-4 mr-2" />
            {displayTags.length > 0 ? 'Edit Tags' : 'Add Tags'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tag Restaurant: {restaurant.name}</DialogTitle>
          </DialogHeader>
          
          {userTags.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground mb-4">
                You haven't created any tags yet. Create tags from your profile to organize restaurants.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                {userTags.map((tag) => (
                  <div key={tag.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={tag.id}
                      checked={selectedTagIds.includes(tag.id)}
                      onCheckedChange={(checked) => handleTagToggle(tag.id, checked as boolean)}
                    />
                    <Badge
                      variant="secondary"
                      className="cursor-pointer"
                      style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
                      onClick={() => handleTagToggle(tag.id, !selectedTagIds.includes(tag.id))}
                    >
                      {tag.tag_name}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <Button onClick={saveTags} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Saving...' : 'Save Tags'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantTagger;
