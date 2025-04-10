'use client';

import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

enum MealType {
  BREAKFAST = 'BREAKFAST',
  LUNCH = 'LUNCH',
  DINNER = 'DINNER',
  CAFE = 'CAFE'
}

interface Restaurant {
  name: string;
  address: string;
  lat: number;
  lng: number;
  types: MealType[];
  openingHours?: string;
  category: string;
}

// 한밭대학교 국제교류관 좌표
const HANBAT_LOCATION = {
  lat: 36.3516,
  lng: 127.2986
};

const SEARCH_RADIUS = 1000; // 1km in meters

const getMealTimeByHour = (hour: number): MealType => {
  if (hour >= 6 && hour < 11) return MealType.BREAKFAST;
  if (hour >= 11 && hour < 16) return MealType.LUNCH;
  return MealType.DINNER;
};

// 영업시간을 기반으로 식당의 시간대 결정
const getMealTypesByHours = (openingHours?: string): MealType[] => {
  // 영업시간 정보가 없는 경우 모든 시간대에 포함
  if (!openingHours) {
    return [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];
  }

  const types: MealType[] = [];
  const now = new Date();
  const currentHour = now.getHours();

  // 24시간 영업인 경우
  if (openingHours.includes('24시간') || openingHours.includes('00:00-24:00')) {
    return [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];
  }

  // 아침 영업 (6시-11시)
  if (currentHour >= 6 && currentHour < 11) {
    types.push(MealType.BREAKFAST);
  }

  // 점심 영업 (11시-16시)
  if (currentHour >= 11 && currentHour < 16) {
    types.push(MealType.LUNCH);
  }

  // 저녁 영업 (16시-23시)
  if (currentHour >= 16 || currentHour < 6) {
    types.push(MealType.DINNER);
  }

  // 영업시간 정보가 있지만 파싱이 어려운 경우 모든 시간대에 포함
  return types.length > 0 ? types : [MealType.BREAKFAST, MealType.LUNCH, MealType.DINNER];
};

const getMealTimeText = (type: MealType): string => {
  switch (type) {
    case MealType.BREAKFAST:
      return '아침';
    case MealType.LUNCH:
      return '점심';
    case MealType.DINNER:
      return '저녁';
    case MealType.CAFE:
      return '카페';
    default:
      return '';
  }
};

export default function Home() {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [currentMarker, setCurrentMarker] = useState<any>(null);
  const [currentInfoWindow, setCurrentInfoWindow] = useState<any>(null);
  const [isMapLoading, setIsMapLoading] = useState(true);

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current || !window.kakao?.maps) {
        console.log('Map container or Kakao maps not ready');
        return;
      }

      try {
        const center = new window.kakao.maps.LatLng(HANBAT_LOCATION.lat, HANBAT_LOCATION.lng);
        const options = {
          center,
          level: 3
        };

        const mapInstance = new window.kakao.maps.Map(mapRef.current, options);
        setMap(mapInstance);

        // 1km 반경 원 그리기
        const circle = new window.kakao.maps.Circle({
          center,
          radius: SEARCH_RADIUS,
          strokeWeight: 2,
          strokeColor: '#75B8FA',
          strokeOpacity: 0.8,
          fillColor: '#CFE7FF',
          fillOpacity: 0.3
        });
        circle.setMap(mapInstance);

        // 초기 식당 검색
        searchNearbyRestaurants(mapInstance);
        setIsMapLoading(false);
      } catch (error) {
        console.error('Failed to initialize map:', error);
        setIsMapLoading(false);
      }
    };

    // 지도 초기화 시도
    if (window.kakao?.maps) {
      initializeMap();
    } else {
      const checkKakaoMaps = setInterval(() => {
        if (window.kakao?.maps) {
          initializeMap();
          clearInterval(checkKakaoMaps);
        }
      }, 100);

      // 10초 후에도 로드되지 않으면 인터벌 제거
      setTimeout(() => {
        clearInterval(checkKakaoMaps);
        if (!map) {
          console.error('Failed to load Kakao maps');
          setIsMapLoading(false);
        }
      }, 10000);

      return () => {
        clearInterval(checkKakaoMaps);
      };
    }

    return () => {
      if (currentMarker) currentMarker.setMap(null);
      if (currentInfoWindow) currentInfoWindow.close();
    };
  }, []);

  const searchNearbyRestaurants = (mapInstance: any) => {
    if (!mapInstance || !window.kakao?.maps?.services) return;

    const places = new window.kakao.maps.services.Places();
    const searchOptions = {
      location: new window.kakao.maps.LatLng(HANBAT_LOCATION.lat, HANBAT_LOCATION.lng),
      radius: SEARCH_RADIUS,
      sort: window.kakao.maps.services.SortBy.DISTANCE
    };

    // 검색할 키워드 목록
    const restaurantKeywords = [
      '음식점', '식당', '한식', '중식', '일식', '양식', 
      '분식', '치킨', '피자', '햄버거'
    ];

    const cafeKeywords = ['카페', '커피'];

    // 중복 제거를 위한 Map (장소 ID를 키로 사용)
    const uniquePlaces = new Map();
    let totalSearches = restaurantKeywords.length + cafeKeywords.length;
    let completedSearches = 0;

    // 음식점 검색
    restaurantKeywords.forEach(keyword => {
      places.keywordSearch(
        keyword,
        (result: any[], status: string) => {
          if (status === window.kakao.maps.services.Status.OK) {
            result.forEach(place => {
              // 카페/커피숍 카테고리는 제외
              if (!place.category_name.includes('카페') && 
                  !place.category_name.includes('커피') && 
                  !uniquePlaces.has(place.id)) {
                uniquePlaces.set(place.id, {
                  name: place.place_name,
                  address: place.address_name,
                  lat: parseFloat(place.y),
                  lng: parseFloat(place.x),
                  types: getMealTypesByHours(place.opening_hours),
                  openingHours: place.opening_hours,
                  category: 'restaurant'
                });
              }
            });
          }
          handleSearchComplete();
        },
        searchOptions
      );
    });

    // 카페 검색
    cafeKeywords.forEach(keyword => {
      places.keywordSearch(
        keyword,
        (result: any[], status: string) => {
          if (status === window.kakao.maps.services.Status.OK) {
            result.forEach(place => {
              // 카페/커피숍 카테고리만 포함
              if ((place.category_name.includes('카페') || 
                   place.category_name.includes('커피')) && 
                  !uniquePlaces.has(place.id)) {
                uniquePlaces.set(place.id, {
                  name: place.place_name,
                  address: place.address_name,
                  lat: parseFloat(place.y),
                  lng: parseFloat(place.x),
                  types: [MealType.CAFE], // 카페는 CAFE 타입만 가짐
                  openingHours: place.opening_hours,
                  category: 'cafe'
                });
              }
            });
          }
          handleSearchComplete();
        },
        searchOptions
      );
    });

    function handleSearchComplete() {
      completedSearches++;
      if (completedSearches === totalSearches) {
        const allPlaces = Array.from(uniquePlaces.values());
        setRestaurants(allPlaces);
        console.log(`총 ${allPlaces.length}개의 장소를 찾았습니다. (음식점: ${allPlaces.filter(p => p.category === 'restaurant').length}개, 카페: ${allPlaces.filter(p => p.category === 'cafe').length}개)`);
      }
    }
  };

  const handleMealClick = (mealType: MealType) => {
    if (!map || restaurants.length === 0) return;

    // 카페와 음식점을 구분하여 필터링
    const filteredRestaurants = restaurants.filter(r => {
      if (mealType === MealType.CAFE) {
        return r.category === 'cafe';
      } else {
        return r.category === 'restaurant' && r.types.includes(mealType);
      }
    });

    if (filteredRestaurants.length === 0) {
      alert(mealType === MealType.CAFE ? 
        '근처에 카페가 없습니다.' : 
        '해당 시간대에 맞는 식당이 없습니다.');
      return;
    }

    const randomIndex = Math.floor(Math.random() * filteredRestaurants.length);
    const selected = filteredRestaurants[randomIndex];
    setSelectedRestaurant(selected);

    // 기존 마커와 인포윈도우 제거
    if (currentMarker) currentMarker.setMap(null);
    if (currentInfoWindow) currentInfoWindow.close();

    // 새로운 마커 생성
    const markerPosition = new window.kakao.maps.LatLng(selected.lat, selected.lng);
    const marker = new window.kakao.maps.Marker({
      position: markerPosition,
      map: map
    });

    // 인포윈도우 생성
    const infoWindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:5px;font-size:12px;">${selected.name}</div>`
    });

    infoWindow.open(map, marker);
    map.panTo(markerPosition);

    setCurrentMarker(marker);
    setCurrentInfoWindow(infoWindow);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center gap-4 mb-12">
          <h1 className="text-5xl font-extrabold text-center bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
            오뭐먹?
          </h1>
          <span className="text-2xl text-gray-500 dark:text-gray-400 font-medium italic">
            오늘 뭐먹지?
          </span>
        </div>

        <div className="flex flex-col gap-8 mb-12">
          {/* 식사 추천 버튼들 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button
              onClick={() => handleMealClick(MealType.BREAKFAST)}
              className="px-8 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={isMapLoading}
            >
              아침 식사 추천
            </button>
            <button
              onClick={() => handleMealClick(MealType.LUNCH)}
              className="px-8 py-4 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-xl hover:from-indigo-600 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={isMapLoading}
            >
              점심 식사 추천
            </button>
            <button
              onClick={() => handleMealClick(MealType.DINNER)}
              className="px-8 py-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl hover:from-purple-600 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={isMapLoading}
            >
              저녁 식사 추천
            </button>
            <button
              onClick={() => handleMealClick(MealType.CAFE)}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={isMapLoading}
            >
              카페 추천
            </button>
          </div>
        </div>

        {selectedRestaurant && (
          <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-2xl shadow-xl backdrop-blur-lg bg-opacity-90 border border-gray-200 dark:border-gray-700">
            <h2 className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
              {selectedRestaurant.name}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-2">{selectedRestaurant.address}</p>
            {selectedRestaurant.openingHours && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                영업시간: {selectedRestaurant.openingHours}
              </p>
            )}
            <p className="text-sm text-gray-500 dark:text-gray-400">
              종류: {selectedRestaurant.category === 'cafe' ? '카페 ☕️' : '음식점 🍽️'}
            </p>
          </div>
        )}

        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {isMapLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 backdrop-blur-lg bg-opacity-90">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
                <p className="text-gray-600 dark:text-gray-300">지도를 불러오는 중...</p>
              </div>
            </div>
          )}
          <div ref={mapRef} className="w-full h-[600px]" />
        </div>
      </div>
    </div>
  );
}
