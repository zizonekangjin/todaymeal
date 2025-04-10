interface Window {
  kakao: {
    maps: {
      load: (callback: () => void) => void;
      LatLng: new (lat: number, lng: number) => any;
      Map: new (container: HTMLElement, options: any) => any;
      Marker: new (options: any) => any;
      InfoWindow: new (options: any) => any;
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