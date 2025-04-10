'use client';

import { useState, useEffect } from 'react';

interface Restaurant {
  name: string;
  address: string;
  category: string;
  lat: number;
  lng: number;
  distance: number;
  placeId: string;
}

type MealTime = 'morning' | 'lunch' | 'dinner' | 'cafe';

// 한밭대학교 국제교류관 좌표
const HANBAT_LOCATION = {
  lat: 36.35022,
  lng: 127.30066
};

declare global {
  interface Window {
    kakao: {
      maps: {
        load: (callback: () => void) => void;
        LatLng: new (lat: number, lng: number) => any;
        Map: new (container: HTMLElement, options: any) => any;
        Marker: new (options: any) => any;
        InfoWindow: new (options: any) => any;
        Circle: new (options: {
          center: any;
          radius: number;
          strokeWeight?: number;
          strokeColor?: string;
          strokeOpacity?: number;
          strokeStyle?: string;
          fillColor?: string;
          fillOpacity?: number;
          map?: any;
        }) => any;
        services: {
          Places: new () => any;
          Status: {
            OK: string;
          };
          SortBy: {
            DISTANCE: number;
          };
        };
      };
    };
  }
}

export default function Home() {
  const [map, setMap] = useState<any>(null);
  const [marker, setMarker] = useState<any>(null);
  const [infoWindow, setInfoWindow] = useState<any>(null);
  const [circle, setCircle] = useState<any>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [cafes, setCafes] = useState<Restaurant[]>([]);
  const [selectedMeal, setSelectedMeal] = useState<MealTime | null>(null);
  const [recommendation, setRecommendation] = useState<Restaurant | null>(null);

  // 지도 초기화
  useEffect(() => {
    const initializeMap = () => {
      const container = document.getElementById('map');
      if (!container) {
        console.error('Map container not found');
        return;
      }

      try {
        const options = {
          center: new window.kakao.maps.LatLng(HANBAT_LOCATION.lat, HANBAT_LOCATION.lng),
          level: 5 // 지도 확대 레벨을 조정하여 원이 잘 보이도록 함
        };

        const mapInstance = new window.kakao.maps.Map(container, options);
        setMap(mapInstance);

        // 한밭대 위치에 기본 마커 추가
        const defaultMarker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(HANBAT_LOCATION.lat, HANBAT_LOCATION.lng),
          map: mapInstance
        });

        // 반경 원 추가
        const searchRadius = new window.kakao.maps.Circle({
          center: new window.kakao.maps.LatLng(HANBAT_LOCATION.lat, HANBAT_LOCATION.lng),
          radius: 750,
          strokeWeight: 1,
          strokeColor: '#00a0e9',
          strokeOpacity: 0.6,
          strokeStyle: 'solid',
          fillColor: '#00a0e9',
          fillOpacity: 0
        });
        
        searchRadius.setMap(mapInstance);
        setCircle(searchRadius);

        // 인포윈도우 생성
        const infowindow = new window.kakao.maps.InfoWindow({
          content: '<div style="padding:5px;font-size:12px;">국립한밭대학교</div>'
        });
        infowindow.open(mapInstance, defaultMarker);

        // 주변 식당 검색
        searchNearbyRestaurants(mapInstance);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };

    const loadKakaoMaps = () => {
      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          console.log('Kakao Maps loaded');
          initializeMap();
        });
      } else {
        console.log('Waiting for Kakao Maps to load...');
        setTimeout(loadKakaoMaps, 500);
      }
    };

    loadKakaoMaps();

    return () => {
      // 컴포넌트 언마운트 시 정리
      if (map) {
        setMap(null);
      }
    };
  }, []);

  // 주변 식당 검색 함수
  const searchNearbyRestaurants = (mapInstance: any) => {
    if (!window.kakao?.maps) return;

    const places = new window.kakao.maps.services.Places();
    
    // 음식점 검색
    const searchRestaurants = () => {
      // 여러 키워드로 검색하여 결과 합치기
      const searchKeywords = ['음식점', '식당', '한식', '중식', '일식', '양식'];
      let allRestaurants: Restaurant[] = [];
      
      searchKeywords.forEach((keyword, index) => {
        setTimeout(() => {
          places.keywordSearch(keyword, (result: any[], status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const restaurantList: Restaurant[] = result
                .filter(place => {
                  // 카페 제외하고 음식점 카테고리만 포함
                  const isRestaurant = place.category_name.includes('음식점') || 
                                     place.category_name.includes('식당');
                  const isCafe = place.category_name.includes('카페') || 
                                place.category_name.includes('커피');
                  return isRestaurant && !isCafe;
                })
                .map(place => ({
                  name: place.place_name,
                  address: place.address_name,
                  category: place.category_name,
                  lat: parseFloat(place.y),
                  lng: parseFloat(place.x),
                  distance: place.distance,
                  placeId: place.id
                }));

              // 중복 제거하여 결과 합치기
              const newRestaurants = restaurantList.filter(newPlace => 
                !allRestaurants.some(existing => existing.placeId === newPlace.placeId)
              );
              allRestaurants = [...allRestaurants, ...newRestaurants];
              
              // 마지막 검색이 완료되면 상태 업데이트
              if (index === searchKeywords.length - 1) {
                setRestaurants(allRestaurants);
                console.log(`총 ${allRestaurants.length}개의 음식점을 찾았습니다.`);
              }
            }
          }, {
            location: new window.kakao.maps.LatLng(HANBAT_LOCATION.lat, HANBAT_LOCATION.lng),
            radius: 750, // 750m로 변경
            sort: window.kakao.maps.services.SortBy.DISTANCE
          });
        }, index * 300); // API 호출 제한을 피하기 위해 시간 간격 추가
      });
    };

    // 카페 검색
    const searchCafes = () => {
      const searchKeywords = ['카페', '커피', '디저트'];
      let allCafes: Restaurant[] = [];

      searchKeywords.forEach((keyword, index) => {
        setTimeout(() => {
          places.keywordSearch(keyword, (result: any[], status: any) => {
            if (status === window.kakao.maps.services.Status.OK) {
              const cafeList: Restaurant[] = result
                .filter(place => 
                  place.category_name.includes('카페') || 
                  place.category_name.includes('커피') ||
                  place.category_name.includes('디저트')
                )
                .map(place => ({
                  name: place.place_name,
                  address: place.address_name,
                  category: place.category_name,
                  lat: parseFloat(place.y),
                  lng: parseFloat(place.x),
                  distance: place.distance,
                  placeId: place.id
                }));

              // 중복 제거하여 결과 합치기
              const newCafes = cafeList.filter(newPlace => 
                !allCafes.some(existing => existing.placeId === newPlace.placeId)
              );
              allCafes = [...allCafes, ...newCafes];
              
              // 마지막 검색이 완료되면 상태 업데이트
              if (index === searchKeywords.length - 1) {
                setCafes(allCafes);
                console.log(`총 ${allCafes.length}개의 카페를 찾았습니다.`);
              }
            }
          }, {
            location: new window.kakao.maps.LatLng(HANBAT_LOCATION.lat, HANBAT_LOCATION.lng),
            radius: 750, // 750m로 변경
            sort: window.kakao.maps.services.SortBy.DISTANCE
          });
        }, index * 300); // API 호출 제한을 피하기 위해 시간 간격 추가
    });
  };

    searchRestaurants();
    searchCafes();
  };

  // 식사 시간별 추천 함수
  const handleMealClick = (mealTime: MealTime) => {
    // 이전 추천 정보 초기화
    setRecommendation(null);
    
    // 이전 마커와 인포윈도우 제거
    if (marker) {
      marker.setMap(null);
      setMarker(null);
    }
    if (infoWindow) {
      infoWindow.close();
      setInfoWindow(null);
    }

    setSelectedMeal(mealTime);
    
    // 선택된 장소 목록 결정
    const places = mealTime === 'cafe' ? cafes : restaurants;
    if (places.length === 0) return;

    // 잠시 후 새로운 추천 표시 (자연스러운 전환을 위해)
    setTimeout(() => {
      // 랜덤 선택
      const randomIndex = Math.floor(Math.random() * places.length);
      const selected = places[randomIndex];
      
      setRecommendation(selected);

      // 새로운 마커 생성
      if (map && selected) {
        const newMarker = new window.kakao.maps.Marker({
          position: new window.kakao.maps.LatLng(selected.lat, selected.lng),
          map: map
        });
        setMarker(newMarker);

        // 지도 중심 이동
        map.panTo(new window.kakao.maps.LatLng(selected.lat, selected.lng));

        // 새로운 인포윈도우 생성
        const newInfoWindow = new window.kakao.maps.InfoWindow({
          content: `<div style="padding:5px;font-size:12px;">${selected.name}</div>`
        });
        newInfoWindow.open(map, newMarker);
        setInfoWindow(newInfoWindow);
      }
    }, 100); // 100ms 후에 새로운 추천 표시
  };

  // 식사 시간 텍스트 변환
  const getMealTimeText = (mealTime: MealTime): string => {
    switch (mealTime) {
      case 'morning':
        return '아침';
      case 'lunch':
        return '점심';
      case 'dinner':
        return '저녁';
      case 'cafe':
        return '카페';
    }
  };

  return (
    <main className="min-h-screen p-4">
      <h1 className="text-3xl font-bold text-center mb-6 flex items-center justify-center gap-2">
        오뭐먹?
        <span className="text-lg text-gray-500 font-normal">
          - 오늘 뭐 먹을까?
        </span>
          </h1>

      {/* 지도 컨테이너 */}
      <div id="map" className="w-full h-[400px] mb-6 rounded-lg shadow-lg"></div>
      
      {/* 식사 시간 선택 버튼 */}
      <div className="flex justify-center gap-4 mb-6">
        {(['morning', 'lunch', 'dinner', 'cafe'] as MealTime[]).map((mealTime) => (
          <button
            key={mealTime}
            onClick={() => handleMealClick(mealTime)}
            className={`px-6 py-2 rounded-full font-medium transition-colors
              ${selectedMeal === mealTime 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 hover:bg-gray-300'}`}
          >
            {getMealTimeText(mealTime)}
          </button>
        ))}
      </div>

      {/* 추천 결과 */}
      {recommendation && (
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-2xl font-bold mb-4">
            {selectedMeal === 'cafe' ? '카페 추천' : `${getMealTimeText(selectedMeal)} 추천 맛집`}
          </h2>
          <div className="space-y-2">
            <p className="text-xl font-semibold text-blue-600">{recommendation.name}</p>
            <p className="text-gray-600">
              <span className="font-medium">주소:</span> {recommendation.address}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">카테고리:</span> {recommendation.category}
            </p>
            <p className="text-gray-600">
              <span className="font-medium">거리:</span> {recommendation.distance}m
            </p>
            </div>
          </div>
        )}
    </main>
  );
}
