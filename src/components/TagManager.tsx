
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/components/ui/sonner';
import { Plus, X, Tag } from 'lucide-react';

interface UserTag {
  id: string;
  tag_name: string;
  color: string;
  created_at: string;
}

interface TagManagerProps {
  onTagsChange?: () => void;
}

const TagManager: React.FC<TagManagerProps> = ({ onTagsChange }) => {
  const { user } = useAuth();
  const [tags, setTags] = useState<UserTag[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3B82F6');
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const defaultColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B', 
    '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'
  ];

  useEffect(() => {
    if (user) {
      fetchTags();
    }
  }, [user]);

  const fetchTags = async () => {
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setTags(data || []);
    } catch (error) {
      console.error('Error fetching tags:', error);
      toast.error('Failed to load tags');
    }
  };

  const createTag = async () => {
    if (!newTagName.trim()) {
      toast.error('Please enter a tag name');
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_tags')
        .insert({
          user_id: user?.id,
          tag_name: newTagName.trim(),
          color: newTagColor
        })
        .select()
        .single();

      if (error) throw error;

      setTags([...tags, data]);
      setNewTagName('');
      setNewTagColor('#3B82F6');
      setIsDialogOpen(false);
      toast.success('Tag created successfully!');
      onTagsChange?.();
    } catch (error: any) {
      console.error('Error creating tag:', error);
      if (error.code === '23505') {
        toast.error('A tag with this name already exists');
      } else {
        toast.error('Failed to create tag');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from('user_tags')
        .delete()
        .eq('id', tagId)
        .eq('user_id', user?.id);

      if (error) throw error;

      setTags(tags.filter(tag => tag.id !== tagId));
      toast.success('Tag deleted successfully');
      onTagsChange?.();
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tag className="h-5 w-5" />
          My Tags
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <Badge
              key={tag.id}
              variant="secondary"
              className="flex items-center gap-1 px-3 py-1"
              style={{ backgroundColor: tag.color + '20', color: tag.color, borderColor: tag.color }}
            >
              {tag.tag_name}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => deleteTag(tag.id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          ))}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="tagName">Tag Name</Label>
                <Input
                  id="tagName"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Enter tag name..."
                  maxLength={50}
                />
              </div>
              
              <div>
                <Label>Color</Label>
                <div className="flex gap-2 mt-2">
                  {defaultColors.map((color) => (
                    <button
                      key={color}
                      onClick={() => setNewTagColor(color)}
                      className={`w-8 h-8 rounded-full border-2 ${
                        newTagColor === color ? 'border-gray-800' : 'border-gray-300'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={createTag} disabled={isLoading} className="flex-1">
                  {isLoading ? 'Creating...' : 'Create Tag'}
                </Button>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default TagManager;
