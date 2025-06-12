
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Restaurant as RestaurantType } from '@/lib/types';
import RestaurantDetails from '@/components/RestaurantDetails';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getRestaurantDetails } from '@/services/restaurantApi';

const Restaurant = () => {
  const { id } = useParams<{id: string}>();
  const [restaurant, setRestaurant] = useState<RestaurantType | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRestaurant = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Use our API service to fetch restaurant details
        const restaurantData = await getRestaurantDetails(id);
        
        if (restaurantData) {
          setRestaurant(restaurantData);
        } else {
          console.error("Restaurant not found");
        }
      } catch (error) {
        console.error("Error fetching restaurant:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurant();
  }, [id]);

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-8">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft size={18} className="mr-2" />
            Back to Results
          </Button>
        </Link>
        
        {loading ? (
          <div className="h-96 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-foodRed"></div>
          </div>
        ) : restaurant ? (
          <RestaurantDetails restaurant={restaurant} />
        ) : (
          <div className="h-96 flex items-center justify-center">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-2">Restaurant not found</h3>
              <p className="text-foodGray">The restaurant you're looking for doesn't exist or has been removed.</p>
              <Button variant="default" className="mt-4 bg-foodRed hover:bg-foodRed/90" asChild>
                <Link to="/">Go Back Home</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Restaurant;
