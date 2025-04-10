interface KakaoMapServices {
  Places: new () => {
    keywordSearch: (
      keyword: string,
      callback: (
        result: Array<{
          place_name: string;
          address_name: string;
          x: string;
          y: string;
          opening_hours?: string;
          category_name: string;
          id: string;
        }>,
        status: string
      ) => void,
      options?: {
        location?: any;
        radius?: number;
        sort?: any;
      }
    ) => void;
  };
  Status: {
    OK: string;
    ZERO_RESULT: string;
    ERROR: string;
  };
  SortBy: {
    DISTANCE: number;
  };
}

interface KakaoMaps {
  load: (callback: () => void) => void;
  LatLng: new (lat: number, lng: number) => any;
  Map: new (container: HTMLElement, options: any) => any;
  Marker: new (options: any) => any;
  InfoWindow: new (options: any) => any;
  Circle: new (options: {
    center: any;
    radius: number;
    strokeWeight: number;
    strokeColor: string;
    strokeOpacity: number;
    fillColor: string;
    fillOpacity: number;
  }) => any;
  services: KakaoMapServices;
}

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
          strokeWeight: number;
          strokeColor: string;
          strokeOpacity: number;
          fillColor: string;
          fillOpacity: number;
        }) => any;
        services: {
          Places: new () => {
            keywordSearch: (
              keyword: string,
              callback: (
                result: Array<{
                  place_name: string;
                  address_name: string;
                  x: string;
                  y: string;
                  opening_hours?: string;
                  category_name: string;
                  id: string;
                }>,
                status: string
              ) => void,
              options?: {
                location?: any;
                radius?: number;
                sort?: any;
              }
            ) => void;
          };
          Status: {
            OK: string;
            ZERO_RESULT: string;
            ERROR: string;
          };
          SortBy: {
            DISTANCE: number;
          };
        };
      };
    };
  }
}

export {}; 