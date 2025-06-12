
import { Restaurant } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import StarRating from './StarRating';
import { MapPin, Phone, Globe, Clock, Heart } from 'lucide-react';
import { useState } from 'react';

interface RestaurantDetailsProps {
  restaurant: Restaurant;
}

const RestaurantDetails: React.FC<RestaurantDetailsProps> = ({ restaurant }) => {
  const [isSaved, setIsSaved] = useState(false);

  const toggleSave = () => {
    setIsSaved(!isSaved);
  };

  return (
    <div className="space-y-6">
      <div className="relative h-64 md:h-80 lg:h-96 overflow-hidden rounded-xl">
        <img 
          src={restaurant.imageUrl} 
          alt={restaurant.name} 
          className="w-full h-full object-cover"
        />
        <Button
          variant="outline" 
          size="icon"
          className={`absolute top-4 right-4 rounded-full bg-white ${
            isSaved ? 'text-foodRed' : 'text-foodGray'
          }`}
          onClick={toggleSave}
        >
          <Heart size={20} className={isSaved ? 'fill-foodRed' : ''} />
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:justify-between md:items-center">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl md:text-3xl font-bold">{restaurant.name}</h1>
            <span className="text-lg font-medium text-foodGray">{restaurant.priceLevel}</span>
          </div>
          <div className="flex items-center mt-1">
            <StarRating rating={restaurant.rating} size={18} />
          </div>
          <p className="text-foodGray mt-1">{restaurant.cuisineType}</p>
        </div>
        
        <div className="mt-4 md:mt-0">
          <Button variant="default" className="bg-foodRed hover:bg-foodRed/90">
            Book a Table
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Information</h3>
            
            <div className="flex items-start space-x-3">
              <MapPin className="text-foodRed w-5 h-5 mt-0.5" />
              <div>
                <p className="font-medium">Address</p>
                <p className="text-foodGray">{restaurant.address}</p>
              </div>
            </div>
            
            {restaurant.phone && (
              <div className="flex items-start space-x-3">
                <Phone className="text-foodRed w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Phone</p>
                  <p className="text-foodGray">{restaurant.phone}</p>
                </div>
              </div>
            )}
            
            {restaurant.website && (
              <div className="flex items-start space-x-3">
                <Globe className="text-foodRed w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Website</p>
                  <a 
                    href={restaurant.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-foodRed hover:underline"
                  >
                    {restaurant.website.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              </div>
            )}
            
            {restaurant.hours && restaurant.hours.length > 0 && (
              <div className="flex items-start space-x-3">
                <Clock className="text-foodRed w-5 h-5 mt-0.5" />
                <div>
                  <p className="font-medium">Hours</p>
                  <ul className="text-foodGray">
                    {restaurant.hours.map((hour, idx) => (
                      <li key={idx}>{hour}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 space-y-4">
            <h3 className="font-semibold text-lg">Feedback Highlights</h3>
            
            {restaurant.pros.length > 0 && (
              <div>
                <p className="font-medium text-green-600 mb-2">What people love:</p>
                <ul className="list-disc list-inside space-y-1">
                  {restaurant.pros.map((pro, idx) => (
                    <li key={idx} className="text-foodGray">{pro}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {restaurant.cons.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-red-500 mb-2">What could be better:</p>
                <ul className="list-disc list-inside space-y-1">
                  {restaurant.cons.map((con, idx) => (
                    <li key={idx} className="text-foodGray">{con}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
        
        {(restaurant.dietaryOptions.length > 0 || (restaurant.allergyInfo && restaurant.allergyInfo.length > 0)) && (
          <Card className="md:col-span-2">
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-4">Dietary Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {restaurant.dietaryOptions.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Dietary Options:</p>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.dietaryOptions.map((option, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-muted rounded-full text-sm"
                        >
                          {option}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {restaurant.allergyInfo && restaurant.allergyInfo.length > 0 && (
                  <div>
                    <p className="font-medium mb-2">Allergy Information:</p>
                    <div className="flex flex-wrap gap-2">
                      {restaurant.allergyInfo.map((item, idx) => (
                        <span 
                          key={idx}
                          className="px-3 py-1 bg-muted rounded-full text-sm"
                        >
                          {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default RestaurantDetails;
