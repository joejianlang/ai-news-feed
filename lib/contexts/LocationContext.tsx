'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Common Canadian cities for manual selection
export const POPULAR_CITIES = [
    { name: 'Toronto', tag: '#Toronto' },
    { name: 'Vancouver', tag: '#Vancouver' },
    { name: 'Montreal', tag: '#Montreal' },
    { name: 'Calgary', tag: '#Calgary' },
    { name: 'Ottawa', tag: '#Ottawa' },
    { name: 'Edmonton', tag: '#Edmonton' },
    { name: 'Richmond', tag: '#Richmond' },
    { name: 'Markham', tag: '#Markham' },
];

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
        const savedTag = localStorage.getItem('user_city_tag');
        const savedCity = localStorage.getItem('user_city_name');
        if (savedTag && savedCity) {
            setCityTag(savedTag);
            setCity(savedCity);
        } else {
            // Default to Toronto if nothing saved (optional, or leave null for "All Local")
            // setManualCity('#多伦多'); 
        }
    }, []);

    const setManualCity = (tag: string) => {
        const found = POPULAR_CITIES.find(c => c.tag === tag);
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
                        // Simple mapping logic (can be expanded)
                        let matchedTag = null;
                        let matchedName = null;

                        // 1. Try exact English match from list
                        const exactMatch = POPULAR_CITIES.find(c => detectedCity.toLowerCase().includes(c.name.toLowerCase()));
                        if (exactMatch) {
                            matchedTag = exactMatch.tag;
                            matchedName = exactMatch.name;
                        } else {
                            // Default to English names if not in the popular list
                            matchedName = detectedCity;
                            matchedTag = `#${detectedCity}`;
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
