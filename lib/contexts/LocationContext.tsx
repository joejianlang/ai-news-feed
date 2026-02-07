'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

// Common Canadian cities for manual selection
export const POPULAR_CITIES = [
    { name: '多伦多', tag: '#多伦多' },
    { name: '温哥华', tag: '#温哥华' },
    { name: '蒙特利尔', tag: '#蒙特利尔' },
    { name: '卡尔加里', tag: '#卡尔加里' },
    { name: '渥太华', tag: '#渥太华' },
    { name: '埃德蒙顿', tag: '#埃德蒙顿' },
    { name: '列治文', tag: '#列治文' },
    { name: '万锦', tag: '#万锦' },
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
                        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&accept-language=zh`
                    );

                    if (!response.ok) throw new Error('Geocoding failed');

                    const data = await response.json();
                    const address = data.address;

                    // Try to match standard cities
                    // Nominatim returns: city, town, village, county, state, etc.
                    const detectedCity = address.city || address.town || address.village || address.county;

                    if (detectedCity) {
                        // Simple mapping logic (can be expanded)
                        // If detected "Toronto", find "#多伦多" logic
                        let matchedTag = null;
                        let matchedName = null;

                        // 1. Try exact Chinese match from list
                        const exactMatch = POPULAR_CITIES.find(c => detectedCity.includes(c.name));
                        if (exactMatch) {
                            matchedTag = exactMatch.tag;
                            matchedName = exactMatch.name;
                        } else {
                            // 2. If it's English name ("Toronto"), map it
                            // Since we requested `accept-language=zh`, it should be Chinese ideally.
                            // But fallback:
                            if (detectedCity.includes('Toronto')) { matchedTag = '#多伦多'; matchedName = '多伦多'; }
                            else if (detectedCity.includes('Vancouver')) { matchedTag = '#温哥华'; matchedName = '温哥华'; }
                            else if (detectedCity.includes('Montreal')) { matchedTag = '#蒙特利尔'; matchedName = '蒙特利尔'; }
                            else if (detectedCity.includes('Calgary')) { matchedTag = '#卡尔加里'; matchedName = '卡尔加里'; }
                            else if (detectedCity.includes('Ottawa')) { matchedTag = '#渥太华'; matchedName = '渥太华'; }
                            else if (detectedCity.includes('Richmond')) { matchedTag = '#列治文'; matchedName = '列治文'; }
                            else if (detectedCity.includes('Markham')) { matchedTag = '#万锦'; matchedName = '万锦'; }
                            else {
                                // If unknown city, just use the name as tag
                                matchedName = detectedCity;
                                matchedTag = `#${detectedCity}`;
                            }
                        }

                        setCity(matchedName);
                        setCityTag(matchedTag);

                        localStorage.setItem('user_city_tag', matchedTag);
                        localStorage.setItem('user_city_name', matchedName);
                    } else {
                        setError('无法识别您的城市');
                    }
                } catch (err) {
                    console.error('Location detection failed:', err);
                    setError('获取位置名称失败');
                } finally {
                    setIsLocating(false);
                }
            },
            (err) => {
                console.error('Geolocation error:', err);
                setError('获取位置权限被拒绝或失败');
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
