
import { Link } from 'react-router-dom';
import { Restaurant } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import StarRating from './StarRating';
import SaveButton from './SaveButton';
import { MapPin } from 'lucide-react';

interface RestaurantCardProps {
  restaurant: Restaurant;
}

const RestaurantCard: React.FC<RestaurantCardProps> = ({ restaurant }) => {
  return (
    <div className="relative">
      <Link to={`/restaurant/${restaurant.id}`}>
        <Card className="restaurant-card h-full overflow-hidden border border-border hover:border-foodRed/30">
          <div className="relative h-48 overflow-hidden">
            <img 
              src={restaurant.imageUrl} 
              alt={restaurant.name} 
              className="w-full h-full object-cover"
            />
            <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded text-sm font-medium">
              {restaurant.priceLevel}
            </div>
          </div>
          <CardContent className="p-4">
            <h3 className="text-lg font-bold mb-1 line-clamp-1">{restaurant.name}</h3>
            <div className="flex items-center mb-2">
              <StarRating rating={restaurant.rating} size={14} />
            </div>
            <p className="text-foodGray text-sm mb-2">{restaurant.cuisineType}</p>
            <div className="flex items-center text-sm text-foodGray">
              <MapPin size={14} className="mr-1" />
              <span className="line-clamp-1">{restaurant.address}</span>
            </div>
            
            {restaurant.distance && (
              <div className="mt-2 text-sm text-foodGray">
                <span className="font-medium">{restaurant.distance}</span> away
              </div>
            )}
            
            {restaurant.dietaryOptions && restaurant.dietaryOptions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {restaurant.dietaryOptions.slice(0, 3).map((option, index) => (
                  <span 
                    key={index} 
                    className="text-xs px-2 py-0.5 bg-muted rounded-full"
                  >
                    {option}
                  </span>
                ))}
                {restaurant.dietaryOptions.length > 3 && (
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-full">
                    +{restaurant.dietaryOptions.length - 3}
                  </span>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
      
      {/* Save button positioned absolutely */}
      <div className="absolute top-2 left-2 z-10">
        <SaveButton 
          restaurant={restaurant} 
          className="bg-white/80 backdrop-blur-sm hover:bg-white/90 rounded-full p-2"
        />
      </div>
    </div>
  );
};

export default RestaurantCard;
