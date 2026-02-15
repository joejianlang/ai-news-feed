'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Common Canadian cities for manual selection
// Common Canadian cities grouped by Province
export const POPULAR_CITIES = [
    {
        province: 'Ontario',
        cities: [
            { name: 'Toronto', tag: '#Toronto' },
            { name: 'Markham', tag: '#Markham' },
            { name: 'Richmond Hill', tag: '#RichmondHill' },
            { name: 'Mississauga', tag: '#Mississauga' },
            { name: 'Scarborough', tag: '#Scarborough' },
            { name: 'Waterloo', tag: '#Waterloo' },
            { name: 'Kitchener', tag: '#Kitchener' },
            { name: 'Cambridge', tag: '#Cambridge' },
            { name: 'Guelph', tag: '#Guelph' },
            { name: 'Ottawa', tag: '#Ottawa' },
            { name: 'Oakville', tag: '#Oakville' },
            { name: 'Burlington', tag: '#Burlington' },
            { name: 'Hamilton', tag: '#Hamilton' },
            { name: 'London', tag: '#London' },
            { name: 'Windsor', tag: '#Windsor' },
            { name: 'Niagara Falls', tag: '#Niagara' },
        ]
    },
    {
        province: 'British Columbia',
        cities: [
            { name: 'Vancouver', tag: '#Vancouver' },
            { name: 'Richmond', tag: '#Richmond' },
            { name: 'Burnaby', tag: '#Burnaby' },
            { name: 'Coquitlam', tag: '#Coquitlam' },
            { name: 'Surrey', tag: '#Surrey' },
            { name: 'Victoria', tag: '#Victoria' },
        ]
    },
    {
        province: 'Alberta',
        cities: [
            { name: 'Calgary', tag: '#Calgary' },
            { name: 'Edmonton', tag: '#Edmonton' },
        ]
    },
    {
        province: 'Quebec',
        cities: [
            { name: 'Montreal', tag: '#Montreal' },
            { name: 'Quebec City', tag: '#Quebec' },
        ]
    }
];

// Helper to get flat city list for matching
const ALL_CITIES_FLAT = POPULAR_CITIES.flatMap(p => p.cities);

// Fallback translation mapping for UI consistency
const CITY_NAME_MAPPING: Record<string, string> = {
    '多伦多': 'Toronto',
    '温哥华': 'Vancouver',
    '蒙特利尔': 'Montreal',
    '卡尔加里': 'Calgary',
    '渥太华': 'Ottawa',
    '埃德蒙顿': 'Edmonton',
    '列治文': 'Richmond',
    '万锦': 'Markham',
    '贵湖': 'Guelph',
    '圭尔夫': 'Guelph',
    '密西沙加': 'Mississauga',
    '滑铁卢': 'Waterloo',
};

interface LocationContextType {
    city: string | null;           // Current city name (e.g. "多伦多")
    cityTag: string | null;        // Current city tag (e.g. "#多伦多")
    isLocating: boolean;           // Is currently fetching location
    error: string | null;          // Location error message
    detectLocation: () => Promise<void>; // Function to trigger detection
    setManualCity: (tag: string) => void; // Function to manually set city
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
    const [city, setCity] = useState<string | null>(null);
    const [cityTag, setCityTag] = useState<string | null>(null);
    const [isLocating, setIsLocating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Load from localStorage on mount
    useEffect(() => {
        let savedTag = localStorage.getItem('user_city_tag');
        let savedCity = localStorage.getItem('user_city_name');

        // Anti-migration: If saved city is Chinese, try to translate it or clear it
        if (savedCity && CITY_NAME_MAPPING[savedCity]) {
            savedCity = CITY_NAME_MAPPING[savedCity];
            savedTag = `#${savedCity}`;
            localStorage.setItem('user_city_tag', savedTag);
            localStorage.setItem('user_city_name', savedCity);
        }

        if (savedTag && savedCity) {
            setCityTag(savedTag);
            setCity(savedCity);
        }
    }, []);

    const setManualCity = (tag: string) => {
        const found = ALL_CITIES_FLAT.find(c => c.tag === tag);
        const name = found ? found.name : tag.replace('#', '');

        setCity(name);
        setCityTag(tag);
        setError(null);

        localStorage.setItem('user_city_tag', tag);
        localStorage.setItem('user_city_name', name);
    };

    const detectLocation = async () => {
        if (!navigator.geolocation) {
            setError('您的浏览器不支持地理位置功能');
            return;
        }

        setIsLocating(true);
        setError(null);

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;

                    // Use OpenStreetMap Nominatim for reverse geocoding
                    const response = await fetch(
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=en`
                    );

                    if (!response.ok) throw new Error('Geocoding failed');

                    const data = await response.json();
                    const address = data.address;

                    // Try to match standard cities
                    const detectedCity = address.city || address.town || address.village || address.county;

                    if (detectedCity) {
                        // Normalize detectedCity if it's in our mapping
                        const normalizedCity = CITY_NAME_MAPPING[detectedCity] || detectedCity;

                        // Simple mapping logic (can be expanded)
                        let matchedTag = null;
                        let matchedName = null;

                        // 1. Try exact English match from list
                        const exactMatch = ALL_CITIES_FLAT.find(c => normalizedCity.toLowerCase().includes(c.name.toLowerCase()));
                        if (exactMatch) {
                            matchedTag = exactMatch.tag;
                            matchedName = exactMatch.name;
                        } else {
                            // Default to English names if not in the popular list
                            matchedName = normalizedCity;
                            matchedTag = `#${normalizedCity}`;
                        }

                        setCity(matchedName);
                        setCityTag(matchedTag);

                        localStorage.setItem('user_city_tag', matchedTag);
                        localStorage.setItem('user_city_name', matchedName);
                    } else {
                        setError('Could not identify your city');
                    }
                } catch (err) {
                    console.error('Location detection failed:', err);
                    setError('Failed to get location name');
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('Location permission denied or failed');
                setIsLocating(false);
            }
        );
    };

    return (
        <LocationContext.Provider value={{ city, cityTag, isLocating, error, detectLocation, setManualCity }}>
            {children}
        </LocationContext.Provider>
    );
}

export function useLocation() {
    const context = useContext(LocationContext);
    if (context === undefined) {
        throw new Error('useLocation must be used within a LocationProvider');
    }
    return context;
}
