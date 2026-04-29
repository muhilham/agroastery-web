import { render, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Google Maps mock setup ---

// Track the PlaceAutocompleteElement event listeners so we can fire them
let placeSelectListeners: Array<(e: unknown) => void> = [];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockMapInstance: {
  setCenter: ReturnType<typeof vi.fn>;
  setZoom: ReturnType<typeof vi.fn>;
  addListener: ReturnType<typeof vi.fn>;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockMarkerInstance: {
  position: { lat: number; lng: number } | null;
  addListener: ReturnType<typeof vi.fn>;
};

function setupGoogleMapsMock() {
  mockMapInstance = {
    setCenter: vi.fn(),
    setZoom: vi.fn(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addListener: vi.fn(() => ({ remove: vi.fn() })) as any,
  };

  mockMarkerInstance = {
    position: null,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    addListener: vi.fn(() => ({ remove: vi.fn() })) as any,
  };

  placeSelectListeners = [];

  const google = {
    maps: {
      Map: vi.fn(() => mockMapInstance),
      Geocoder: vi.fn(() => ({
        geocode: vi.fn(),
      })),
      event: {
        removeListener: vi.fn(),
      },
      marker: {
        AdvancedMarkerElement: vi.fn(function (
          this: typeof mockMarkerInstance,
          opts: { position: { lat: number; lng: number } }
        ) {
          mockMarkerInstance.position = opts.position;
          return mockMarkerInstance;
        }),
      },
      places: {
        // Return a real DOM element so jsdom's appendChild works
        PlaceAutocompleteElement: vi.fn(() => {
          const el = document.createElement("div");
          // Override addEventListener to capture gmp-select handlers
          const originalAddEventListener = el.addEventListener.bind(el);
          el.addEventListener = vi.fn((event: string, handler: EventListenerOrEventListenerObject) => {
            if (event === "gmp-select") {
              placeSelectListeners.push(handler as (e: unknown) => void);
            }
            originalAddEventListener(event, handler);
          }) as unknown as typeof el.addEventListener;
          return el;
        }),
      },
    },
  };

  (globalThis as unknown as { google: typeof google }).google = google;
}

// Mock loadGoogleMaps to resolve immediately (maps are "loaded")
vi.mock("@/lib/maps/loadGoogleMaps", () => ({
  loadGoogleMaps: vi.fn(() => Promise.resolve()),
}));

// Mock the shipping store
vi.mock("@/lib/stores/shipping", () => ({
  setDestinationGeo: vi.fn(),
}));

// Must import AFTER mocks are set up
import MapPicker from "@/components/map/MapPicker";

describe("MapPicker — place selection pins location on map", () => {
  beforeEach(() => {
    setupGoogleMapsMock();
    placeSelectListeners = [];
  });

  it("updates marker position and centers map when a place is selected from search", async () => {
    const onChange = vi.fn();
    const selectedCoords = { lat: -6.175, lng: 106.827 };
    const selectedAddress = "Monas, Jakarta Pusat";

    render(
      <MapPicker
        onChange={onChange}
        showSearch={true}
        height={300}
      />
    );

    // Wait for map initialization to complete
    await waitFor(() => {
      expect(mockMapInstance.addListener).toHaveBeenCalled();
    });

    // Simulate place selection from AddressSearch autocomplete
    expect(placeSelectListeners.length).toBeGreaterThan(0);

    // Fire the gmp-select event with a mock place
    await act(async () => {
      const mockPlace = {
        location: {
          lat: () => selectedCoords.lat,
          lng: () => selectedCoords.lng,
        },
        formattedAddress: selectedAddress,
        displayName: "Monas",
        id: "place_123",
        addressComponents: [
          { types: ["postal_code"], longText: "10110" },
        ],
        fetchFields: vi.fn().mockResolvedValue(undefined),
      };

      // The gmp-select event provides a place property
      const event = { place: mockPlace };
      for (const listener of placeSelectListeners) {
        await listener(event);
      }
    });

    // ASSERT: onChange was called with the selected coordinates
    expect(onChange).toHaveBeenCalledWith(selectedCoords);

    // ASSERT: marker position was updated to selected coordinates
    expect(mockMarkerInstance.position).toEqual(selectedCoords);

    // ASSERT: map was centered on selected coordinates
    expect(mockMapInstance.setCenter).toHaveBeenCalledWith(selectedCoords);

    // ASSERT: map was zoomed to street level
    expect(mockMapInstance.setZoom).toHaveBeenCalledWith(16);
  });

  it("calls handlePlaceSelected which updates marker even after multiple selections", async () => {
    const onChange = vi.fn();
    const firstCoords = { lat: -6.175, lng: 106.827 };
    const secondCoords = { lat: -6.9, lng: 107.6 };

    render(
      <MapPicker
        onChange={onChange}
        showSearch={true}
        height={300}
      />
    );

    // Wait for map initialization
    await waitFor(() => {
      expect(mockMapInstance.addListener).toHaveBeenCalled();
    });

    // First selection
    await act(async () => {
      const mockPlace = {
        location: { lat: () => firstCoords.lat, lng: () => firstCoords.lng },
        formattedAddress: "Jakarta",
        displayName: "Jakarta",
        id: "place_1",
        addressComponents: [],
        fetchFields: vi.fn().mockResolvedValue(undefined),
      };
      for (const listener of placeSelectListeners) {
        await listener({ place: mockPlace });
      }
    });

    expect(mockMarkerInstance.position).toEqual(firstCoords);
    mockMapInstance.setCenter.mockClear();

    // Second selection — should also work
    await act(async () => {
      const mockPlace = {
        location: { lat: () => secondCoords.lat, lng: () => secondCoords.lng },
        formattedAddress: "Bandung",
        displayName: "Bandung",
        id: "place_2",
        addressComponents: [],
        fetchFields: vi.fn().mockResolvedValue(undefined),
      };
      for (const listener of placeSelectListeners) {
        await listener({ place: mockPlace });
      }
    });

    expect(onChange).toHaveBeenLastCalledWith(secondCoords);
    expect(mockMarkerInstance.position).toEqual(secondCoords);
    expect(mockMapInstance.setCenter).toHaveBeenCalledWith(secondCoords);
  });

  it("geolocation does NOT override a user's place selection", async () => {
    // Mock geolocation
    let geoSuccessCallback: ((pos: { coords: { latitude: number; longitude: number } }) => void) | null = null;
    const mockGeolocation = {
      getCurrentPosition: vi.fn((success) => {
        geoSuccessCallback = success;
      }),
    };
    Object.defineProperty(navigator, "geolocation", {
      value: mockGeolocation,
      writable: true,
    });

    const onChange = vi.fn();
    const selectedCoords = { lat: -6.175, lng: 106.827 };

    render(
      <MapPicker
        onChange={onChange}
        showSearch={true}
        height={300}
      />
    );

    // Wait for map initialization
    await waitFor(() => {
      expect(mockMapInstance.addListener).toHaveBeenCalled();
    });

    // User selects a place
    await act(async () => {
      const mockPlace = {
        location: {
          lat: () => selectedCoords.lat,
          lng: () => selectedCoords.lng,
        },
        formattedAddress: "Selected Place",
        displayName: "Selected",
        id: "place_789",
        addressComponents: [],
        fetchFields: vi.fn().mockResolvedValue(undefined),
      };
      for (const listener of placeSelectListeners) {
        await listener({ place: mockPlace });
      }
    });

    // Reset mock call counts to track what happens AFTER selection
    mockMapInstance.setCenter.mockClear();

    // NOW geolocation resolves with a DIFFERENT location
    const geoLocation = { lat: -7.5, lng: 110.4 }; // Somewhere else
    act(() => {
      geoSuccessCallback?.({
        coords: { latitude: geoLocation.lat, longitude: geoLocation.lng },
      });
    });

    // ASSERT: map should NOT have been re-centered to geolocation
    // (user already interacted, geolocation should be ignored)
    expect(mockMapInstance.setCenter).not.toHaveBeenCalledWith(geoLocation);

    // Marker should still be at selected coords
    expect(mockMarkerInstance.position).toEqual(selectedCoords);
  });
});
