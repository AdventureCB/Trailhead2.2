import React, { useState, useEffect, useRef } from "react";
import { Heart, MessageCircle, MapPin, Clock, Mountain, ChevronRight, ChevronLeft, ChevronDown, Search, Plus, Home, Compass, Map, Wrench, Trophy, AlertTriangle, Navigation, Star, Share2, Bookmark, MoreHorizontal, ArrowUp, Users, Radio, CloudSun, CheckCircle, Target, Gift, ChevronUp, ExternalLink, Lock, Globe, Shield, UserPlus, UserCheck, Settings, Camera, Eye, EyeOff, X, Bell, ThumbsUp, UserPlus as UserPlusIcon, AtSign, Mail, Send, Image, Smartphone, Trash2, Edit3 } from "lucide-react";

/* ─── Design Tokens from Lone Peak Concept ─── */
const T = {
  red: "#BD472A",
  copper: "#C49A6C",
  tertiary: "#8B7D6B",
  charcoal: "#2A2A28",
  warmStone: "#E8E2D9",
  warmBg: "#F5F2ED",
  darkBg: "#111111",
  darkCard: "#1A1A1A",
  white: "#FFFFFF",
  lightGray: "#F9F7F4",
  textGray: "#666666",
  mutedText: "#999999",
  green: "#4A7C59",
};

/* ─── Google Fonts import ─── */
const fontLink = document.createElement("link");
fontLink.href = "https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;1,400&display=swap";
fontLink.rel = "stylesheet";
if (!document.querySelector('link[href*="Source+Serif+4"]')) document.head.appendChild(fontLink);

/* ─── Google Maps API Key ─── */
const GMAPS_KEY = "AIzaSyBEqra4C4sdGg7ufDyh6xjwo5g79nXJHkc";

/* ─── Load Google Maps JavaScript API (lazy, on first use) ─── */
function loadGmaps() {
  if (window.google?.maps) return Promise.resolve();
  if (window._gmapsReadyPromise) return window._gmapsReadyPromise;
  window._gmapsReadyPromise = new Promise((resolve, reject) => {
    window._gmapsReady = resolve;
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${GMAPS_KEY}&libraries=places&callback=_gmapsReady`;
    s.async = true;
    s.onerror = () => reject(new Error("Failed to load Google Maps"));
    document.head.appendChild(s);
  });
  return window._gmapsReadyPromise;
}

/* ─── Thin auto-hiding scrollbar ─── */
if (!document.querySelector('style[data-trailhead-scroll]')) {
  const scrollStyle = document.createElement("style");
  scrollStyle.setAttribute("data-trailhead-scroll", "1");
  scrollStyle.textContent = `
    .th-scroll { scrollbar-width: thin; scrollbar-color: transparent transparent; }
    .th-scroll:hover, .th-scroll:active { scrollbar-color: rgba(139,125,107,0.35) transparent; }
    .th-scroll::-webkit-scrollbar { width: 4px; }
    .th-scroll::-webkit-scrollbar-track { background: transparent; }
    .th-scroll::-webkit-scrollbar-thumb { background: transparent; border-radius: 4px; }
    .th-scroll:hover::-webkit-scrollbar-thumb,
    .th-scroll:active::-webkit-scrollbar-thumb { background: rgba(139,125,107,0.35); }
    .th-scroll::-webkit-scrollbar-thumb:hover { background: rgba(139,125,107,0.55); }
    .th-hscroll { scrollbar-width: none; }
    .th-hscroll::-webkit-scrollbar { display: none; }
    @keyframes thspin { to { transform: rotate(360deg); } }
    @keyframes fadeInUp { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
    .th-rich-body h1 { display: block !important; font-size: 26px !important; font-weight: 700 !important; color: #fff !important; margin: 14px 0 8px !important; font-family: Trebuchet MS, Gill Sans, sans-serif !important; line-height: 1.2 !important; }
    .th-rich-body h2 { display: block !important; font-size: 21px !important; font-weight: 700 !important; color: #fff !important; margin: 12px 0 6px !important; font-family: Trebuchet MS, Gill Sans, sans-serif !important; line-height: 1.3 !important; }
    .th-rich-body h3 { display: block !important; font-size: 17px !important; font-weight: 600 !important; color: #fff !important; margin: 10px 0 4px !important; font-family: Trebuchet MS, Gill Sans, sans-serif !important; line-height: 1.3 !important; }
    .th-rich-body p { display: block !important; margin: 6px 0 !important; font-size: 14px !important; }
    .th-rich-body ul { display: block !important; list-style-type: disc !important; padding-left: 24px !important; margin: 8px 0 !important; }
    .th-rich-body ol { display: block !important; list-style-type: decimal !important; padding-left: 24px !important; margin: 8px 0 !important; }
    .th-rich-body li { display: list-item !important; margin: 4px 0 !important; list-style-position: outside !important; }
    .th-rich-body ul li { list-style-type: disc !important; }
    .th-rich-body ol li { list-style-type: decimal !important; }
    .th-rich-body a { color: #C49A6C !important; text-decoration: underline !important; cursor: pointer !important; }
    .th-rich-body b, .th-rich-body strong { font-weight: 700 !important; color: #fff !important; }
    .th-rich-body u { text-decoration: underline !important; }
    .th-rich-body strike, .th-rich-body s { text-decoration: line-through !important; }
  `;
  document.head.appendChild(scrollStyle);
}

const sans = "'Trebuchet MS', 'Gill Sans', sans-serif";
const serif = "'Source Serif 4', 'Georgia', serif";

/* ─── Helpers ─── */
const parseCoords = (coords) => {
  if (!coords) return null;
  const nums = coords.match(/([\d.]+)°?\s*([NSns]),?\s*([\d.]+)°?\s*([EWew])/);
  if (!nums) return null;
  const lat = nums[2].toUpperCase() === "S" ? -parseFloat(nums[1]) : parseFloat(nums[1]);
  const lng = nums[4].toUpperCase() === "W" ? -parseFloat(nums[3]) : parseFloat(nums[3]);
  return { lat, lng };
};

const getMapQuery = (coords, location) => {
  const c = parseCoords(coords);
  if (c) return `${c.lat},${c.lng}`;
  if (location) return location;
  return null;
};

/* ─── Haversine distance (meters) ─── */
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/* ─── Strip HTML tags from directions instructions ─── */
function stripHtml(html) {
  const tmp = document.createElement("div");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
}

/* ─── Map Overlay (Google Maps JavaScript API) ─── */
function MapOverlay({ coords, location, title, onClose }) {
  const query = getMapQuery(coords, location);
  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markerRef = useRef(null);
  const directionsRenderer = useRef(null);
  const userMarkerRef = useRef(null);
  const watchIdRef = useRef(null);
  const [mode, setMode] = useState("place"); // "place" | "directions" | "navigating"
  const [startInput, setStartInput] = useState("");
  const [origin, setOrigin] = useState(null);
  const [gpsStatus, setGpsStatus] = useState(null); // null | "locating" | "failed"
  const [mapReady, setMapReady] = useState(false);
  const [dirError, setDirError] = useState(null);
  const [routeSteps, setRouteSteps] = useState([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [tripSummary, setTripSummary] = useState(null); // { distance, duration }
  const [userPos, setUserPos] = useState(null);
  const [distToNext, setDistToNext] = useState(null);

  // Parse destination coords
  const destCoords = parseCoords(coords);
  const destLatLng = destCoords ? { lat: destCoords.lat, lng: destCoords.lng } : null;

  // External URLs (open in Google Maps app)
  const externalUrl = `https://www.google.com/maps/search/?api=1&query=${query}`;
  const externalDirUrl = origin
    ? `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(origin)}&destination=${query}`
    : `https://www.google.com/maps/dir/?api=1&destination=${query}`;

  // Initialize map once API is loaded
  useEffect(() => {
    if (!query || !mapRef.current) return;
    let cancelled = false;

    const init = async () => {
      try { await loadGmaps(); } catch (e) { console.error("Google Maps load failed:", e); return; }
      if (cancelled || !mapRef.current) return;

      const center = destLatLng || { lat: 39.5, lng: -98.35 };
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: destLatLng ? 13 : 5,
        mapTypeId: "terrain",
        disableDefaultUI: false,
        zoomControl: true,
        mapTypeControl: true,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
          { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
          { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
        ],
      });

      mapInstance.current = map;

      if (destLatLng) {
        markerRef.current = new window.google.maps.Marker({
          position: destLatLng,
          map,
          title: title || "Location",
          icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: T.red, fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 },
        });
      } else if (location) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode({ address: location }, (results, status) => {
          if (status === "OK" && results[0]) {
            map.setCenter(results[0].geometry.location);
            map.setZoom(13);
            markerRef.current = new window.google.maps.Marker({
              position: results[0].geometry.location,
              map,
              title: title || location,
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: T.red, fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 },
            });
          }
        });
      }

      directionsRenderer.current = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: { strokeColor: T.red, strokeWeight: 4, strokeOpacity: 0.9 },
      });

      setMapReady(true);
    };

    init();
    return () => { cancelled = true; };
  }, [query]);

  // Render directions when origin changes
  useEffect(() => {
    if (!mapReady || !origin || (mode !== "directions" && mode !== "navigating")) return;
    setDirError(null);

    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: origin,
        destination: destLatLng ? destLatLng : location,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK" && directionsRenderer.current) {
          if (markerRef.current) markerRef.current.setMap(null);
          directionsRenderer.current.setDirections(result);
          // Extract steps for turn-by-turn
          const leg = result.routes[0]?.legs[0];
          if (leg) {
            setRouteSteps(leg.steps.map(s => ({
              instruction: stripHtml(s.instructions),
              distance: s.distance?.text || "",
              duration: s.duration?.text || "",
              endLat: s.end_location.lat(),
              endLng: s.end_location.lng(),
              startLat: s.start_location.lat(),
              startLng: s.start_location.lng(),
            })));
            setTripSummary({ distance: leg.distance?.text || "", duration: leg.duration?.text || "" });
            setCurrentStepIdx(0);
          }
        } else {
          setDirError("Could not find a route. Try a different starting location.");
        }
      }
    );
  }, [origin, mode, mapReady]);

  // Live GPS tracking during navigation
  useEffect(() => {
    if (mode !== "navigating") {
      // Stop watching when not navigating
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
      if (userMarkerRef.current) { userMarkerRef.current.setMap(null); userMarkerRef.current = null; }
      return;
    }
    if (!navigator.geolocation || !mapInstance.current) return;

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const p = new window.google.maps.LatLng(lat, lng);
        setUserPos({ lat, lng });

        // Update or create user marker (blue dot)
        if (!userMarkerRef.current) {
          userMarkerRef.current = new window.google.maps.Marker({
            position: p,
            map: mapInstance.current,
            icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 9, fillColor: "#4285F4", fillOpacity: 1, strokeColor: T.white, strokeWeight: 3 },
            zIndex: 999,
          });
        } else {
          userMarkerRef.current.setPosition(p);
        }

        // Center map on user
        mapInstance.current.panTo(p);

        // Check distance to current step endpoint for auto-advance
        setCurrentStepIdx(prev => {
          if (prev >= routeSteps.length) return prev;
          const step = routeSteps[prev];
          const dist = haversine(lat, lng, step.endLat, step.endLng);
          setDistToNext(Math.round(dist));
          // Advance if within 50m of step endpoint
          if (dist < 50 && prev < routeSteps.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      },
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
      }
    };
  }, [mode, routeSteps]);

  if (!query) return null;

  const startDirections = () => {
    setGpsStatus("locating");
    setDirError(null);
    if (!navigator.geolocation) { setGpsStatus("failed"); return; }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const o = `${pos.coords.latitude},${pos.coords.longitude}`;
        setOrigin(o);
        setMode("directions");
        setGpsStatus(null);
      },
      () => setGpsStatus("failed"),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const handleManualStart = () => {
    if (!startInput.trim()) return;
    setOrigin(startInput.trim());
    setMode("directions");
    setGpsStatus(null);
  };

  const startTrip = () => {
    setCurrentStepIdx(0);
    setMode("navigating");
    if (mapInstance.current) mapInstance.current.setZoom(17);
  };

  const endTrip = () => {
    setMode("directions");
    setDistToNext(null);
    if (mapInstance.current) {
      const bounds = new window.google.maps.LatLngBounds();
      routeSteps.forEach(s => {
        bounds.extend({ lat: s.startLat, lng: s.startLng });
        bounds.extend({ lat: s.endLat, lng: s.endLng });
      });
      mapInstance.current.fitBounds(bounds);
    }
  };

  const clearRoute = () => {
    setMode("place");
    setOrigin(null);
    setStartInput("");
    setGpsStatus(null);
    setDirError(null);
    setRouteSteps([]);
    setTripSummary(null);
    setDistToNext(null);
    if (directionsRenderer.current) directionsRenderer.current.setDirections({ routes: [] });
    if (markerRef.current && mapInstance.current) {
      markerRef.current.setMap(mapInstance.current);
      if (destLatLng) mapInstance.current.setCenter(destLatLng);
      mapInstance.current.setZoom(13);
    }
  };

  const currentStep = routeSteps[currentStepIdx];
  const nextStep = routeSteps[currentStepIdx + 1];

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 300, background: T.darkBg, display: "flex", flexDirection: "column" }}>
      {/* Header — hidden during navigation for max map space */}
      {mode !== "navigating" && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 0 }}>
            <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", flexShrink: 0 }}>
              <ChevronLeft size={22} color={T.white} strokeWidth={1.5} />
            </button>
            <div style={{ minWidth: 0 }}>
              <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title || "Location"}</span>
              <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{mode === "directions" && origin ? `From: ${origin}` : (coords || location)}</span>
            </div>
          </div>
          <button onClick={() => window.open(mode === "directions" ? externalDirUrl : externalUrl, "_blank", "noopener")} style={{ display: "flex", alignItems: "center", gap: 5, background: T.darkCard, border: "none", padding: "8px 12px", borderRadius: 8, cursor: "pointer", flexShrink: 0 }}>
            <ExternalLink size={13} color={T.red} />
            <span style={{ fontFamily: sans, fontSize: 10, color: T.red, fontWeight: 600, letterSpacing: 0.5 }}>OPEN APP</span>
          </button>
        </div>
      )}

      {/* Google Maps */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />

        {/* Loading overlay while API loads */}
        {!mapReady && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: T.darkBg }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <span style={{ fontFamily: sans, fontSize: 13, color: T.tertiary }}>Loading map...</span>
            </div>
          </div>
        )}

        {/* Turn-by-turn navigation card */}
        {mode === "navigating" && currentStep && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, zIndex: 400 }}>
            {/* Current maneuver */}
            <div style={{ margin: "12px 12px 0", background: `${T.charcoal}F5`, backdropFilter: "blur(12px)", borderRadius: 14, border: `1px solid ${T.darkCard}`, overflow: "hidden" }}>
              <div style={{ padding: "16px 16px 12px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: T.red, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Navigation size={20} color={T.white} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: T.white, display: "block", lineHeight: 1.3 }}>{currentStep.instruction}</span>
                  <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                    <span style={{ fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }}>
                      {distToNext !== null ? (distToNext > 1000 ? `${(distToNext / 1609).toFixed(1)} mi` : `${distToNext} m`) : currentStep.distance}
                    </span>
                    <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary }}>{currentStep.duration}</span>
                  </div>
                </div>
              </div>
              {/* Next step preview */}
              {nextStep && (
                <div style={{ padding: "10px 16px", borderTop: `1px solid ${T.darkCard}`, display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, fontWeight: 600, letterSpacing: 0.5 }}>THEN</span>
                  <span style={{ fontFamily: sans, fontSize: 12, color: T.mutedText, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{nextStep.instruction}</span>
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{nextStep.distance}</span>
                </div>
              )}
              {/* Step progress */}
              <div style={{ height: 3, background: T.darkCard }}>
                <div style={{ height: 3, background: T.red, width: `${Math.min(100, ((currentStepIdx + 1) / routeSteps.length) * 100)}%`, transition: "width 0.5s ease" }} />
              </div>
            </div>
          </div>
        )}

        {/* GPS locating overlay */}
        {gpsStatus === "locating" && (
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, background: `${T.darkCard}F2`, backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", zIndex: 400, display: "flex", alignItems: "center", gap: 10, border: `1px solid ${T.charcoal}` }}>
            <div style={{ width: 18, height: 18, border: `2px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite", flexShrink: 0 }} />
            <span style={{ fontFamily: sans, fontSize: 13, color: T.white }}>Getting your location...</span>
          </div>
        )}

        {/* GPS failed — show manual input */}
        {gpsStatus === "failed" && (
          <div style={{ position: "absolute", top: 12, left: 12, right: 12, background: `${T.darkCard}F2`, backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", zIndex: 400, border: `1px solid ${T.charcoal}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Navigation size={14} color={T.copper} />
              <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600 }}>Enter starting location</span>
              <button onClick={() => setGpsStatus(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, marginLeft: "auto" }}>
                <X size={14} color={T.tertiary} />
              </button>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                value={startInput}
                onChange={e => setStartInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleManualStart()}
                placeholder="City, state or address..."
                autoFocus
                style={{ flex: 1, padding: "11px 14px", borderRadius: 8, background: T.charcoal, border: `1px solid ${T.tertiary}40`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none" }}
              />
              <button onClick={handleManualStart} style={{ padding: "0 16px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <ChevronRight size={18} color={T.white} />
              </button>
            </div>
          </div>
        )}

        {/* Directions error */}
        {dirError && (
          <div style={{ position: "absolute", bottom: 12, left: 12, right: 12, background: `${T.darkCard}F2`, backdropFilter: "blur(10px)", borderRadius: 12, padding: "12px 16px", zIndex: 400, display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.red}40` }}>
            <AlertTriangle size={14} color={T.red} />
            <span style={{ fontFamily: sans, fontSize: 12, color: T.white }}>{dirError}</span>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div style={{ padding: "12px 16px", background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
        {mode === "navigating" ? (
          <div>
            {/* Trip info bar */}
            {tripSummary && (
              <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 10 }}>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5, display: "block" }}>DISTANCE</span>
                  <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }}>{tripSummary.distance}</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5, display: "block" }}>ETA</span>
                  <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }}>{tripSummary.duration}</span>
                </div>
                <div style={{ textAlign: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5, display: "block" }}>STEP</span>
                  <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }}>{currentStepIdx + 1}/{routeSteps.length}</span>
                </div>
              </div>
            )}
            <button onClick={endTrip} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }}>
              <X size={14} color={T.white} />
              <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>END TRIP</span>
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10 }}>
            {mode === "place" ? (
              <button onClick={startDirections} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }}>
                <Navigation size={14} color={T.white} />
                <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>GET DIRECTIONS</span>
              </button>
            ) : (
              <>
                <button onClick={startTrip} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "12px", borderRadius: 8, background: T.green, border: "none", cursor: "pointer" }}>
                  <Navigation size={14} color={T.white} />
                  <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>START TRIP</span>
                </button>
                <button onClick={clearRoute} style={{ padding: "12px 16px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <X size={14} color={T.tertiary} />
                </button>
              </>
            )}
            <button onClick={onClose} style={{ padding: "12px 20px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer" }}>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary, fontWeight: 600 }}>CLOSE</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Shared Styles ─── */
const pill = (active) => ({
  padding: "6px 14px",
  borderRadius: 20,
  background: active ? T.red : T.darkCard,
  color: active ? T.white : T.tertiary,
  fontFamily: sans,
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: 1.5,
  cursor: "pointer",
  border: "none",
  whiteSpace: "nowrap",
  transition: "all 0.2s",
});

const cardStyle = {
  background: T.darkCard,
  borderRadius: 12,
  overflow: "hidden",
};

/* ─── Bottom Nav ─── */
function BottomNav({ active, onNav }) {
  const items = [
    { key: "feed", label: "Feed", icon: Home },
    { key: "forum", label: "Forum", icon: Compass },
    { key: "routes", label: "Routes", icon: Map },
    { key: "builds", label: "Builds", icon: Wrench },
    { key: "ranks", label: "Ranks", icon: Trophy },
  ];
  return (
    <div style={{ display: "flex", position: "sticky", bottom: 0, background: T.darkCard, padding: "6px 0 max(6px, env(safe-area-inset-bottom))", borderTop: `1px solid ${T.charcoal}`, zIndex: 100, flexShrink: 0 }}>
      {items.map((it) => {
        const Icon = it.icon;
        const isActive = active === it.key;
        return (
          <button key={it.key} onClick={() => onNav(it.key)} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2, background: "none", border: "none", cursor: "pointer", padding: "4px 0", position: "relative" }}>
            {isActive && <div style={{ position: "absolute", top: -8, width: 20, height: 3, borderRadius: 2, background: T.red }} />}
            <Icon size={20} color={isActive ? T.red : T.tertiary} strokeWidth={1.5} />
            <span style={{ fontFamily: sans, fontSize: 9, color: isActive ? T.red : T.tertiary, letterSpacing: 1, fontWeight: 600 }}>{it.label.toUpperCase()}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ─── Top Bar ─── */
/* ─── Notification Badge ─── */
function NotifBadge({ count, color }) {
  if (!count) return null;
  return (
    <div style={{ position: "absolute", top: -4, right: -4, minWidth: 16, height: 16, borderRadius: 8, background: color || T.red, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px", border: `2px solid ${T.charcoal}` }}>
      <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white, lineHeight: 1 }}>{count > 99 ? "99+" : count}</span>
    </div>
  );
}

/* ─── Notification Panels ─── */
function BellNotifPanel({ onClose, onViewUser, notifs, onDismiss, onClearAll }) {
  return (
    <div style={{ position: "absolute", top: "100%", right: 0, width: "calc(100vw - 32px)", maxWidth: 398, background: T.darkCard, borderRadius: "0 0 12px 12px", boxShadow: `0 12px 40px rgba(0,0,0,0.6)`, zIndex: 200, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${T.charcoal}`, borderTop: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${T.charcoal}`, flexShrink: 0 }}>
        <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, letterSpacing: 1 }}>NOTIFICATIONS</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
          <X size={16} color={T.tertiary} />
        </button>
      </div>
      <div className="th-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {notifs.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center" }}>
            <Bell size={28} color={T.tertiary} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontFamily: sans, fontSize: 13, color: T.tertiary, margin: 0 }}>No new notifications</p>
          </div>
        ) : notifs.map((n, i) => {
          const Icon = n.icon;
          return (
            <div key={n.id} style={{ display: "flex", gap: 10, padding: "12px 16px", borderBottom: `1px solid ${T.charcoal}22`, cursor: "pointer", transition: "background 0.15s", position: "relative" }} onMouseEnter={(e) => e.currentTarget.style.background = `${T.charcoal}` } onMouseLeave={(e) => e.currentTarget.style.background = "transparent" }>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${n.iconColor}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                <Icon size={14} color={n.iconColor} strokeWidth={1.8} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: serif, fontSize: 13, color: T.white, margin: 0, lineHeight: 1.45 }}>
                  <span style={{ fontFamily: sans, fontWeight: 600, cursor: "pointer" }} onClick={(e) => { e.stopPropagation(); onViewUser && onViewUser(n.user); }}>{n.user}</span>
                  {" "}<span style={{ color: T.tertiary }}>{n.text}</span>
                  {n.target && <> <span style={{ color: T.warmStone }}>{n.target}</span></>}
                </p>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, marginTop: 2, display: "block" }}>{formatPostTime(n.time)}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDismiss(n.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", flexShrink: 0, opacity: 0.5 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                <X size={12} color={T.tertiary} />
              </button>
            </div>
          );
        })}
      </div>
      {notifs.length > 0 && (
        <button onClick={onClearAll} style={{ padding: "10px 16px", borderTop: `1px solid ${T.charcoal}`, background: "none", border: "none", borderTopStyle: "solid", borderTopWidth: 1, borderTopColor: T.charcoal, cursor: "pointer", textAlign: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: sans, fontSize: 11, color: T.red, letterSpacing: 0.5, fontWeight: 600 }}>CLEAR ALL NOTIFICATIONS</span>
        </button>
      )}
    </div>
  );
}

function RecoveryNotifPanel({ onClose, onGoToRecovery, alerts, onDismiss, onClearAll, onOpenMap, onOpenDM }) {
  const urgencyColor = (u) => u === "HIGH" ? T.red : T.copper;

  return (
    <div style={{ position: "absolute", top: "100%", right: 0, width: "calc(100vw - 32px)", maxWidth: 398, background: T.darkCard, borderRadius: "0 0 12px 12px", boxShadow: `0 12px 40px rgba(0,0,0,0.6)`, zIndex: 200, maxHeight: "70vh", display: "flex", flexDirection: "column", overflow: "hidden", border: `1px solid ${T.charcoal}`, borderTop: "none" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${T.charcoal}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={14} color={T.red} />
          <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, letterSpacing: 1 }}>RECOVERY ALERTS</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {alerts.length > 0 && (
            <button onClick={onClearAll} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }}>
              <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5 }}>CLEAR</span>
            </button>
          )}
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex" }}>
            <X size={16} color={T.tertiary} />
          </button>
        </div>
      </div>
      <div className="th-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {alerts.length === 0 ? (
          <div style={{ padding: "40px 16px", textAlign: "center" }}>
            <AlertTriangle size={28} color={T.tertiary} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ fontFamily: sans, fontSize: 13, color: T.tertiary, margin: 0 }}>No active recovery alerts</p>
          </div>
        ) : alerts.map((a) => (
          <div key={a.id} style={{ padding: "14px 16px", borderBottom: `1px solid ${T.charcoal}22`, cursor: "pointer", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.white, background: urgencyColor(a.urgency), padding: "2px 7px", borderRadius: 3, letterSpacing: 1, fontWeight: 600 }}>{a.urgency}</span>
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{formatPostTime(a.time)}</span>
              </div>
              <button onClick={(e) => { e.stopPropagation(); onDismiss(a.id); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", opacity: 0.5 }} onMouseEnter={e => e.currentTarget.style.opacity = 1} onMouseLeave={e => e.currentTarget.style.opacity = 0.5}>
                <X size={12} color={T.tertiary} />
              </button>
            </div>
            <p style={{ fontFamily: sans, fontSize: 14, color: T.white, margin: "0 0 4px", fontWeight: 600 }}>{a.title}</p>
            <p style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, margin: "0 0 8px", lineHeight: 1.5 }}>{a.detail}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={11} color={T.tertiary} />
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.location}</span>
              </div>
              <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.vehicle}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => { onClose(); onOpenDM && onOpenDM(a.author); }} style={{ background: T.red, color: T.white, fontFamily: sans, fontSize: 10, fontWeight: 600, padding: "7px 14px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 0.5 }}>RESPOND</button>
              <button onClick={() => { onClose(); onOpenMap && onOpenMap(a.coords, a.location, a.title); }} style={{ background: "none", color: T.tertiary, fontFamily: sans, fontSize: 10, padding: "7px 14px", borderRadius: 6, border: `1px solid ${T.charcoal}`, cursor: "pointer", letterSpacing: 0.5 }}>VIEW ON MAP</button>
            </div>
          </div>
        ))}
      </div>
      <button onClick={() => { onClose(); onGoToRecovery && onGoToRecovery(); }} style={{ padding: "12px 16px", borderTop: `1px solid ${T.charcoal}`, background: "none", border: "none", borderTopStyle: "solid", borderTopWidth: 1, borderTopColor: T.charcoal, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0 }}>
        <AlertTriangle size={12} color={T.red} />
        <span style={{ fontFamily: sans, fontSize: 11, color: T.red, fontWeight: 600, letterSpacing: 0.5 }}>VIEW ALL RECOVERY REQUESTS</span>
        <ChevronRight size={14} color={T.red} />
      </button>
    </div>
  );
}

function TopBar({ onProfile, onBack, showBack, title, onViewUser, onGoToRecovery, onOpenMap, onSearch, onOpenDM, dmUnread, bellNotifs, setBellNotifs, profilePic, notifPrefs, recoveryAlerts, setRecoveryAlerts }) {
  const notifTypeMap = { like: "likes", comment: "comments", reply: "replies", follow: "follows", mention: "mentions" };
  const filteredNotifs = bellNotifs.filter(n => { const pref = notifTypeMap[n.type]; return !pref || (notifPrefs && notifPrefs[pref] !== false); });
  const [openPanel, setOpenPanel] = useState(null); // null | "bell" | "recovery"

  const togglePanel = (panel) => setOpenPanel(openPanel === panel ? null : panel);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, zIndex: 200, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0, position: "relative" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {showBack && (
          <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center", marginRight: 4 }}>
            <ChevronLeft size={22} color={T.white} strokeWidth={1.5} />
          </button>
        )}
        <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white, letterSpacing: 3 }}>{title || "TRAILHEAD"}</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <button onClick={() => onSearch && onSearch()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", alignItems: "center" }}>
          <Search size={19} color={T.tertiary} strokeWidth={1.5} />
        </button>

        {/* DM Icon */}
        <button onClick={() => onOpenDM && onOpenDM()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", display: "flex", alignItems: "center" }}>
          <Mail size={19} color={T.tertiary} strokeWidth={1.5} />
          <NotifBadge count={dmUnread} color={T.copper} />
        </button>

        {/* Recovery Alert Icon */}
        <button onClick={() => togglePanel("recovery")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", display: "flex", alignItems: "center" }}>
          <AlertTriangle size={19} color={openPanel === "recovery" ? T.red : T.tertiary} strokeWidth={1.5} />
          <NotifBadge count={recoveryAlerts.length} color={T.red} />
        </button>

        {/* Bell Notification Icon */}
        <button onClick={() => togglePanel("bell")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, position: "relative", display: "flex", alignItems: "center" }}>
          <Bell size={19} color={openPanel === "bell" ? T.copper : T.tertiary} strokeWidth={1.5} />
          <NotifBadge count={filteredNotifs.length} color={T.copper} />
        </button>

        {/* Avatar */}
        <button onClick={() => { setOpenPanel(null); onProfile(); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
          {profilePic ? (
            <img src={profilePic} alt="" style={{ width: 28, height: 28, borderRadius: "50%", objectFit: "cover" }} />
          ) : (
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }}>K</span>
            </div>
          )}
        </button>
      </div>

      {/* Notification Panels */}
      {openPanel === "bell" && (
        <BellNotifPanel
          onClose={() => setOpenPanel(null)}
          onViewUser={(u) => { setOpenPanel(null); onViewUser && onViewUser(u); }}
          notifs={filteredNotifs}
          onDismiss={(id) => setBellNotifs(prev => prev.filter(n => n.id !== id))}
          onClearAll={() => setBellNotifs([])}
        />
      )}
      {openPanel === "recovery" && (
        <RecoveryNotifPanel
          onClose={() => setOpenPanel(null)}
          onGoToRecovery={() => { setOpenPanel(null); onGoToRecovery && onGoToRecovery(); }}
          alerts={recoveryAlerts}
          onDismiss={(id) => setRecoveryAlerts(prev => prev.filter(a => a.id !== id))}
          onClearAll={() => setRecoveryAlerts([])}
          onOpenMap={onOpenMap}
          onOpenDM={(user) => { setOpenPanel(null); onOpenDM && onOpenDM(user); }}
        />
      )}

      {/* Backdrop to close panels */}
      {openPanel && <div onClick={() => setOpenPanel(null)} style={{ position: "fixed", inset: 0, zIndex: 150 }} />}
    </div>
  );
}

/* ─── GLOBAL SEARCH OVERLAY ─── */
const globalSearchUsers = [
  { handle: "KyleLPO", initial: "K", name: "Kyle — Lone Peak Overland", badge: "Founder", followers: 4200 },
  { handle: "TrailBoss_88", initial: "T", name: "TrailBoss 88", badge: "Explorer", followers: 1860 },
  { handle: "VoltWrangler", initial: "V", name: "Volt Wrangler", badge: "Master Builder", followers: 3100 },
  { handle: "BajaBound", initial: "B", name: "Baja Bound", badge: "Navigator", followers: 920 },
  { handle: "SuspensionGuru", initial: "S", name: "Suspension Guru", badge: "Master Builder", followers: 2740 },
  { handle: "StockHero", initial: "S", name: "Stock Hero", badge: "Scout", followers: 680 },
  { handle: "Overland_Expert", initial: "O", name: "Overland Expert", badge: "Master Builder", followers: 2340 },
  { handle: "DesertRat_4x4", initial: "D", name: "DesertRat 4x4", badge: "Navigator", followers: 1580 },
  { handle: "SolarTrail", initial: "S", name: "Solar Trail", badge: "Explorer", followers: 1120 },
  { handle: "FoxFanatic", initial: "F", name: "Fox Fanatic", badge: "Explorer", followers: 840 },
  { handle: "GearDump", initial: "G", name: "Gear Dump", badge: "Scout", followers: 320 },
  { handle: "LiftKing", initial: "L", name: "Lift King", badge: "Master Builder", followers: 1950 },
  { handle: "DirtRoadDave", initial: "D", name: "DirtRoad Dave", badge: "Explorer", followers: 770 },
  { handle: "WattMaster", initial: "W", name: "Watt Master", badge: "Explorer", followers: 990 },
];

const globalSearchRoutes = [
  { name: "The Timberline Traverse", difficulty: "Hard", distance: "64.2 MI", region: "Pacific Northwest" },
  { name: "Hell's Revenge Loop", difficulty: "Expert", distance: "6.5 MI", region: "Southwest & Desert" },
  { name: "Eagle Rim Loop", difficulty: "Moderate", distance: "42.5 MI", region: "Southwest & Desert" },
  { name: "Shadow Peak Traverse", difficulty: "Hard", distance: "38.0 MI", region: "Rockies & High Plains" },
];

function GlobalSearch({ onClose, onViewUser, onOpenThread, onNavigate, forumUserReplies, forumViewCounts }) {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("ALL");
  const inputRef = useRef(null);
  const tabs = ["ALL", "THREADS", "USERS", "ROUTES"];

  useEffect(() => { if (inputRef.current) inputRef.current.focus(); }, []);

  const q = query.trim().toLowerCase();

  // Search forum threads
  const threadResults = q.length > 0 ? (() => {
    const results = [];
    forumData.categories.forEach(cat => {
      cat.subs.forEach(sub => {
        (forumData.threads[sub.name] || []).forEach(t => {
          if (t.title.toLowerCase().includes(q) || (t.body && t.body.toLowerCase().includes(q)) || t.author.toLowerCase().includes(q)) {
            results.push({ ...t, catName: cat.name, subName: sub.name, cat, sub });
          }
        });
      });
    });
    return results;
  })() : [];

  // Search users
  const userResults = q.length > 0 ? globalSearchUsers.filter(u =>
    u.handle.toLowerCase().includes(q) || u.name.toLowerCase().includes(q)
  ) : [];

  // Search routes
  const routeResults = q.length > 0 ? globalSearchRoutes.filter(r =>
    r.name.toLowerCase().includes(q) || r.region.toLowerCase().includes(q) || r.difficulty.toLowerCase().includes(q)
  ) : [];

  const totalResults = threadResults.length + userResults.length + routeResults.length;

  const showThreads = (activeTab === "ALL" || activeTab === "THREADS") && threadResults.length > 0;
  const showUsers = (activeTab === "ALL" || activeTab === "USERS") && userResults.length > 0;
  const showRoutes = (activeTab === "ALL" || activeTab === "ROUTES") && routeResults.length > 0;
  const limitAll = activeTab === "ALL" ? 3 : 999;

  const diffColor = (d) => d === "Expert" ? T.red : d === "Hard" ? T.copper : T.green;
  const badgeColor = (b) => b === "Founder" ? T.red : b === "Master Builder" ? T.copper : b === "Navigator" ? T.green : T.tertiary;

  return (
    <div style={{ position: "absolute", inset: 0, background: T.darkBg, zIndex: 500, display: "flex", flexDirection: "column" }}>
      {/* Search header */}
      <div style={{ padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ChevronLeft size={22} color={T.white} strokeWidth={1.5} />
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px", border: `1px solid ${T.copper}40` }}>
            <Search size={16} color={T.copper} />
            <input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)} placeholder="Search threads, @users, routes..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, marginLeft: 8, padding: 0 }} />
            {query && (
              <button onClick={() => setQuery("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={14} color={T.tertiary} />
              </button>
            )}
          </div>
        </div>
        {/* Filter tabs */}
        <div style={{ display: "flex", gap: 6, marginTop: 12, overflowX: "auto" }}>
          {tabs.map(t => (
            <button key={t} onClick={() => setActiveTab(t)} style={{ padding: "6px 14px", borderRadius: 20, background: activeTab === t ? T.red : T.darkCard, border: activeTab === t ? "none" : `1px solid ${T.charcoal}`, cursor: "pointer", flexShrink: 0 }}>
              <span style={{ fontFamily: sans, fontSize: 10, color: activeTab === t ? T.white : T.tertiary, fontWeight: 700, letterSpacing: 1 }}>{t}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {q.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <Search size={32} color={T.tertiary} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 4px" }}>Search across Trailhead</p>
            <p style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }}>Find threads, users, and routes</p>
          </div>
        ) : totalResults === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <Search size={32} color={T.tertiary} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 4px" }}>No results for "{query}"</p>
            <p style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }}>Try different keywords or check spelling</p>
          </div>
        ) : (
          <>
            {/* Users */}
            {showUsers && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600 }}>USERS ({userResults.length})</span>
                  {activeTab === "ALL" && userResults.length > limitAll && (
                    <button onClick={() => setActiveTab("USERS")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }}>SEE ALL</span>
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {userResults.slice(0, limitAll).map((u, i) => (
                    <div key={u.handle} onClick={() => { onClose(); onViewUser && onViewUser(u.handle); }} style={{ background: T.darkCard, padding: "12px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === Math.min(limitAll, userResults.length) - 1 ? "0 0 8px 8px" : 0, borderBottom: i < Math.min(limitAll, userResults.length) - 1 ? `1px solid ${T.charcoal}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${badgeColor(u.badge)}` }}>
                        <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: T.white }}>{u.initial}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>@{u.handle}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                          <span style={{ fontFamily: sans, fontSize: 10, color: badgeColor(u.badge), background: `${badgeColor(u.badge)}15`, padding: "1px 6px", borderRadius: 3, letterSpacing: 0.5 }}>{u.badge}</span>
                          <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{u.followers.toLocaleString()} followers</span>
                        </div>
                      </div>
                      <ChevronRight size={14} color={T.tertiary} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Threads */}
            {showThreads && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600 }}>THREADS ({threadResults.length})</span>
                  {activeTab === "ALL" && threadResults.length > limitAll && (
                    <button onClick={() => setActiveTab("THREADS")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }}>SEE ALL</span>
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {threadResults.slice(0, limitAll).map((t, i) => (
                    <div key={t.id} onClick={() => { onClose(); onOpenThread && onOpenThread(t.id, t.catName, t.subName); }} style={{ background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === Math.min(limitAll, threadResults.length) - 1 ? "0 0 8px 8px" : 0, borderBottom: i < Math.min(limitAll, threadResults.length) - 1 ? `1px solid ${T.charcoal}` : "none" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                        <MessageCircle size={10} color={T.copper} />
                        <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 0.5 }}>{t.catName}</span>
                        <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary }}>›</span>
                        <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary }}>{t.subName}</span>
                      </div>
                      <p style={{ fontFamily: serif, fontSize: 13, color: T.white, margin: "0 0 6px", lineHeight: 1.4 }}>{t.title}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>@{t.author}</span>
                        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{(t.replies || 0) + ((forumUserReplies || {})[t.id] || []).length} replies</span>
                        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{(() => { const base = typeof t.views === "string" ? parseFloat(t.views.replace(/[^0-9.]/g, "")) * (t.views.includes("K") ? 1000 : 1) : (t.views || 0); const extra = (forumViewCounts || {})[t.id] || 0; const total = Math.round(base + extra); return total >= 1000 ? (total / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(total); })()} views</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Routes */}
            {showRoutes && (
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600 }}>ROUTES ({routeResults.length})</span>
                  {activeTab === "ALL" && routeResults.length > limitAll && (
                    <button onClick={() => setActiveTab("ROUTES")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                      <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }}>SEE ALL</span>
                    </button>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  {routeResults.slice(0, limitAll).map((r, i) => (
                    <div key={r.name} onClick={() => { onClose(); onNavigate && onNavigate("routes"); }} style={{ background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === Math.min(limitAll, routeResults.length) - 1 ? "0 0 8px 8px" : 0, borderBottom: i < Math.min(limitAll, routeResults.length) - 1 ? `1px solid ${T.charcoal}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 8, background: `${diffColor(r.difficulty)}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Compass size={18} color={diffColor(r.difficulty)} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>{r.name}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                          <span style={{ fontFamily: sans, fontSize: 10, color: diffColor(r.difficulty), fontWeight: 600 }}>{r.difficulty}</span>
                          <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{r.distance}</span>
                          <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{r.region}</span>
                        </div>
                      </div>
                      <ChevronRight size={14} color={T.tertiary} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── HELPERS ─── */
const ensureUrl = (link) => {
  if (!link) return "#";
  if (/^https?:\/\//i.test(link)) return link;
  return "https://" + link;
};

const formatPostTime = (t) => {
  if (!t) return "";
  if (typeof t === "string" && !/^\d{10,}$/.test(t)) return t; // already a display string like "2m ago"
  const ts = typeof t === "number" ? t : parseInt(t, 10);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 0) return "Just now";
  const secs = Math.floor(diff / 1000);
  if (secs < 60) return "Just now";
  const mins = Math.floor(secs / 60);
  if (mins < 60) return mins + "m ago";
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + "h ago";
  const d = new Date(ts);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  return months[d.getMonth()] + " " + d.getDate() + ", " + d.getFullYear();
};

/* ─── MENTION INPUT ─── */
function MentionInput({ value, onChange, onKeyDown, placeholder, style, inputRef, users, multiline, onFocus, onBlur }) {
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionActive, setMentionActive] = useState(false);
  const [cursorPos, setCursorPos] = useState(0);
  const internalRef = useRef(null);
  const ref = inputRef || internalRef;

  const mentionUsers = users || globalSearchUsers.filter(u => u.handle !== "KyleLPO");

  const handleChange = (e) => {
    const val = e.target.value;
    const pos = e.target.selectionStart;
    onChange(val);
    setCursorPos(pos);

    // Find @ trigger: look backwards from cursor for an unfinished @mention
    const before = val.slice(0, pos);
    const atMatch = before.match(/@(\w*)$/);
    if (atMatch) {
      setMentionQuery(atMatch[1].toLowerCase());
      setMentionActive(true);
    } else {
      setMentionActive(false);
      setMentionQuery("");
    }
  };

  const insertMention = (handle) => {
    const before = value.slice(0, cursorPos);
    const after = value.slice(cursorPos);
    const atIdx = before.lastIndexOf("@");
    const newVal = before.slice(0, atIdx) + "@" + handle + " " + after;
    onChange(newVal);
    setMentionActive(false);
    setMentionQuery("");
    setTimeout(() => {
      if (ref.current) {
        const newPos = atIdx + handle.length + 2;
        ref.current.focus();
        ref.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  const filtered = mentionUsers.filter(u =>
    mentionQuery === "" || u.handle.toLowerCase().includes(mentionQuery) || u.name.toLowerCase().includes(mentionQuery)
  ).slice(0, 5);

  const InputEl = multiline ? "textarea" : "input";

  return (
    <div style={{ position: "relative", flex: 1 }}>
      <InputEl
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={(e) => {
          if (mentionActive && e.key === "Escape") { setMentionActive(false); return; }
          onKeyDown && onKeyDown(e);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        style={style}
      />
      {mentionActive && filtered.length > 0 && (
        <div style={{ position: "absolute", bottom: "100%", left: 0, right: 0, background: T.darkCard, border: `1px solid ${T.charcoal}`, borderRadius: 10, marginBottom: 4, maxHeight: 200, overflowY: "auto", zIndex: 300, boxShadow: "0 -4px 20px rgba(0,0,0,0.5)" }}>
          {filtered.map(u => (
            <button key={u.handle} onClick={(e) => { e.preventDefault(); e.stopPropagation(); insertMention(u.handle); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "none", border: "none", borderBottom: `1px solid ${T.charcoal}20`, cursor: "pointer", textAlign: "left" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }}>{u.initial}</span>
              </div>
              <div>
                <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, display: "block" }}>@{u.handle}</span>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{u.name}</span>
              </div>
              {u.badge && <span style={{ marginLeft: "auto", fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}18`, padding: "2px 6px", borderRadius: 4, letterSpacing: 0.5 }}>{u.badge}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Extract @mentions from text
const extractMentions = (text) => {
  const matches = text.match(/@(\w+)/g);
  if (!matches) return [];
  return matches.map(m => m.slice(1));
};

/* ─── IMAGE CAROUSEL LIGHTBOX ─── */
function ImageCarousel({ images, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex || 0);
  const touchStartX = useRef(null);
  if (!images || images.length === 0) return null;

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) { diff > 0 ? prev() : next(); }
    touchStartX.current = null;
  };

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.92)", zIndex: 9999, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {/* Close button */}
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, background: `${T.charcoal}CC`, border: "none", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}>
        <X size={18} color={T.white} />
      </button>
      {/* Counter */}
      <div style={{ position: "absolute", top: 20, left: "50%", transform: "translateX(-50%)", fontFamily: sans, fontSize: 12, color: T.warmBg, letterSpacing: 1, zIndex: 10 }}>
        {idx + 1} / {images.length}
      </div>
      {/* Image area */}
      <div onClick={e => e.stopPropagation()} onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ width: "100%", maxWidth: 430, flex: 1, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", padding: "50px 0" }}>
        <img src={images[idx]} alt="" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", borderRadius: 4 }} />
        {/* Nav arrows */}
        {images.length > 1 && (
          <>
            <button onClick={(e) => { e.stopPropagation(); prev(); }} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: `${T.charcoal}AA`, border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronLeft size={22} color={T.white} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); next(); }} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: `${T.charcoal}AA`, border: "none", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronRight size={22} color={T.white} />
            </button>
          </>
        )}
      </div>
      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 6, padding: "12px 16px", overflowX: "auto", maxWidth: 430, width: "100%" }}>
          {images.map((img, i) => (
            <img key={i} src={img} alt="" onClick={() => setIdx(i)} style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0, cursor: "pointer", border: i === idx ? `2px solid ${T.copper}` : `2px solid transparent`, opacity: i === idx ? 1 : 0.5, transition: "opacity 0.15s, border 0.15s" }} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── FEED SCREEN ─── */
const defaultFeedItems = [
    {
      id: "f1", type: "RECOVERY", user: "DesertRat_4x4", initial: "D", time: "2m ago",
      title: "Stuck in Black Bear Pass: Winch Support Required",
      body: "High-centered on a shelf. Front locker acting up. Need a heavy rig with at least 12k winch to assist.",
      location: "San Juan, CO", urgency: "HIGH", coords: "45.89° N, 121.35° W",
      likes: 18, comments: 24,
      seedComments: [
        { user: "TrailBoss_88", initial: "T", text: "I'm 20 minutes out with a 12k Warn. Hang tight.", time: "1m ago", likes: 14 },
        { user: "Sierra_Tactical", initial: "S", text: "What's your exact pin? I can relay to the convoy group heading that way.", time: "1m ago", likes: 8 },
        { user: "Peak_Finder", initial: "P", text: "That shelf gets everyone. Stay patient, help is close.", time: Date.now(), likes: 3 },
      ],
    },
    {
      id: "f2", type: "ROUTES", user: "Peak_Finder", initial: "P", time: "28m ago",
      title: "Hell's Revenge Loop",
      body: null, distance: "6.5 MI", duration: "2H 45M", badge: "TOP RATED", verified: 12,
      likes: 142, comments: 31,
      seedComments: [
        { user: "Overland_Expert", initial: "O", text: "Ran this last weekend — the fin climb is no joke. Air down to 18 psi minimum.", time: "20m ago", likes: 23 },
        { user: "BajaBound", initial: "B", text: "One of the best loops in Moab. The views at the top are unreal.", time: "15m ago", likes: 11 },
        { user: "DirtRoadDave", initial: "D", text: "Is this doable on 33s with no lockers?", time: "8m ago", likes: 5 },
      ],
    },
    {
      id: "f3", type: "BUILDS", user: "Overland_Expert", initial: "OE", time: "1h ago",
      title: "Stage 3: Suspension Complete",
      subtitle: "Posted a new Build Stage", stage: "Stage 3: Suspension",
      likes: 1200, comments: 84,
      seedComments: [
        { user: "LiftKing", initial: "L", text: "Icon Stage 3 is the move. How's the ride quality on highway?", time: "52m ago", likes: 34 },
        { user: "FoxFanatic", initial: "F", text: "Clean install. What spring rate did you go with up front?", time: "45m ago", likes: 18 },
        { user: "SuspensionGuru", initial: "S", text: "Great choice on the adjustable UCAs. Makes a huge difference for alignment.", time: "30m ago", likes: 27 },
      ],
    },
    {
      id: "f4", type: "CONVOYS", user: "Sierra_Tactical", initial: "S", time: "2h ago",
      title: "Alpine Summit Chase",
      body: "Join 8 other rigs for a sunrise ascent. Stock friendly with recovery points.",
      month: "OCT", day: "24", departs: "05:00 AM", slots: 4,
      likes: 67, comments: 12,
      seedComments: [
        { user: "MountainGoat", initial: "M", text: "Count me in! I'll bring my recovery kit and a SAT phone.", time: "1h ago", likes: 9 },
        { user: "GearDump", initial: "G", text: "Is there a minimum tire size requirement?", time: "55m ago", likes: 2 },
      ],
    },
    {
      id: "f5", type: "PHOTOS", user: "Nomad_Queen", initial: "N", time: "3h ago",
      title: "Golden hour on the Mojave — first trip with the new rack setup",
      body: null, photoCount: 4,
      likes: 389, comments: 42,
      seedComments: [
        { user: "SolarTrail", initial: "S", text: "That light is unreal. What rack system are you running?", time: "2h ago", likes: 31 },
        { user: "DesertRat_4x4", initial: "D", text: "Mojave golden hour hits different. Amazing shots.", time: "1h ago", likes: 22 },
        { user: "WattMaster", initial: "W", text: "The rack looks great with that setup. Clean build overall.", time: "45m ago", likes: 8 },
      ],
    },
    {
      id: "f6", type: "ROUTES", user: "TrailBoss_88", initial: "T", time: "4h ago",
      title: "Rubicon Trail — Full GPS Track",
      body: null, distance: "22 MI", duration: "6H 30M", badge: null, verified: 34,
      likes: 210, comments: 56,
      seedComments: [
        { user: "Overland_Expert", initial: "O", text: "The Rubicon is a bucket list trail. This GPS track is solid — saved it.", time: "3h ago", likes: 19 },
        { user: "StockHero", initial: "S", text: "Can a stock 4Runner make it through or do you need lockers?", time: "2h ago", likes: 7 },
        { user: "LiftKing", initial: "L", text: "Did this last spring. The Sluice is the gnarliest section by far.", time: "1h ago", likes: 15 },
      ],
    },
    {
      id: "f7", type: "BUILDS", user: "Kyle Morrison", initial: "K", time: "5h ago",
      title: "CBI Front Bumper Install",
      subtitle: "Updated build — THE HIGHLANDER", stage: "Armor: CBI Offroad",
      likes: 94, comments: 17,
      seedComments: [
        { user: "TrailBoss_88", initial: "T", text: "CBI makes the best bumpers in the game. How's the approach angle now?", time: "4h ago", likes: 12 },
        { user: "GearDump", initial: "G", text: "Looks tank-tough. Did you add the light bar cutout?", time: "3h ago", likes: 6 },
      ],
    },
    {
      id: "f8", type: "CONVOYS", user: "BajaBound", initial: "B", time: "6h ago",
      title: "Baja Norte Expedition — Feb 2027",
      body: "5-day coastal run from Ensenada to Bahía de los Ángeles. Need min 33\" tires and recovery gear.",
      month: "FEB", day: "14", departs: "06:00 AM", slots: 6,
      likes: 156, comments: 38,
      seedComments: [
        { user: "Sierra_Tactical", initial: "S", text: "This sounds epic. What's the camping situation — dispersed or established sites?", time: "5h ago", likes: 16 },
        { user: "Nomad_Queen", initial: "N", text: "I've done this route twice. Pro tip: carry extra fuel after El Rosario.", time: "4h ago", likes: 42 },
        { user: "DesertRat_4x4", initial: "D", text: "I'm in. Running 35s with dual lockers. Will DM you.", time: "3h ago", likes: 10 },
      ],
    },
    {
      id: "f9", type: "PHOTOS", user: "MountainGoat", initial: "M", time: "8h ago",
      title: "Snowcapped ridgeline crossing — 4Runner doing 4Runner things",
      body: null, photoCount: 7,
      likes: 512, comments: 63,
      seedComments: [
        { user: "Peak_Finder", initial: "P", text: "This is why I drive a 4Runner. Incredible shots.", time: "7h ago", likes: 38 },
        { user: "Overland_Expert", initial: "O", text: "What tires are you running for the snow? Looks like great traction.", time: "6h ago", likes: 14 },
        { user: "DirtRoadDave", initial: "D", text: "The snow on the ridge makes this look like a postcard. Jealous.", time: "5h ago", likes: 21 },
      ],
    },
    {
      id: "f10", type: "RECOVERY", user: "TrailBoss_88", initial: "T", time: "12h ago",
      title: "Tow Needed — Broken Axle on Rubicon",
      body: "Front axle snapped at the birfield. Cannot move under own power. Need a flatbed or heavy tow rig.",
      location: "Rubicon Trail, CA", urgency: "HIGH", coords: "38.97° N, 120.16° W",
      likes: 32, comments: 41,
      seedComments: [
        { user: "Overland_Expert", initial: "O", text: "That's a tough break. I know a flatbed service out of Placerville — DM me.", time: "11h ago", likes: 17 },
        { user: "LiftKing", initial: "L", text: "Birfields are the weak link on those axles. Glad you're safe.", time: "10h ago", likes: 9 },
      ],
    },
    {
      id: "f11", type: "FORUM", user: "VoltWrangler", initial: "V", time: "6h ago",
      title: "How to properly wire auxiliary batteries for dual setups",
      body: "Complete guide to dual battery setups — isolators, wiring gauges, fusing, and what NOT to do. Learned some hard lessons.",
      forumCat: "How-To Guides", forumSub: "Electrical & Wiring", replies: 124, views: "8.4K",
      threadId: 5,
      likes: 89, comments: 124,
      seedComments: [
        { user: "WattMaster", initial: "W", text: "Great write-up. One thing to add — always fuse both sides of the isolator.", time: "5h ago", likes: 45 },
        { user: "SolarTrail", initial: "S", text: "Wish I had this guide before I fried my first isolator. Bookmarked.", time: "4h ago", likes: 28 },
      ],
    },
    {
      id: "f12", type: "FORUM", user: "TrailBoss_88", initial: "T", time: "2h ago",
      title: "Best budget lift kit for 3rd Gen Tacoma?",
      body: "Looking at Icon, Bilstein, or OME for my 2020 Tacoma. Budget is around $1,500. Primarily doing fire roads and moderate trails in the PNW.",
      forumCat: "How-To Guides", forumSub: "Suspension & Lift", replies: 47, views: "2.1K",
      threadId: 1,
      likes: 56, comments: 47,
      seedComments: [
        { user: "SuspensionGuru", initial: "S", text: "For $1,500 you can't beat Bilstein 5100s with OME springs. Great combo for PNW trails.", time: "1h ago", likes: 33 },
        { user: "FoxFanatic", initial: "F", text: "If you can stretch the budget a bit, the Icon Stage 1 is worth every penny.", time: "45m ago", likes: 19 },
        { user: "LiftKing", initial: "L", text: "OME is the go-to for budget builds. Reliable and great ride quality.", time: "30m ago", likes: 24 },
      ],
    },
    {
      id: "f13", type: "FORUM", user: "BajaBound", initial: "B", time: "1d ago",
      title: "Planning a Baja convoy — Feb 2027",
      body: "Looking for 6-8 rigs for a 2-week Baja trip. Starting in San Diego, heading down to Cabo via the pacific coast.",
      forumCat: "Trip Coordination", forumSub: "Convoy Planning", replies: 31, views: "890",
      threadId: 7,
      likes: 42, comments: 31,
      seedComments: [
        { user: "Sierra_Tactical", initial: "S", text: "I'm interested. What's the plan for border crossing logistics?", time: "20h ago", likes: 11 },
        { user: "Nomad_Queen", initial: "N", text: "Two weeks in Baja sounds amazing. Is there a WhatsApp group yet?", time: "18h ago", likes: 15 },
      ],
    },
  ];

function FeedScreen({ onViewUser, onOpenMap, onOpenThread, onOpenDM, feedItems, onUpdateFeed, onAddNotification, forumUserReplies, forumViewCounts, savedRoutes, onSaveRoute, onUnsaveRoute, onStartNav }) {
  const [activeFilter, setActiveFilter] = useState("ALL");
  const filters = ["ALL", "BUILDS", "CONVOYS", "ROUTES", "PHOTOS", "FORUM"];
  const [likedPosts, setLikedPosts] = useState({});
  const [likedComments, setLikedComments] = useState({}); // { "postId-commentIdx": true }
  const [commentLikeCounts, setCommentLikeCounts] = useState({}); // { "postId-commentIdx": count }
  const [openComments, setOpenComments] = useState(null); // post id or null
  const [commentText, setCommentText] = useState("");
  const [postComments, setPostComments] = useState({}); // { postId: [{ user, text, time }] }
  const [shareMenuId, setShareMenuId] = useState(null);
  const [sharePickerId, setSharePickerId] = useState(null); // post id when showing user picker
  const [shareSearch, setShareSearch] = useState("");
  const [copiedToast, setCopiedToast] = useState(false);
  const [expandedBuildPost, setExpandedBuildPost] = useState(null);
  const [expandedRoutePost, setExpandedRoutePost] = useState(null);
  const [routeShareMenu, setRouteShareMenu] = useState(null); // item.id when share/save dropdown open
  const [carouselImages, setCarouselImages] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const collectBuildImages = (bd) => {
    const imgs = [];
    if (bd.mainPhotos) bd.mainPhotos.forEach(p => imgs.push(p.url));
    [bd.suspension, bd.tires, bd.wheels, bd.bumpers, bd.armor, bd.lighting, bd.rack, bd.winch, bd.otherMods].forEach(mod => {
      if (mod && mod.photo) mod.photo.forEach(p => imgs.push(p.url));
    });
    if (bd.camperPhoto) bd.camperPhoto.forEach(p => imgs.push(p.url));
    return imgs;
  };

  const openCarousel = (images, startIdx) => {
    if (images && images.length > 0) {
      setCarouselImages(images);
      setCarouselIndex(startIdx || 0);
    }
  };
  const commentInputRef = useRef(null);
  const shareSearchRef = useRef(null);

  const toggleLike = (id) => {
    const wasLiked = likedPosts[id];
    setLikedPosts(prev => ({ ...prev, [id]: !prev[id] }));
    onUpdateFeed && onUpdateFeed(feedItems.map(item =>
      item.id === id ? { ...item, likes: item.likes + (wasLiked ? -1 : 1) } : item
    ));
    if (!wasLiked) {
      const post = feedItems.find(p => p.id === id);
      if (post) onAddNotification && onAddNotification({ type: "like", user: "KyleLPO", text: "liked a post by @" + post.user, target: post.title, icon: Heart, iconColor: T.red });
    }
  };

  const toggleCommentLike = (postId, commentIdx, comment) => {
    const key = postId + "-" + commentIdx;
    const wasLiked = likedComments[key];
    setLikedComments(prev => ({ ...prev, [key]: !prev[key] }));
    setCommentLikeCounts(prev => ({ ...prev, [key]: (prev[key] || (comment.likes || 0)) + (wasLiked ? -1 : 1) }));
    if (!wasLiked) {
      const post = feedItems.find(p => p.id === postId);
      onAddNotification && onAddNotification({ type: "like", user: "KyleLPO", text: "liked @" + comment.user + "'s comment on", target: post ? post.title : "", icon: Heart, iconColor: T.red });
    }
  };

  const addComment = (id) => {
    if (!commentText.trim()) return;
    const newComment = { user: "KyleLPO", initial: "K", text: commentText.trim(), time: Date.now(), likes: 0 };
    setPostComments(prev => ({ ...prev, [id]: [...(prev[id] || []), newComment] }));
    onUpdateFeed && onUpdateFeed(feedItems.map(item =>
      item.id === id ? { ...item, comments: item.comments + 1 } : item
    ));
    const post = feedItems.find(p => p.id === id);
    if (post) onAddNotification && onAddNotification({ type: "comment", user: "KyleLPO", text: "commented on @" + post.user + "'s post", target: post.title, icon: MessageCircle, iconColor: T.copper });
    // Send mention notifications for @tagged users
    const mentions = extractMentions(commentText);
    mentions.forEach(handle => {
      if (handle !== "KyleLPO") {
        onAddNotification && onAddNotification({ type: "mention", user: "KyleLPO", text: "mentioned you in a comment", target: post ? post.title : "", icon: AtSign, iconColor: T.copper });
      }
    });
    setCommentText("");
  };

  const toggleComments = (id) => {
    setOpenComments(openComments === id ? null : id);
    setCommentText("");
    setShareMenuId(null);
    setSharePickerId(null);
    setShareSearch("");
  };

  const filtered = activeFilter === "ALL" ? feedItems : feedItems.filter(p => p.type === activeFilter);

  const fmtLikes = (n) => n >= 1000 ? (n / 1000).toFixed(1) + "K" : n;

  const sendShareToUser = (recipientHandle, item) => {
    const shareText = "";
    const sharedPost = { id: item.id, title: item.title, user: item.user, initial: item.initial, type: item.type, image: (item.photoUrls && item.photoUrls[0]) || null, threadId: item.threadId, forumCat: item.forumCat, forumSub: item.forumSub };
    setShareMenuId(null);
    setSharePickerId(null);
    setShareSearch("");
    onOpenDM && onOpenDM(recipientHandle, shareText, sharedPost);
  };

  const actionBar = (item, extraLeft) => {
    const liked = likedPosts[item.id];
    const allComments = [...(item.seedComments || []), ...(postComments[item.id] || [])];
    const shareFilteredUsers = globalSearchUsers.filter(u => u.handle !== "KyleLPO" && (shareSearch === "" || u.name.toLowerCase().includes(shareSearch.toLowerCase()) || u.handle.toLowerCase().includes(shareSearch.toLowerCase())));
    return (
      <>
        <div style={{ padding: "0 16px 4px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 4 }}>
            <button onClick={(e) => { e.stopPropagation(); toggleLike(item.id); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 20, background: liked ? `${T.red}18` : "transparent", border: "none", cursor: "pointer", transition: "all 0.15s" }}>
              <Heart size={16} color={liked ? T.red : T.tertiary} strokeWidth={1.5} fill={liked ? T.red : "none"} />
              <span style={{ fontFamily: sans, fontSize: 12, color: liked ? T.red : T.tertiary, fontWeight: liked ? 600 : 400 }}>{fmtLikes(item.likes)}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleComments(item.id); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 20, background: openComments === item.id ? `${T.copper}18` : "transparent", border: "none", cursor: "pointer" }}>
              <MessageCircle size={16} color={openComments === item.id ? T.copper : T.tertiary} strokeWidth={1.5} />
              <span style={{ fontFamily: sans, fontSize: 12, color: openComments === item.id ? T.copper : T.tertiary }}>{item.comments}</span>
            </button>
            <button onClick={(e) => { e.stopPropagation(); const isOpen = shareMenuId === item.id; setShareMenuId(isOpen ? null : item.id); setSharePickerId(null); setShareSearch(""); setOpenComments(null); }} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 12px", borderRadius: 20, background: shareMenuId === item.id ? `${T.copper}18` : "transparent", border: "none", cursor: "pointer" }}>
              <Send size={15} color={shareMenuId === item.id ? T.copper : T.tertiary} strokeWidth={1.5} />
            </button>
          </div>
          {extraLeft}
        </div>

        {/* Share menu */}
        {shareMenuId === item.id && !sharePickerId && (
          <div style={{ margin: "0 16px 10px", background: T.darkCard, borderRadius: 8, border: `1px solid ${T.charcoal}`, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <button onClick={() => { setSharePickerId(item.id); setTimeout(() => shareSearchRef.current && shareSearchRef.current.focus(), 50); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "none", border: "none", borderBottom: `1px solid ${T.charcoal}`, cursor: "pointer", width: "100%" }}>
              <Mail size={14} color={T.copper} />
              <span style={{ fontFamily: sans, fontSize: 12, color: T.white }}>Send via Direct Message</span>
              <ChevronRight size={14} color={T.tertiary} style={{ marginLeft: "auto" }} />
            </button>
            <button onClick={() => { setShareMenuId(null); const url = window.location.origin + "/post/" + item.id; navigator.clipboard && navigator.clipboard.writeText(url); setCopiedToast(true); setTimeout(() => setCopiedToast(false), 1800); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 14px", background: "none", border: "none", cursor: "pointer", width: "100%" }}>
              <ExternalLink size={14} color={T.tertiary} />
              <span style={{ fontFamily: sans, fontSize: 12, color: T.white }}>Copy link</span>
            </button>
          </div>
        )}

        {/* Share user picker */}
        {sharePickerId === item.id && (
          <div style={{ margin: "0 16px 10px", background: T.darkCard, borderRadius: 8, border: `1px solid ${T.charcoal}`, overflow: "hidden" }} onClick={e => e.stopPropagation()}>
            <div style={{ padding: "10px 12px", borderBottom: `1px solid ${T.charcoal}`, display: "flex", alignItems: "center", gap: 8 }}>
              <button onClick={() => { setSharePickerId(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <ChevronLeft size={16} color={T.tertiary} />
              </button>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600 }}>Send to...</span>
            </div>
            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.charcoal}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, background: T.charcoal, borderRadius: 20, padding: "6px 12px" }}>
                <Search size={13} color={T.tertiary} />
                <input ref={shareSearchRef} value={shareSearch} onChange={e => setShareSearch(e.target.value)} placeholder="Search people..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: sans, fontSize: 12, padding: 0 }} />
              </div>
            </div>
            {/* Post preview */}
            <div style={{ padding: "8px 12px", borderBottom: `1px solid ${T.charcoal}`, background: `${T.charcoal}60` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 7, fontWeight: 700, color: T.white }}>{item.initial}</span>
                </div>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>@{item.user}</span>
              </div>
              <p style={{ fontFamily: serif, fontSize: 11, color: T.warmStone, margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</p>
            </div>
            <div style={{ maxHeight: 200, overflowY: "auto" }}>
              {shareFilteredUsers.slice(0, 8).map(u => (
                <button key={u.handle} onClick={() => sendShareToUser(u.handle, item)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "none", border: "none", borderBottom: `1px solid ${T.charcoal}20`, cursor: "pointer", width: "100%" }}>
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }}>{u.initial}</span>
                  </div>
                  <div style={{ flex: 1, textAlign: "left" }}>
                    <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, display: "block" }}>{u.name}</span>
                    <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>@{u.handle}</span>
                  </div>
                  <Send size={14} color={T.copper} />
                </button>
              ))}
              {shareFilteredUsers.length === 0 && (
                <div style={{ padding: "16px 12px", textAlign: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary }}>No users found</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Comments section */}
        {openComments === item.id && (
          <div style={{ margin: "0 16px 12px", borderTop: `1px solid ${T.charcoal}`, paddingTop: 10 }} onClick={e => e.stopPropagation()}>
            {allComments.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 10, maxHeight: 280, overflowY: "auto" }}>
                {allComments.map((c, ci) => {
                  const cmtKey = item.id + "-" + ci;
                  const cmtLiked = likedComments[cmtKey];
                  const cmtLikeCount = commentLikeCounts[cmtKey] !== undefined ? commentLikeCounts[cmtKey] : (c.likes || 0);
                  return (
                    <div key={ci} style={{ display: "flex", gap: 8 }}>
                      <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}>
                        <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.copper }}>{c.initial}</span>
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span onClick={() => onViewUser && onViewUser(c.user.replace(/\s/g, "_"))} style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, cursor: "pointer" }}>@{c.user}</span>
                          <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary }}>{formatPostTime(c.time)}</span>
                        </div>
                        <p style={{ fontFamily: serif, fontSize: 13, color: T.warmStone, margin: "2px 0 0", lineHeight: 1.4 }}>{c.text}</p>
                        <button onClick={() => toggleCommentLike(item.id, ci, c)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 0 0 0", marginTop: 2 }}>
                          <Heart size={12} color={cmtLiked ? T.red : T.tertiary} strokeWidth={1.5} fill={cmtLiked ? T.red : "none"} />
                          {cmtLikeCount > 0 && <span style={{ fontFamily: sans, fontSize: 10, color: cmtLiked ? T.red : T.tertiary }}>{cmtLikeCount}</span>}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }}>K</span>
              </div>
              <div style={{ flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 20, padding: "8px 12px", border: `1px solid ${T.charcoal}` }}>
                <MentionInput inputRef={openComments === item.id ? commentInputRef : null} value={commentText} onChange={setCommentText} onKeyDown={e => { if (e.key === "Enter") addComment(item.id); }} placeholder="Add a comment..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 12, padding: 0, width: "100%" }} />
              </div>
              <button onClick={() => addComment(item.id)} disabled={!commentText.trim()} style={{ background: commentText.trim() ? T.red : T.charcoal, border: "none", cursor: commentText.trim() ? "pointer" : "default", width: 30, height: 30, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", opacity: commentText.trim() ? 1 : 0.4, padding: 0, flexShrink: 0 }}>
                <ArrowUp size={14} color={T.white} />
              </button>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderCard = (item) => {
    if (item.type === "POST") {
      return (
        <div key={item.id} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }}>{item.initial}</span>
            </div>
            <div style={{ flex: 1 }}>
              <span onClick={() => onViewUser && onViewUser(item.user.replace(/\s/g, "_"))} style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, cursor: "pointer" }}>{item.user}</span>
              <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary, display: "block" }}>{formatPostTime(item.time)}</span>
            </div>
          </div>
          <div style={{ padding: "0 16px 14px" }}>
            <p style={{ fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 8px", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{item.title}</p>
            {item.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 4 }}>
                <MapPin size={11} color={T.tertiary} />
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{item.location}</span>
              </div>
            )}
          </div>
          {actionBar(item)}
        </div>
      );
    }

    if (item.type === "RECOVERY") {
      return (
        <div key={item.id} style={cardStyle}>
          <div style={{ background: `${T.red}18`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={16} color={T.red} />
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: T.red, letterSpacing: 0.5 }}>RECOVERY NEEDED</span>
            </div>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{formatPostTime(item.time)}</span>
          </div>
          <div style={{ padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white }}>{item.initial}</span>
              </div>
              <span onClick={() => onViewUser && onViewUser(item.user.replace(/\s/g, "_"))} style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, cursor: "pointer" }}>{item.user}</span>
            </div>
            <p style={{ fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 8px", lineHeight: 1.5 }}>{item.title}</p>
            {item.body && <p style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, margin: "0 0 12px", lineHeight: 1.6 }}>{item.body}</p>}
            {item.vehicle && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 8 }}>
                <Wrench size={11} color={T.tertiary} />
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{item.vehicle}</span>
              </div>
            )}
            {item.photoUrls && item.photoUrls.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12, overflowX: "auto" }}>
                {item.photoUrls.map((url, pi) => (
                  <img key={pi} src={url} alt="" onClick={() => openCarousel(item.photoUrls, pi)} style={{ width: item.photoUrls.length === 1 ? "100%" : 140, height: item.photoUrls.length === 1 ? 180 : 100, borderRadius: 8, objectFit: "cover", cursor: "pointer", flexShrink: 0 }} />
                ))}
              </div>
            )}
            <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={12} color={T.tertiary} />
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{item.location}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <AlertTriangle size={12} color={item.urgency === "HIGH" ? T.red : T.copper} />
                <span style={{ fontFamily: sans, fontSize: 11, color: item.urgency === "HIGH" ? T.red : T.copper, fontWeight: 600 }}>{item.urgency || "HIGH"} URGENCY</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <div style={{ background: T.charcoal, padding: "6px 10px", borderRadius: 6, display: "flex", alignItems: "center", gap: 4 }}>
                <Navigation size={12} color={T.tertiary} />
                <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>{item.coords}</span>
              </div>
              <button onClick={() => onOpenMap && onOpenMap(item.coords, item.location, item.title)} style={{ fontFamily: sans, fontSize: 11, color: T.red, background: "none", border: "none", cursor: "pointer", letterSpacing: 0.5 }}>Open in Maps</button>
            </div>
          </div>
          {actionBar(item, <button onClick={() => onOpenDM && onOpenDM(item.user)} style={{ background: T.red, color: T.white, fontFamily: sans, fontSize: 11, fontWeight: 600, padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 0.5 }}>Respond</button>)}
        </div>
      );
    }

    if (item.type === "ROUTES") {
      const isRouteExp = expandedRoutePost === item.id;
      const rdiffColor = (d) => d === "Expert" ? T.red : d === "Hard" ? T.copper : d === "Moderate" ? T.tertiary : T.green;
      return (
        <div key={item.id} style={cardStyle}>
          <div onClick={() => setExpandedRoutePost(isRouteExp ? null : item.id)} style={{ height: 160, background: T.charcoal, position: "relative", cursor: "pointer", overflow: "hidden" }}>
            {/* Show live map if route has pins/points, otherwise fallback */}
            {((item.pins && item.pins.length > 0) || (item.points && item.points.length > 0)) ? (
              <RouteMapPreview pins={item.pins} points={item.points} photos={item.photos} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}40 100%)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Map size={48} color={T.tertiary} strokeWidth={0.5} style={{ opacity: 0.3 }} />
              </div>
            )}
            {item.badge && (
              <div style={{ position: "absolute", top: 12, right: 12, background: `${T.charcoal}CC`, padding: "4px 10px", borderRadius: 4, zIndex: 5 }}>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.warmBg, letterSpacing: 1, fontWeight: 600 }}>{item.badge}</span>
              </div>
            )}
            <div style={{ position: "absolute", top: 12, left: 12, zIndex: 5 }}>
              <ChevronDown size={14} color={T.white} style={{ transform: isRouteExp ? "rotate(180deg)" : "none", transition: "transform 0.2s", filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.6))" }} />
            </div>
            <div style={{ position: "absolute", bottom: 10, left: 10, display: "flex", alignItems: "center", gap: 6, background: `${T.darkBg}CC`, padding: "5px 10px 5px 5px", borderRadius: 20, zIndex: 5, backdropFilter: "blur(4px)" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white }}>{item.initial}</span>
              </div>
              <span onClick={(e) => { e.stopPropagation(); onViewUser && onViewUser(item.user.replace(/\s/g, "_")); }} style={{ fontFamily: sans, fontSize: 10, color: T.white, cursor: "pointer" }}>{item.user}</span>
              <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{formatPostTime(item.time)}</span>
            </div>
          </div>
          <div style={{ padding: 16 }}>
            <h3 onClick={() => setExpandedRoutePost(isRouteExp ? null : item.id)} style={{ fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 8px", cursor: "pointer" }}>{item.title}</h3>
            <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }}>{item.distance}</span>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }}>{item.duration}</span>
              {item.difficulty && (
                <span style={{ fontFamily: sans, fontSize: 10, color: rdiffColor(item.difficulty), background: `${rdiffColor(item.difficulty)}20`, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 }}>{item.difficulty.toUpperCase()}</span>
              )}
            </div>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary, marginBottom: 4 }}>+{item.verified} Verified This Week</span>
          </div>
          {/* Expanded route details */}
          {isRouteExp && (
            <div style={{ borderTop: `1px solid ${T.charcoal}`, padding: 16 }}>
              {/* Map preview */}
              {((item.pins && item.pins.length > 0) || (item.points && item.points.length > 0)) && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>ROUTE MAP</span>
                  <div style={{ width: "100%", height: 180, borderRadius: 10, overflow: "hidden", position: "relative", background: T.charcoal }}>
                    <RouteMapPreview pins={item.pins} points={item.points} photos={item.photos} />
                  </div>
                </div>
              )}
              {/* Description */}
              {item.body && (
                <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 12px", lineHeight: 1.5 }}>{item.body}</p>
              )}
              {/* Elevation */}
              {item.elevation && item.elevation !== "—" && (
                <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
                  <div>
                    <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>ELEVATION</span>
                    <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600 }}>{item.elevation}</span>
                  </div>
                </div>
              )}
              {/* Location */}
              {item.location && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                  <MapPin size={13} color={T.copper} />
                  <span style={{ fontFamily: serif, fontSize: 13, color: T.warmStone || T.tertiary }}>{item.location}</span>
                </div>
              )}
              {/* Terrain tags */}
              {item.terrains && item.terrains.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>TERRAIN</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {item.terrains.map((t, ti) => (
                      <span key={ti} style={{ fontFamily: sans, fontSize: 10, color: T.copper, background: `${T.copper}18`, padding: "4px 10px", borderRadius: 12, letterSpacing: 0.5 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Tags */}
              {item.tags && item.tags.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>TAGS</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {item.tags.map((t, ti) => (
                      <span key={ti} style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, background: T.charcoal, padding: "4px 10px", borderRadius: 12, letterSpacing: 0.5 }}>{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {/* Photos */}
              {item.photos && item.photos.length > 0 && (
                <div style={{ marginBottom: 12 }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>PHOTOS</span>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {item.photos.map((p, pi) => (
                      <img key={pi} src={p.url || p} alt="" onClick={() => openCarousel(item.photos.map(ph => ph.url || ph), pi)} style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", flexShrink: 0, cursor: "pointer" }} />
                    ))}
                  </div>
                </div>
              )}
              {/* Route action buttons */}
              {(() => {
                const rPins = item.pins || [];
                const startPin = rPins.length > 0 ? rPins[0] : null;
                const endPin = rPins.length > 1 ? rPins[rPins.length - 1] : null;
                const isSaved = savedRoutes && savedRoutes.some(sr => sr.id === item.id || sr.name === item.title);
                const showMenu = routeShareMenu === item.id;
                return (
                  <div style={{ position: "relative" }}>
                    <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                      <button onClick={(e) => { e.stopPropagation(); if (startPin) { window.open(`https://www.google.com/maps/dir/?api=1&destination=${startPin.lat},${startPin.lng}&travelmode=driving`, "_blank"); } }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.green, border: "none", cursor: startPin ? "pointer" : "default", opacity: startPin ? 1 : 0.4 }}>
                        <MapPin size={13} color={T.white} />
                        <span style={{ fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }}>DIRECTIONS</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); if (startPin && endPin && onStartNav) { onStartNav({ name: item.title, pins: rPins, points: item.points, distance: item.distance, duration: item.duration, time: item.duration, elevation: item.elevation }); } }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.copper, border: "none", cursor: startPin && endPin ? "pointer" : "default", opacity: startPin && endPin ? 1 : 0.4 }}>
                        <Navigation size={13} color={T.white} />
                        <span style={{ fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }}>START ROUTE</span>
                      </button>
                      <button onClick={(e) => { e.stopPropagation(); setRouteShareMenu(showMenu ? null : item.id); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.charcoal, border: `1px solid ${T.tertiary}30`, cursor: "pointer" }}>
                        <Share2 size={13} color={T.white} />
                        <span style={{ fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }}>SHARE / SAVE</span>
                      </button>
                    </div>
                    {/* Share/Save dropdown */}
                    {showMenu && (
                      <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 6, background: T.darkCard, border: `1px solid ${T.charcoal}`, borderRadius: 10, padding: "6px 0", minWidth: 180, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                        <button onClick={(e) => { e.stopPropagation(); onOpenDM && onOpenDM(null, null, { type: "route", title: item.title, distance: item.distance, duration: item.duration }); setRouteShareMenu(null); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }}>
                          <Send size={14} color={T.copper} />
                          <span style={{ fontFamily: sans, fontSize: 12, color: T.white }}>Send in DM</span>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); /* already on feed */ setRouteShareMenu(null); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }}>
                          <Share2 size={14} color={T.copper} />
                          <span style={{ fontFamily: sans, fontSize: 12, color: T.white }}>Share to Feed</span>
                        </button>
                        <div style={{ height: 1, background: T.charcoal, margin: "2px 10px" }} />
                        <button onClick={(e) => { e.stopPropagation(); if (isSaved) { onUnsaveRoute && onUnsaveRoute(item.id); } else { onSaveRoute && onSaveRoute({ id: item.id, name: item.title, desc: item.body || "", difficulty: item.difficulty || "Moderate", distance: item.distance, time: item.duration, elevation: item.elevation || "—", location: item.location || "", terrains: item.terrains || [], tags: item.tags || [], pins: item.pins || [], photos: item.photos || [], rating: null, reviews: 0, savedFrom: item.user, savedAt: Date.now() }); } setRouteShareMenu(null); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }}>
                          <Bookmark size={14} color={isSaved ? T.red : T.copper} fill={isSaved ? T.red : "none"} />
                          <span style={{ fontFamily: sans, fontSize: 12, color: isSaved ? T.red : T.white }}>{isSaved ? "Unsave Route" : "Save for Later"}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}
          {actionBar(item)}
        </div>
      );
    }

    if (item.type === "BUILDS") {
      const bd = item.buildData;
      const isExpanded = expandedBuildPost === item.id;
      const modRow = (label, mod) => {
        if (!mod || !mod.value) return null;
        return (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "8px 0", borderBottom: `1px solid ${T.charcoal}20` }}>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary, flexShrink: 0, minWidth: 70 }}>{label}</span>
            <div style={{ flex: 1, textAlign: "right" }}>
              <span style={{ fontFamily: serif, fontSize: 12, color: T.white }}>{mod.value}</span>
              {mod.photo && mod.photo.length > 0 && (
                <img src={mod.photo[0].url} alt="" onClick={() => { const imgs = bd ? collectBuildImages(bd) : [mod.photo[0].url]; openCarousel(imgs, 0); }} style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover", marginLeft: 8, verticalAlign: "middle", cursor: "pointer" }} />
              )}
              {mod.link && (
                <div style={{ marginTop: 3 }}>
                  <a href={ensureUrl(mod.link)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><ExternalLink size={9} /> View Product</a>
                </div>
              )}
            </div>
          </div>
        );
      };
      return (
        <div key={item.id} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }}>{item.initial}</span>
            </div>
            <div>
              <span onClick={() => onViewUser && onViewUser(item.user.replace(/\s/g, "_"))} style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, cursor: "pointer" }}>{item.user}</span>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary, display: "block" }}>{item.subtitle}</span>
              {item.location && (
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary, display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <MapPin size={10} color={T.tertiary} />{item.location}
                </span>
              )}
            </div>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }}>{formatPostTime(item.time)}</span>
          </div>
          {/* Hero image or gradient placeholder */}
          <div style={{ position: "relative" }}>
            {item.photoUrls && item.photoUrls[0] ? (
              <div style={{ position: "relative" }}>
                <img src={item.photoUrls[0]} alt="" onClick={() => { const imgs = bd ? collectBuildImages(bd) : item.photoUrls; openCarousel(imgs, 0); }} style={{ width: "100%", height: 220, objectFit: "cover", display: "block", cursor: "pointer" }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 40%, rgba(0,0,0,0.8))", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: 12, left: 14, right: 14, pointerEvents: "none" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <Wrench size={12} color={T.copper} />
                    <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }}>NEW BUILD</span>
                  </div>
                  <h3 style={{ fontFamily: sans, fontSize: 20, color: T.white, margin: 0, fontWeight: 700, letterSpacing: 0.5 }}>{item.title}</h3>
                  {item.vehicle && <span style={{ fontFamily: serif, fontSize: 12, color: T.warmBg, opacity: 0.8 }}>{item.vehicle}</span>}
                </div>
              </div>
            ) : (
              <div onClick={() => setExpandedBuildPost(isExpanded ? null : item.id)} style={{ height: 180, background: `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}30 100%)`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }}>
                <Wrench size={40} color={T.tertiary} strokeWidth={0.5} style={{ opacity: 0.3 }} />
                <div style={{ position: "absolute", bottom: 12, left: 14 }}>
                  <h3 style={{ fontFamily: sans, fontSize: 20, color: T.white, margin: 0, fontWeight: 700 }}>{item.title}</h3>
                  {item.vehicle && <span style={{ fontFamily: serif, fontSize: 12, color: T.warmBg, opacity: 0.8 }}>{item.vehicle}</span>}
                </div>
              </div>
            )}
            {/* Expand indicator */}
            <div onClick={() => setExpandedBuildPost(isExpanded ? null : item.id)} style={{ position: "absolute", top: 10, right: 10, background: `${T.darkBg}CC`, padding: "5px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
              <ChevronDown size={12} color={T.warmBg} style={{ transform: isExpanded ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
              <span style={{ fontFamily: sans, fontSize: 9, color: T.warmBg, letterSpacing: 0.5 }}>{isExpanded ? "COLLAPSE" : "VIEW BUILD"}</span>
            </div>
          </div>
          {/* Summary line when collapsed */}
          {!isExpanded && (
            <div style={{ padding: "10px 16px" }}>
              <div style={{ background: T.charcoal, padding: "8px 12px", borderRadius: 6, display: "inline-block" }}>
                <span style={{ fontFamily: sans, fontSize: 12, color: T.white }}>{item.stage}</span>
              </div>
            </div>
          )}
          {/* Expanded build detail */}
          {isExpanded && bd && (
            <div style={{ padding: "12px 16px 4px" }}>
              {/* Vehicle info */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                <Wrench size={12} color={T.copper} />
                <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }}>BUILD SPECS</span>
              </div>
              {/* Mods list */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                {modRow("Suspension", bd.suspension)}
                {modRow("Tires", bd.tires)}
                {modRow("Wheels", bd.wheels)}
                {modRow("Bumpers", bd.bumpers)}
                {modRow("Armor", bd.armor)}
                {modRow("Lighting", bd.lighting)}
                {modRow("Rack/Storage", bd.rack)}
                {modRow("Winch", bd.winch)}
                {modRow("Other Mods", bd.otherMods)}
              </div>
              {/* Camper section */}
              {bd.hasCamper && (bd.camperMake || bd.camperModel) && (
                <>
                  <div style={{ height: 1, background: T.charcoal, margin: "12px 0" }} />
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <Home size={12} color={T.copper} />
                    <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }}>CAMPER</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>Setup</span>
                    <span style={{ fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }}>{bd.camperMake} {bd.camperModel}</span>
                  </div>
                  {bd.camperPhoto && bd.camperPhoto.length > 0 && (
                    <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                      {bd.camperPhoto.map((p, pi) => (
                        <img key={pi} src={p.url} alt="" onClick={() => { const imgs = collectBuildImages(bd); openCarousel(imgs, 0); }} style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover", cursor: "pointer" }} />
                      ))}
                    </div>
                  )}
                  {bd.camperLink && (
                    <div style={{ marginTop: 6 }}>
                      <a href={ensureUrl(bd.camperLink)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><ExternalLink size={9} /> View Product</a>
                    </div>
                  )}
                </>
              )}
              {/* Additional photos */}
              {bd.mainPhotos && bd.mainPhotos.length > 1 && (
                <>
                  <div style={{ height: 1, background: T.charcoal, margin: "12px 0" }} />
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, display: "block", marginBottom: 8 }}>MORE PHOTOS</span>
                  <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                    {bd.mainPhotos.slice(1).map((p, pi) => (
                      <img key={pi} src={p.url} alt="" onClick={() => openCarousel(collectBuildImages(bd), pi + 1)} style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", flexShrink: 0, cursor: "pointer" }} />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
          {isExpanded && !bd && (
            <div style={{ padding: "10px 16px" }}>
              <div style={{ background: T.charcoal, padding: "8px 12px", borderRadius: 6, display: "inline-block" }}>
                <span style={{ fontFamily: sans, fontSize: 12, color: T.white }}>{item.stage}</span>
              </div>
            </div>
          )}
          {actionBar(item)}
        </div>
      );
    }

    if (item.type === "CONVOYS") {
      return (
        <div key={item.id} style={cardStyle}>
          <div style={{ padding: 16, display: "flex", gap: 14 }}>
            <div style={{ width: 56, background: T.charcoal, borderRadius: 8, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "8px 0", flexShrink: 0 }}>
              <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>{item.month}</span>
              <span style={{ fontFamily: sans, fontSize: 28, color: T.white, fontWeight: 700 }}>{item.day}</span>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, background: `${T.copper}20`, padding: "3px 8px", borderRadius: 4, letterSpacing: 1, fontWeight: 600 }}>CONVOY GROUP</span>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{formatPostTime(item.time)}</span>
              </div>
              <p style={{ fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 6px" }}>{item.title}</p>
              <p style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, margin: "0 0 8px", lineHeight: 1.5 }}>{item.body}</p>
              <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 0.5 }}>DEPARTS {item.departs}</span>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 0.5 }}>{item.slots} SLOTS LEFT</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 8, fontWeight: 700, color: T.white }}>{item.initial}</span>
                </div>
                <span onClick={() => onViewUser && onViewUser(item.user.replace(/\s/g, "_"))} style={{ fontFamily: sans, fontSize: 11, color: T.white, cursor: "pointer" }}>{item.user}</span>
              </div>
            </div>
          </div>
          {actionBar(item)}
        </div>
      );
    }

    if (item.type === "PHOTOS") {
      return (
        <div key={item.id} style={cardStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px" }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }}>{item.initial}</span>
            </div>
            <div style={{ flex: 1 }}>
              <span onClick={() => onViewUser && onViewUser(item.user.replace(/\s/g, "_"))} style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, cursor: "pointer" }}>{item.user}</span>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary, display: "block" }}>Shared {item.photoCount} photos</span>
            </div>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{formatPostTime(item.time)}</span>
          </div>
          {item.photoUrls && item.photoUrls.length > 0 ? (
            <div style={{ position: "relative" }}>
              <img src={item.photoUrls[0]} alt="" onClick={() => openCarousel(item.photoUrls, 0)} style={{ width: "100%", height: 220, objectFit: "cover", display: "block", cursor: "pointer" }} />
              {item.photoCount > 1 && (
                <div style={{ position: "absolute", bottom: 10, right: 10, background: `${T.darkBg}CC`, padding: "4px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4 }}>
                  <Camera size={11} color={T.warmBg} />
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.warmBg }}>1 / {item.photoCount}</span>
                </div>
              )}
            </div>
          ) : (
            <div style={{ height: 220, background: `linear-gradient(135deg, ${T.charcoal} 0%, ${T.copper}15 100%)`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Camera size={48} color={T.tertiary} strokeWidth={0.5} style={{ opacity: 0.25 }} />
              <div style={{ position: "absolute", bottom: 10, right: 10, background: `${T.darkBg}CC`, padding: "4px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Camera size={11} color={T.warmBg} />
                <span style={{ fontFamily: sans, fontSize: 10, color: T.warmBg }}>1 / {item.photoCount}</span>
              </div>
            </div>
          )}
          <div style={{ padding: "12px 16px" }}>
            <p style={{ fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 6px", lineHeight: 1.5 }}>{item.title}</p>
            {item.location && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <MapPin size={11} color={T.tertiary} />
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{item.location}</span>
              </div>
            )}
          </div>
          {actionBar(item)}
        </div>
      );
    }

    if (item.type === "FORUM") {
      const snippet = item.body && item.body.length > 120 ? item.body.slice(0, 120) + "..." : item.body;
      return (
        <div key={item.id} onClick={() => onOpenThread && onOpenThread(item.threadId, item.forumCat, item.forumSub)} style={{ ...cardStyle, cursor: "pointer" }}>
          <div style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 8, borderBottom: `1px solid ${T.charcoal}` }}>
            <MessageCircle size={14} color={T.copper} />
            <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 1, fontWeight: 600 }}>FORUM THREAD</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: 4 }}>{item.forumCat} &gt; {item.forumSub}</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }}>{formatPostTime(item.time)}</span>
          </div>
          <div style={{ padding: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }}>{item.initial}</span>
              </div>
              <span onClick={(e) => { e.stopPropagation(); onViewUser && onViewUser(item.user.replace(/\s/g, "_")); }} style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, cursor: "pointer" }}>{item.user}</span>
            </div>
            <h3 style={{ fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 6px", lineHeight: 1.3 }}>{item.title}</h3>
            {snippet && <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 12px", lineHeight: 1.5 }}>{snippet}</p>}
            {item.image && (
              <div style={{ marginBottom: 12, borderRadius: 8, overflow: "hidden" }}>
                <img src={item.image} alt="" style={{ width: "100%", maxHeight: 200, objectFit: "cover", display: "block" }} />
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><Eye size={14} color={T.tertiary} strokeWidth={1.5} /><span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{(() => { const base = typeof item.views === "string" ? parseFloat(item.views.replace(/[^0-9.]/g, "")) * (item.views.includes("K") ? 1000 : 1) : (item.views || 0); const extra = (forumViewCounts || {})[item.threadId] || 0; const total = Math.round(base + extra); return total >= 1000 ? (total / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(total); })()} views</span></div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}><MessageCircle size={14} color={T.tertiary} strokeWidth={1.5} /><span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{(item.replies || 0) + ((forumUserReplies || {})[item.threadId] || []).length} replies</span></div>
            </div>
          </div>
          {actionBar(item, <span onClick={(e) => { e.stopPropagation(); onOpenThread && onOpenThread(item.threadId, item.forumCat, item.forumSub); }} style={{ fontFamily: sans, fontSize: 10, color: T.red, fontWeight: 600, cursor: "pointer", padding: "8px 12px" }}>VIEW THREAD &gt;</span>)}
        </div>
      );
    }

    return null;
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Image Carousel */}
      {carouselImages && (
        <ImageCarousel images={carouselImages} startIndex={carouselIndex} onClose={() => setCarouselImages(null)} />
      )}
      {/* Link copied toast */}
      {copiedToast && (
        <div style={{ position: "fixed", top: 80, left: "50%", transform: "translateX(-50%)", background: T.charcoal, border: `1px solid ${T.copper}`, borderRadius: 24, padding: "10px 20px", display: "flex", alignItems: "center", gap: 8, zIndex: 999, boxShadow: `0 8px 30px rgba(0,0,0,0.5)`, animation: "fadeInUp 0.25s ease-out" }}>
          <CheckCircle size={16} color={T.green} />
          <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600 }}>Link copied to clipboard</span>
        </div>
      )}
      {/* Filter Pills */}
      <div className="th-hscroll" style={{ display: "flex", gap: 8, padding: "12px 16px", overflowX: "auto", background: T.charcoal }}>
        {filters.map((f) => (
          <button key={f} onClick={() => setActiveFilter(f)} style={pill(activeFilter === f)}>{f}</button>
        ))}
      </div>

      <div style={{ padding: "12px 16px 16px", display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "40px 0", textAlign: "center" }}>
            <Compass size={36} color={T.tertiary} strokeWidth={0.8} style={{ opacity: 0.3, marginBottom: 10 }} />
            <p style={{ fontFamily: sans, fontSize: 14, color: T.tertiary, margin: 0 }}>No {activeFilter.toLowerCase()} posts yet</p>
          </div>
        ) : filtered.map(renderCard)}
      </div>
    </div>
  );
}

/* ─── FORUM SCREEN ─── */
/* ─── Forum Data ─── */
const forumData = {
  categories: [
    { name: "How-To Guides", color: T.copper, icon: "wrench", subs: [
      { name: "Suspension & Lift", threads: 86 },
      { name: "Electrical & Wiring", threads: 64 },
      { name: "Armor & Protection", threads: 52 },
      { name: "Camper Installs", threads: 41 },
      { name: "Recovery Techniques", threads: 38 },
      { name: "Maintenance & Repair", threads: 61 },
    ]},
    { name: "Troubleshooting", color: T.red, icon: "alert", subs: [
      { name: "Engine & Drivetrain", threads: 74 },
      { name: "Electrical Issues", threads: 48 },
      { name: "Suspension & Steering", threads: 39 },
      { name: "Body & Frame", threads: 28 },
      { name: "Accessories & Mods", threads: 29 },
    ]},
    { name: "Inspiration", color: T.green, icon: "mountain", subs: [
      { name: "Trip Reports", threads: 198 },
      { name: "Build Showcases", threads: 142 },
      { name: "Photography", threads: 127 },
      { name: "Bucket List Routes", threads: 100 },
    ]},
    { name: "Trip Coordination", color: T.copper, icon: "users", subs: [
      { name: "Convoy Planning", threads: 24 },
      { name: "Meetups & Events", threads: 31 },
      { name: "Trail Partners Wanted", threads: 34 },
    ]},
    { name: "Regional Groups", color: T.tertiary, icon: "map", subs: [
      { name: "Pacific Northwest", threads: 42 },
      { name: "Southwest & Desert", threads: 38 },
      { name: "Rockies & High Plains", threads: 29 },
      { name: "Southeast & Appalachia", threads: 21 },
      { name: "Midwest", threads: 14 },
      { name: "International", threads: 12 },
    ]},
    { name: "Marketplace", color: T.red, icon: "tag", subs: [
      { name: "Parts For Sale", threads: 186 },
      { name: "Vehicles For Sale", threads: 89 },
      { name: "Wanted / ISO", threads: 78 },
      { name: "Group Buys", threads: 42 },
      { name: "Free / Trade", threads: 28 },
    ]},
  ],
  threads: {
    "Suspension & Lift": [
      { id: 1, title: "Best budget lift kit for 3rd Gen Tacoma?", replies: 47, views: "2.1K", author: "TrailBoss_88", initial: "T", time: "2h ago", pinned: true,
        body: "Looking at Icon, Bilstein, or OME for my 2020 Tacoma. Budget is around $1,500. Primarily doing fire roads and moderate trails in the PNW. What would you all recommend?",
        posts: [
          { author: "SuspensionGuru", initial: "S", time: "1h ago", body: "Icon Stage 2 is hard to beat at that price. I ran it on my 3rd gen for 2 years before upgrading to King coilovers. Great ride quality on and off road.", likes: 24 },
          { author: "KyleLPO", initial: "K", time: "45m ago", body: "I went Icon Stage 3 on my Tundra and it's been bulletproof. For a Tacoma at $1,500, the Icon Stage 2 or Bilstein 5100s are your best bet. Bilstein if you want set-and-forget, Icon if you want adjustability.", likes: 31 },
          { author: "DirtRoadDave", initial: "D", time: "30m ago", body: "OME is solid but rides a bit stiff when unloaded. If you're not carrying a lot of weight, go Bilstein 5100 and save the extra for tires.", likes: 12 },
        ]},
      { id: 2, title: "2\" vs 3\" lift — real-world pros and cons", replies: 89, views: "5.8K", author: "LiftKing", initial: "L", time: "6h ago", pinned: false,
        body: "I keep going back and forth. Running 33s now, want to fit 35s. Is 3\" worth the extra cost and potential CV angle issues?",
        posts: [
          { author: "AxleWise", initial: "A", time: "5h ago", body: "3\" is the sweet spot for 35s but you'll want to address the CV angles. Budget for diff drop or SPC UCAs at minimum.", likes: 18 },
        ]},
      { id: 3, title: "Icon Stage 3 long-term review — 40K miles", replies: 34, views: "3.2K", author: "KyleLPO", initial: "K", time: "1d ago", pinned: false,
        body: "Just hit 40K on my Icon Stage 3 setup. Here's everything I've learned about maintenance, revalving, and what to expect long-term.",
        posts: [] },
      { id: 4, title: "Fox 2.5 Factory Race Series install tips", replies: 56, views: "4.1K", author: "FoxFanatic", initial: "F", time: "2d ago", pinned: false,
        body: "Just finished installing Fox 2.5 Factory Race on my 4Runner. Sharing some tips that would have saved me hours.",
        posts: [] },
    ],
    "Electrical & Wiring": [
      { id: 5, title: "How to properly wire auxiliary batteries for dual setups", replies: 124, views: "8.4K", author: "VoltWrangler", initial: "V", time: "6h ago", pinned: true,
        body: "Complete guide to dual battery setups — isolators, wiring gauges, fusing, and what NOT to do. Learned some hard lessons.",
        posts: [
          { author: "WattMaster", initial: "W", time: "4h ago", body: "This is the guide I wish I had 2 years ago. One thing to add — always fuse both sides of your isolator, not just the main feed.", likes: 42 },
        ]},
      { id: 6, title: "Solar panel setup for roof-top tent camping", replies: 67, views: "4.9K", author: "SolarTrail", initial: "S", time: "1d ago", pinned: false,
        body: "Running a 200W panel with Victron MPPT into a 100Ah lithium. Here's my complete setup and wiring diagram.", posts: [] },
    ],
    "Convoy Planning": [
      { id: 7, title: "Planning a Baja convoy — Feb 2027", replies: 31, views: "890", author: "BajaBound", initial: "B", time: "1d ago", pinned: true,
        body: "Looking for 6-8 rigs for a 2-week Baja trip. Starting in San Diego, heading down to Cabo via the pacific coast. Experience level: intermediate+",
        posts: [
          { author: "DesertRat_4x4", initial: "D", time: "18h ago", body: "I'm in! Running a Bronco Sasquatch with full armor. Done the Baja loop twice before. What's the planned route?", likes: 8 },
          { author: "BajaVet", initial: "B", time: "12h ago", body: "Count me in. I'd recommend hitting Mike's Sky Rancho on the way down. Best tacos you'll ever have.", likes: 15 },
        ]},
    ],
    "Parts For Sale": [
      { id: 8, title: "Selling: ARB bumper for 200 Series LC — $800", replies: 12, views: "340", author: "GearDump", initial: "G", time: "5h ago", pinned: false,
        body: "ARB Deluxe front bumper for 200 Series Land Cruiser. Excellent condition, includes fog light mounts. Pickup in Denver or ship at buyer's expense.",
        posts: [] },
      { id: 9, title: "CBI rear bumper + swing-out for Tundra — $1,200", replies: 8, views: "210", author: "KyleLPO", initial: "K", time: "2d ago", pinned: false,
        body: "Upgraded to a custom setup. CBI T-bar rear with dual swing-outs. Fits 2014-2021 Tundra. Includes jerry can mount and tire carrier.", posts: [] },
    ],
    "Trip Reports": [
      { id: 10, title: "Rubicon Trail in a stock 4Runner — full report", replies: 98, views: "7.2K", author: "StockHero", initial: "S", time: "3d ago", pinned: true,
        body: "They said it couldn't be done. It can, but I don't recommend it. Here's my full trip report with photos, damage assessment, and lessons learned.",
        posts: [
          { author: "RubiVet", initial: "R", time: "2d ago", body: "Impressive that you made it through! The Sluice alone would have me sweating in a stock rig. How'd you handle the approach angle on the big rocks?", likes: 22 },
        ]},
    ],
  },
};

// Fill in empty thread lists for subcategories without custom data
forumData.categories.forEach(cat => {
  cat.subs.forEach(sub => {
    if (!forumData.threads[sub.name]) {
      forumData.threads[sub.name] = [
        { id: Math.random(), title: `Welcome to ${sub.name}`, replies: 3, views: "120", author: "Admin", initial: "A", time: "1w ago", pinned: true, body: `This is the ${sub.name} subcategory under ${cat.name}. Start a thread to share your knowledge!`, posts: [] },
      ];
    }
  });
});

function ForumScreen({ pendingThread, onPendingHandled, onAddNotification, onOpenDM, onAddFeedPost, userThreads, setUserThreads, userReplies, setUserReplies, likedForumItems, setLikedForumItems, forumLikeCounts, setForumLikeCounts, forumViewCounts, setForumViewCounts }) {
  const [view, setView] = useState("categories"); // "categories" | "subcategories" | "threads" | "thread" | "newThread"
  const [selectedCat, setSelectedCat] = useState(null);
  const [selectedSub, setSelectedSub] = useState(null);
  const [selectedThread, setSelectedThread] = useState(null);
  const [forumReplyText, setForumReplyText] = useState("");
  const [replyPhotos, setReplyPhotos] = useState([]);
  const replyFileRef = React.useRef(null);
  const handleReplyPhoto = (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => setReplyPhotos(prev => [...prev, { url: ev.target.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  };
  // userThreads, userReplies, likedForumItems, forumLikeCounts are now lifted to main app as props
  const [replyToReply, setReplyToReply] = useState(null); // { author, idx } for replying to a specific reply
  const [forumShareMenu, setForumShareMenu] = useState(null); // "thread_id" or "reply_threadId_idx"

  // Live reply count: seed posts + user replies
  const getReplyCount = (thread) => {
    const seedCount = (thread.posts || []).length + (thread.replies || 0);
    const userCount = (userReplies[thread.id] || []).length;
    return seedCount + userCount;
  };

  // Live view count: base views + tracked views
  const getViewCount = (thread) => {
    const base = typeof thread.views === "string" ? parseFloat(thread.views.replace(/[^0-9.]/g, "")) * (thread.views.includes("K") ? 1000 : 1) : (thread.views || 0);
    const extra = forumViewCounts[thread.id] || 0;
    const total = Math.round(base + extra);
    return total >= 1000 ? (total / 1000).toFixed(1).replace(/\.0$/, "") + "K" : String(total);
  };

  // Increment view count when opening a thread
  const trackView = (threadId) => {
    setForumViewCounts(prev => ({ ...prev, [threadId]: (prev[threadId] || 0) + 1 }));
  };

  // Deep-link: open a specific thread when navigated from feed
  useEffect(() => {
    if (!pendingThread) return;
    const { threadId, catName, subName } = pendingThread;
    for (const cat of forumData.categories) {
      if (cat.name !== catName) continue;
      for (const sub of cat.subs) {
        if (sub.name !== subName) continue;
        // Search both static threads and user-created threads
        const allThreads = [...(forumData.threads[sub.name] || []), ...(userThreads[sub.name] || [])];
        const thread = allThreads.find(t => t.id === threadId);
        if (thread) {
          setSelectedCat(cat);
          setSelectedSub(sub);
          setSelectedThread(thread);
          setView("thread");
          trackView(thread.id);
          onPendingHandled && onPendingHandled();
          return;
        }
      }
    }
    onPendingHandled && onPendingHandled();
  }, [pendingThread]);
  // Edit thread state
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const editBodyRef = useRef(null);
  const [editPhotos, setEditPhotos] = useState([]);
  const [editActiveFormats, setEditActiveFormats] = useState({});
  const editSavedRange = useRef(null);
  const editInitialized = useRef(null);
  const [editLinkInput, setEditLinkInput] = useState(false);
  const [editLinkUrl, setEditLinkUrl] = useState("");
  const updateEditFormats = () => {
    const fb = (document.queryCommandValue("formatBlock") || "").toLowerCase();
    setEditActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      h1: fb === "h1", h2: fb === "h2", h3: fb === "h3",
      p: fb === "p" || fb === "" || fb === "div",
    });
  };
  // New thread form state
  const [ntTitle, setNtTitle] = useState("");
  const [ntBody, setNtBody] = useState(""); // stores HTML
  const ntBodyRef = useRef(null);
  const [ntLinkInput, setNtLinkInput] = useState(false);
  const [ntLinkUrl, setNtLinkUrl] = useState("");
  const ntSavedRange = useRef(null);
  const [ntActiveFormats, setNtActiveFormats] = useState({}); // { bold: true, italic: true, ... }
  const updateActiveFormats = () => {
    const fb = (document.queryCommandValue("formatBlock") || "").toLowerCase();
    setNtActiveFormats({
      bold: document.queryCommandState("bold"),
      italic: document.queryCommandState("italic"),
      underline: document.queryCommandState("underline"),
      strikeThrough: document.queryCommandState("strikeThrough"),
      insertUnorderedList: document.queryCommandState("insertUnorderedList"),
      insertOrderedList: document.queryCommandState("insertOrderedList"),
      h1: fb === "h1",
      h2: fb === "h2",
      h3: fb === "h3",
      p: fb === "p" || fb === "" || fb === "div",
    });
  };
  const [ntShareToFeed, setNtShareToFeed] = useState(true);
  const [ntPhotos, setNtPhotos] = useState([]);
  const [ntPickCat, setNtPickCat] = useState(null); // for category picker in new thread from home
  const [ntPickSub, setNtPickSub] = useState(null);
  const [ntFromHome, setNtFromHome] = useState(false); // true if new thread opened from categories page
  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const searchInputRef = useRef(null);

  const allThreadsFlat = (() => {
    const results = [];
    forumData.categories.forEach(cat => {
      cat.subs.forEach(sub => {
        (forumData.threads[sub.name] || []).forEach(t => {
          results.push({ ...t, catName: cat.name, subName: sub.name, cat, sub });
        });
      });
    });
    return results;
  })();

  const searchResults = searchQuery.trim().length > 0 ? (() => {
    const q = searchQuery.trim().toLowerCase();
    return allThreadsFlat.filter(t => {
      if (t.title.toLowerCase().includes(q)) return true;
      if (t.body && t.body.toLowerCase().includes(q)) return true;
      if (t.author.toLowerCase().includes(q)) return true;
      if (t.posts && t.posts.some(p => p.author.toLowerCase().includes(q) || p.body.toLowerCase().includes(q))) return true;
      return false;
    });
  })() : [];

  const openCategory = (cat) => { setSelectedCat(cat); setView("subcategories"); };
  const openSubcategory = (sub) => { setSelectedSub(sub); setView("threads"); };
  const openThread = (thread) => { setSelectedThread(thread); setView("thread"); trackView(thread.id); };

  const openNewThreadFromHome = () => {
    setNtFromHome(true);
    setNtPickCat(null);
    setNtPickSub(null);
    setNtTitle("");
    setNtBody("");
    setNtPhotos([]);
    setNtShareToFeed(true);
    setView("newThread");
  };

  const openNewThreadFromSub = () => {
    setNtFromHome(false);
    setNtPickCat(selectedCat);
    setNtPickSub(selectedSub);
    setNtTitle("");
    setNtBody("");
    setNtPhotos([]);
    setNtShareToFeed(true);
    setView("newThread");
  };

  const goBack = () => {
    if (view === "newThread") setView(ntFromHome ? "categories" : "threads");
    else if (view === "thread") setView("threads");
    else if (view === "threads") setView("subcategories");
    else if (view === "subcategories") setView("categories");
  };

  // ─── New Thread Form ───
  if (view === "newThread" && (selectedSub || ntFromHome)) {
    const activeCat = ntFromHome ? ntPickCat : selectedCat;
    const activeSub = ntFromHome ? ntPickSub : selectedSub;
    const submitThread = () => {
      if (!ntTitle.trim()) return;
      if (ntFromHome && (!ntPickCat || !ntPickSub)) return;
      const subName = (activeSub || {}).name;
      const newThread = {
        id: Date.now(),
        title: ntTitle.trim(),
        body: (() => { const html = ntBodyRef.current ? ntBodyRef.current.innerHTML : ntBody; console.log("[TRAILHEAD DEBUG] Submitting body HTML:", html); return (html && html.replace(/<[^>]+>/g, "").trim()) ? html : null; })(),
        replies: 0,
        views: "0",
        author: "KyleLPO",
        initial: "K",
        time: Date.now(),
        pinned: false,
        posts: [],
        ...(ntPhotos.length > 0 ? { photos: ntPhotos.map(p => p.url) } : {}),
      };
      setUserThreads(prev => ({
        ...prev,
        [subName]: [newThread, ...(prev[subName] || [])],
      }));
      // Auto-share to feed if toggle is on
      if (ntShareToFeed && onAddFeedPost) {
        const catName = (activeCat || ntPickCat || {}).name || "";
        onAddFeedPost({
          id: Date.now() + 1,
          type: "FORUM",
          user: "KyleLPO",
          initial: "K",
          title: newThread.title,
          body: null,
          ...(newThread.photos && newThread.photos.length > 0 ? { image: newThread.photos[0] } : {}),
          time: Date.now(),
          likes: 0,
          comments: 0,
          replies: 0,
          views: "0",
          threadId: newThread.id,
          forumCat: catName,
          forumSub: subName,
        });
      }
      // Send mention notifications
      const plainBody = ntBody.replace(/<[^>]+>/g, " ");
      const mentions = extractMentions(ntTitle + " " + plainBody);
      mentions.forEach(handle => {
        if (handle !== "KyleLPO") {
          onAddNotification && onAddNotification({ type: "mention", user: "KyleLPO", text: "mentioned you in a forum thread", target: ntTitle.trim(), icon: AtSign, iconColor: T.copper });
        }
      });
      setNtTitle("");
      setNtBody("");
      if (ntBodyRef.current) ntBodyRef.current.innerHTML = "";
      setNtPhotos([]);
      setNtShareToFeed(true);
      if (ntFromHome) {
        setSelectedCat(activeCat);
        setSelectedSub(activeSub);
        setView("threads");
      } else {
        setView("threads");
      }
    };
    const canPost = ntTitle.trim() && (!ntFromHome || (ntPickCat && ntPickSub));
    return (
      <div style={{ padding: "0 0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
          <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ChevronLeft size={20} color={T.white} strokeWidth={1.5} />
          </button>
          <div>
            <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 700, display: "block" }}>New Thread</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{activeSub ? activeSub.name : "Select a category"}</span>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          {/* Category / Subcategory pickers when from home */}
          {ntFromHome && (
            <>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>CATEGORY *</span>
                <select value={ntPickCat ? ntPickCat.name : ""} onChange={e => {
                  const cat = forumData.categories.find(c => c.name === e.target.value);
                  setNtPickCat(cat || null);
                  setNtPickSub(null);
                }} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: sans, fontSize: 13, outline: "none", boxSizing: "border-box", appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238B7D6B' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
                  <option value="" disabled style={{ color: T.tertiary }}>Select category...</option>
                  {forumData.categories.map(cat => (
                    <option key={cat.name} value={cat.name} style={{ background: T.darkCard, color: T.white }}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>SUBCATEGORY *</span>
                <select value={ntPickSub ? ntPickSub.name : ""} onChange={e => {
                  const sub = ntPickCat ? ntPickCat.subs.find(s => s.name === e.target.value) : null;
                  setNtPickSub(sub || null);
                }} disabled={!ntPickCat} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: ntPickCat ? T.white : T.tertiary, fontFamily: sans, fontSize: 13, outline: "none", boxSizing: "border-box", opacity: ntPickCat ? 1 : 0.5, appearance: "none", WebkitAppearance: "none", backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%238B7D6B' viewBox='0 0 16 16'%3E%3Cpath d='M8 11L3 6h10z'/%3E%3C/svg%3E")`, backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center" }}>
                  <option value="" disabled style={{ color: T.tertiary }}>Select subcategory...</option>
                  {ntPickCat && ntPickCat.subs.map(sub => (
                    <option key={sub.name} value={sub.name} style={{ background: T.darkCard, color: T.white }}>{sub.name}</option>
                  ))}
                </select>
              </div>
            </>
          )}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>TITLE *</span>
            <input value={ntTitle} onChange={e => setNtTitle(e.target.value)} placeholder="Thread title..." style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>BODY</span>
            {/* Rich text toolbar */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 8px", background: T.charcoal, borderRadius: "8px 8px 0 0", border: `1px solid ${T.charcoal}`, borderBottom: "none" }}>
              {[
                { cmd: "bold", label: "B", style: { fontWeight: 700 } },
                { cmd: "italic", label: "I", style: { fontStyle: "italic" } },
                { cmd: "underline", label: "U", style: { textDecoration: "underline" } },
                { cmd: "strikeThrough", label: "S", style: { textDecoration: "line-through" } },
              ].map(btn => {
                const isActive = ntActiveFormats[btn.cmd];
                return (
                <button key={btn.cmd} onMouseDown={(e) => { e.preventDefault(); document.execCommand(btn.cmd, false, null); ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML); setTimeout(updateActiveFormats, 0); }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${T.copper}30` : "none", border: isActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", ...btn.style, color: isActive ? T.copper : T.white, fontFamily: serif, fontSize: 13, transition: "all 0.15s" }}>
                  {btn.label}
                </button>
                );
              })}
              <div style={{ width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" }} />
              {[
                { cmd: "formatBlock", arg: "<h1>", label: "H1", key: "h1" },
                { cmd: "formatBlock", arg: "<h2>", label: "H2", key: "h2" },
                { cmd: "formatBlock", arg: "<h3>", label: "H3", key: "h3" },
                { cmd: "formatBlock", arg: "<p>", label: "P", key: "p" },
              ].map(btn => {
                const isActive = ntActiveFormats[btn.key];
                return (
                <button key={btn.label} onMouseDown={(e) => { e.preventDefault(); document.execCommand(btn.cmd, false, btn.arg); ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML); setTimeout(updateActiveFormats, 0); }} style={{ minWidth: 28, height: 28, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${T.copper}30` : "none", border: isActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: isActive ? T.copper : T.white, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, transition: "all 0.15s" }}>
                  {btn.label}
                </button>
                );
              })}
              <div style={{ width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" }} />
              {(() => { const ulActive = ntActiveFormats.insertUnorderedList; return (
              <button onMouseDown={(e) => { e.preventDefault(); document.execCommand("insertUnorderedList", false, null); ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML); setTimeout(updateActiveFormats, 0); }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: ulActive ? `${T.copper}30` : "none", border: ulActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: ulActive ? T.copper : T.white, fontFamily: sans, fontSize: 11, transition: "all 0.15s" }} title="Bullet list">
                •≡
              </button>
              ); })()}
              {(() => { const olActive = ntActiveFormats.insertOrderedList; return (
              <button onMouseDown={(e) => { e.preventDefault(); document.execCommand("insertOrderedList", false, null); ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML); setTimeout(updateActiveFormats, 0); }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: olActive ? `${T.copper}30` : "none", border: olActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: olActive ? T.copper : T.white, fontFamily: sans, fontSize: 11, transition: "all 0.15s" }} title="Numbered list">
                1.
              </button>
              ); })()}
              {(() => {
                // Detect if selection is highlighted by checking backColor
                const sel = window.getSelection && window.getSelection();
                let isHighlighted = false;
                if (sel && sel.rangeCount > 0 && sel.anchorNode) {
                  let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
                  while (node && node !== ntBodyRef.current) {
                    const bg = node.style && node.style.backgroundColor;
                    if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "") { isHighlighted = true; break; }
                    node = node.parentElement;
                  }
                }
                return (
                <button onMouseDown={(e) => {
                  e.preventDefault();
                  if (isHighlighted) {
                    document.execCommand("hiliteColor", false, "transparent");
                  } else {
                    document.execCommand("hiliteColor", false, "#C49A6C40");
                  }
                  ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: isHighlighted ? `${T.copper}60` : `${T.copper}20`, border: isHighlighted ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 10, fontWeight: 700, transition: "all 0.15s" }} title={isHighlighted ? "Remove highlight" : "Highlight"}>
                  Hi
                </button>
                );
              })()}
              <button onMouseDown={(e) => {
                e.preventDefault();
                const selection = window.getSelection();
                if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
                ntSavedRange.current = selection.getRangeAt(0).cloneRange();
                setNtLinkInput(true);
                setNtLinkUrl("");
              }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: ntLinkInput ? `${T.copper}30` : "none", border: ntLinkInput ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 11, textDecoration: "underline", transition: "all 0.15s" }} title="Insert link">
                🔗
              </button>
              <div style={{ width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" }} />
              <button onMouseDown={(e) => {
                e.preventDefault();
                // Save cursor position before file dialog
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  ntSavedRange.current = selection.getRangeAt(0).cloneRange();
                }
                const fileInput = document.createElement("input");
                fileInput.type = "file";
                fileInput.accept = "image/*";
                fileInput.multiple = true;
                fileInput.onchange = (ev) => {
                  const files = Array.from(ev.target.files || []);
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (re) => {
                      if (ntBodyRef.current) {
                        ntBodyRef.current.focus();
                        // Restore cursor position
                        const sel = window.getSelection();
                        if (ntSavedRange.current) { sel.removeAllRanges(); sel.addRange(ntSavedRange.current); }
                        document.execCommand("insertHTML", false, `<div style="margin:8px 0"><img src="${re.target.result}" style="max-width:100%;border-radius:8px;display:block" /></div>`);
                        setNtBody(ntBodyRef.current.innerHTML);
                        // Move cursor after the inserted image
                        const newSel = window.getSelection();
                        if (newSel.rangeCount > 0) {
                          ntSavedRange.current = newSel.getRangeAt(0).cloneRange();
                        }
                      }
                    };
                    reader.readAsDataURL(file);
                  });
                };
                fileInput.click();
              }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 13, transition: "all 0.15s" }} title="Insert image">
                📷
              </button>
            </div>
            {/* Link URL input */}
            {ntLinkInput && (
              <div style={{ display: "flex", gap: 6, padding: "8px 10px", background: T.darkBg, border: `1px solid ${T.copper}`, borderBottom: "none" }}>
                <input autoFocus value={ntLinkUrl} onChange={e => setNtLinkUrl(e.target.value)} onKeyDown={e => {
                  if (e.key === "Enter" && ntLinkUrl.trim()) {
                    e.preventDefault();
                    const sel = window.getSelection();
                    if (ntSavedRange.current) { sel.removeAllRanges(); sel.addRange(ntSavedRange.current); }
                    document.execCommand("createLink", false, ntLinkUrl.trim().startsWith("http") ? ntLinkUrl.trim() : "https://" + ntLinkUrl.trim());
                    ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                    setNtLinkInput(false); setNtLinkUrl(""); ntSavedRange.current = null;
                  } else if (e.key === "Escape") { setNtLinkInput(false); setNtLinkUrl(""); ntSavedRange.current = null; }
                }} placeholder="Paste URL and press Enter..." style={{ flex: 1, padding: "6px 10px", borderRadius: 6, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: sans, fontSize: 12, outline: "none" }} />
                <button onClick={() => {
                  if (ntLinkUrl.trim()) {
                    const sel = window.getSelection();
                    if (ntSavedRange.current) { sel.removeAllRanges(); sel.addRange(ntSavedRange.current); }
                    document.execCommand("createLink", false, ntLinkUrl.trim().startsWith("http") ? ntLinkUrl.trim() : "https://" + ntLinkUrl.trim());
                    ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML);
                  }
                  setNtLinkInput(false); setNtLinkUrl(""); ntSavedRange.current = null;
                }} style={{ padding: "6px 12px", borderRadius: 6, background: T.copper, border: "none", cursor: "pointer" }}>
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600 }}>Add</span>
                </button>
                <button onClick={() => { setNtLinkInput(false); setNtLinkUrl(""); ntSavedRange.current = null; }} style={{ padding: "6px 8px", borderRadius: 6, background: "none", border: `1px solid ${T.tertiary}40`, cursor: "pointer" }}>
                  <X size={12} color={T.tertiary} />
                </button>
              </div>
            )}
            {/* Editable body */}
            <div
              ref={ntBodyRef}
              contentEditable
              onInput={() => { ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML); updateActiveFormats(); }}
              onKeyUp={updateActiveFormats}
              onMouseUp={updateActiveFormats}
              onSelect={updateActiveFormats}
              onFocus={updateActiveFormats}
              onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain"); document.execCommand("insertHTML", false, text); ntBodyRef.current && setNtBody(ntBodyRef.current.innerHTML); }}
              data-placeholder="Share your knowledge, ask a question, or start a discussion..."
              style={{ width: "100%", minHeight: 140, padding: "12px 14px", borderRadius: "0 0 8px 8px", background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box", lineHeight: 1.6, overflowY: "auto", maxHeight: 300, position: "relative" }}
            />
            <style>{`
              [contenteditable][data-placeholder]:empty::before {
                content: attr(data-placeholder);
                color: ${T.tertiary};
                opacity: 0.5;
                pointer-events: none;
              }
              [contenteditable] h1 { font-size: 26px !important; font-weight: 700; color: ${T.white}; margin: 10px 0 6px; font-family: ${sans}; line-height: 1.2; }
              [contenteditable] h2 { font-size: 21px !important; font-weight: 700; color: ${T.white}; margin: 8px 0 4px; font-family: ${sans}; line-height: 1.3; }
              [contenteditable] h3 { font-size: 17px !important; font-weight: 600; color: ${T.white}; margin: 6px 0 3px; font-family: ${sans}; line-height: 1.3; }
              [contenteditable] p { margin: 4px 0; font-size: 14px; }
              [contenteditable] ul { list-style-type: disc !important; padding-left: 24px !important; margin: 6px 0; }
              [contenteditable] ol { list-style-type: decimal !important; padding-left: 24px !important; margin: 6px 0; }
              [contenteditable] li { display: list-item !important; margin: 3px 0; list-style-position: outside !important; }
              [contenteditable] ul li { list-style-type: disc !important; }
              [contenteditable] ol li { list-style-type: decimal !important; }
              [contenteditable] a { color: ${T.copper}; text-decoration: underline; }
              [contenteditable] img { max-width: 100%; border-radius: 8px; display: block; margin: 8px 0; }
            `}</style>
          </div>

          {/* Hero image */}
          <div style={{ marginBottom: 16 }}>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>HERO IMAGE</span>
            <PhotoUploader photos={ntPhotos} onChange={setNtPhotos} />
          </div>

          {/* Share to feed toggle */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${T.charcoal}`, marginBottom: 16 }}>
            <div>
              <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>Share to Feed</span>
              <span style={{ fontFamily: serif, fontSize: 12, color: T.tertiary }}>Post a snippet with link to the community feed</span>
            </div>
            <button onClick={() => setNtShareToFeed(!ntShareToFeed)} style={{ width: 48, height: 28, borderRadius: 14, background: ntShareToFeed ? T.green : T.charcoal, border: `1px solid ${ntShareToFeed ? T.green : T.tertiary}40`, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: ntShareToFeed ? 23 : 2, transition: "left 0.2s" }} />
            </button>
          </div>

          {ntShareToFeed && (
            <div style={{ background: T.darkCard, borderRadius: 8, padding: "12px 14px", marginBottom: 16, border: `1px solid ${T.charcoal}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <MessageCircle size={12} color={T.copper} />
                <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 0.5, fontWeight: 600 }}>FEED PREVIEW</span>
              </div>
              <span style={{ fontFamily: serif, fontSize: 13, color: T.white, fontWeight: 600, display: "block", marginBottom: 4 }}>{ntTitle || "Thread title..."}</span>
              {ntPhotos.length > 0 && (
                <img src={ntPhotos[0].url} alt="" style={{ width: "100%", height: 100, objectFit: "cover", borderRadius: 6, marginBottom: 6 }} />
              )}
              <div style={{ marginTop: 4 }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.red }}>VIEW THREAD &gt;</span>
              </div>
            </div>
          )}

          <button onClick={submitThread} disabled={!canPost} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 8, background: canPost ? T.red : T.charcoal, border: "none", cursor: canPost ? "pointer" : "default", opacity: canPost ? 1 : 0.5 }}>
            <Plus size={16} color={T.white} />
            <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>POST THREAD</span>
          </button>
        </div>
      </div>
    );
  }

  // ─── Thread Detail View ───
  if (view === "thread" && selectedThread) {
    const threadLikeKey = "thread_" + selectedThread.id;
    const allPosts = [...(selectedThread.posts || []), ...(userReplies[selectedThread.id] || [])];

    const toggleForumLike = (key, baseLikes) => {
      const wasLiked = likedForumItems[key];
      setLikedForumItems(prev => ({ ...prev, [key]: !wasLiked }));
      setForumLikeCounts(prev => ({ ...prev, [key]: (prev[key] !== undefined ? prev[key] : baseLikes) + (wasLiked ? -1 : 1) }));
    };

    const getForumLikes = (key, baseLikes) => forumLikeCounts[key] !== undefined ? forumLikeCounts[key] : baseLikes;

    const shareToFeed = (title, body, author) => {
      const feedPost = {
        id: "forum_share_" + Date.now(),
        type: "FORUM",
        user: "KyleLPO",
        initial: "K",
        time: Date.now(),
        title: title,
        body: null,
        forumCat: selectedCat?.name || "",
        forumSub: selectedSub?.name || "",
        replies: 0,
        views: "0",
        threadId: selectedThread.id,
        ...(selectedThread.photos && selectedThread.photos.length > 0 ? { image: selectedThread.photos[0] } : {}),
        likes: 0,
        comments: 0,
      };
      onAddFeedPost && onAddFeedPost(feedPost);
    };

    const sendViaDM = (title, author) => {
      const sharedPost = { id: selectedThread.id, title, user: author, initial: author[0], type: "FORUM", threadId: selectedThread.id, forumCat: selectedCat?.name, forumSub: selectedSub?.name };
      onOpenDM && onOpenDM(null, "", sharedPost);
    };

    const submitReply = () => {
      if (!forumReplyText.trim() && replyPhotos.length === 0) return;
      const newReply = {
        author: "KyleLPO",
        initial: "K",
        body: (replyToReply ? `@${replyToReply.author} ` : "") + forumReplyText.trim(),
        time: Date.now(),
        likes: 0,
        ...(replyPhotos.length > 0 ? { photos: replyPhotos.map(p => p.url) } : {}),
        ...(replyToReply ? { replyTo: replyToReply.author, parentIdx: replyToReply.idx } : {}),
      };
      setUserReplies(prev => ({
        ...prev,
        [selectedThread.id]: [...(prev[selectedThread.id] || []), newReply],
      }));
      const mentions = extractMentions(forumReplyText);
      if (replyToReply && !mentions.includes(replyToReply.author)) mentions.push(replyToReply.author);
      mentions.forEach(handle => {
        if (handle !== "KyleLPO") {
          onAddNotification && onAddNotification({ type: "mention", user: "KyleLPO", text: "mentioned you in a forum reply", target: selectedThread.title, icon: AtSign, iconColor: T.copper });
        }
      });
      setForumReplyText("");
      setReplyPhotos([]);
      setReplyToReply(null);
    };

    const replyActionBar = (post, idx, rootParentIdx) => {
      const key = "reply_" + selectedThread.id + "_" + idx;
      const liked = likedForumItems[key];
      const likes = getForumLikes(key, post.likes || 0);
      const showShare = forumShareMenu === key;
      // When replying to a sub-reply, use the root parent so it nests under the same top-level reply
      const replyTargetIdx = typeof rootParentIdx === "number" ? rootParentIdx : idx;
      return (
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
          <button onClick={() => toggleForumLike(key, post.likes || 0)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px 4px 0" }}>
            <Heart size={12} color={liked ? T.red : T.tertiary} strokeWidth={1.5} fill={liked ? T.red : "none"} />
            {likes > 0 && <span style={{ fontFamily: sans, fontSize: 10, color: liked ? T.red : T.tertiary }}>{likes}</span>}
          </button>
          <button onClick={() => { setReplyToReply({ author: post.author, idx: replyTargetIdx }); }} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
            <MessageCircle size={12} color={T.tertiary} strokeWidth={1.5} />
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>Reply</span>
          </button>
          <div style={{ position: "relative" }}>
            <button onClick={() => setForumShareMenu(showShare ? null : key)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 6px" }}>
              <Share2 size={12} color={T.tertiary} strokeWidth={1.5} />
            </button>
            {showShare && (
              <div style={{ position: "absolute", bottom: "100%", right: 0, background: T.darkBg, border: `1px solid ${T.charcoal}`, borderRadius: 8, padding: 4, marginBottom: 4, zIndex: 200, minWidth: 140, boxShadow: "0 -4px 16px rgba(0,0,0,0.5)" }}>
                <button onClick={() => { shareToFeed(selectedThread.title, post.body, post.author); setForumShareMenu(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", border: "none", cursor: "pointer" }}>
                  <Share2 size={12} color={T.copper} />
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.white }}>Share to Feed</span>
                </button>
                <button onClick={() => { sendViaDM(post.body || selectedThread.title, post.author); setForumShareMenu(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", border: "none", cursor: "pointer" }}>
                  <Mail size={12} color={T.copper} />
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.white }}>Send via DM</span>
                </button>
              </div>
            )}
          </div>
        </div>
      );
    };

    const threadLiked = likedForumItems[threadLikeKey];
    const threadLikes = getForumLikes(threadLikeKey, selectedThread.likes || 0);
    const threadShareOpen = forumShareMenu === threadLikeKey;
    const isOwnThread = selectedThread.author === "KyleLPO";

    // Inline CSS for rich body rendering
    const thRbCSS = `<style>
.th-rb h1{display:block;font-size:26px;font-weight:700;color:#fff;margin:14px 0 8px;font-family:Trebuchet MS,Gill Sans,sans-serif;line-height:1.2}
.th-rb h2{display:block;font-size:21px;font-weight:700;color:#fff;margin:12px 0 6px;font-family:Trebuchet MS,Gill Sans,sans-serif;line-height:1.3}
.th-rb h3{display:block;font-size:17px;font-weight:600;color:#fff;margin:10px 0 4px;font-family:Trebuchet MS,Gill Sans,sans-serif;line-height:1.3}
.th-rb img{max-width:100%;border-radius:8px;display:block;margin:8px 0}
.th-rb p{display:block;margin:6px 0;font-size:14px}
.th-rb div{display:block;margin:4px 0}
.th-rb ul{display:block;list-style-type:disc;padding-left:24px;margin:8px 0}
.th-rb ol{display:block;list-style-type:decimal;padding-left:24px;margin:8px 0}
.th-rb li{display:list-item;margin:4px 0;list-style-position:outside}
.th-rb ul li{list-style-type:disc}
.th-rb ol li{list-style-type:decimal}
.th-rb a{color:#C49A6C;text-decoration:underline;cursor:pointer}
.th-rb b,.th-rb strong{font-weight:700;color:#fff}
.th-rb u{text-decoration:underline}
.th-rb strike,.th-rb s{text-decoration:line-through}
.th-rb span[style*="background"]{border-radius:2px;padding:0 2px}
</style>`;

    return (
      <div style={{ padding: "0 0 16px" }}>
        {/* Hero image + title header */}
        {selectedThread.photos && selectedThread.photos.length > 0 ? (
          <div style={{ position: "relative", width: "100%", height: 220 }}>
            <img src={selectedThread.photos[0]} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            {/* Gradient overlay */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "60%", background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.4) 50%, transparent 100%)" }} />
            {/* Back button */}
            <button onClick={goBack} style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex", backdropFilter: "blur(4px)" }}>
              <ChevronLeft size={20} color={T.white} strokeWidth={1.5} />
            </button>
            {/* Edit button for own threads */}
            {isOwnThread && (
              <button onClick={() => { setEditingThreadId(selectedThread.id); setEditTitle(selectedThread.title); setEditBody(selectedThread.body || ""); setEditPhotos(selectedThread.photos ? selectedThread.photos.map((u, i) => ({ url: u, id: i })) : []); }} style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.5)", border: "none", cursor: "pointer", padding: 6, borderRadius: "50%", display: "flex", backdropFilter: "blur(4px)" }}>
                <Edit3 size={16} color={T.white} strokeWidth={1.5} />
              </button>
            )}
            {/* Pinned badge */}
            {selectedThread.pinned && (
              <span style={{ position: "absolute", top: 14, left: 50, fontFamily: sans, fontSize: 9, color: T.copper, background: `rgba(0,0,0,0.6)`, padding: "3px 8px", borderRadius: 3, letterSpacing: 1, backdropFilter: "blur(4px)" }}>PINNED</span>
            )}
            {/* Title stacked at bottom left */}
            <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "0 16px 14px" }}>
              <h2 style={{ fontFamily: sans, fontSize: 20, color: T.white, fontWeight: 700, margin: 0, lineHeight: 1.25, textShadow: "0 1px 4px rgba(0,0,0,0.6)" }}>{selectedThread.title}</h2>
            </div>
          </div>
        ) : (
          <>
            {/* No hero image — plain header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  <ChevronLeft size={20} color={T.white} strokeWidth={1.5} />
                </button>
                <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary }}>{selectedSub?.name}</span>
              </div>
              {isOwnThread && (
                <button onClick={() => { setEditingThreadId(selectedThread.id); setEditTitle(selectedThread.title); setEditBody(selectedThread.body || ""); setEditPhotos(selectedThread.photos ? selectedThread.photos.map((u, i) => ({ url: u, id: i })) : []); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}>
                  <Edit3 size={16} color={T.tertiary} strokeWidth={1.5} />
                </button>
              )}
            </div>
            <div style={{ margin: "0 16px 4px", padding: "0 0 8px" }}>
              {selectedThread.pinned && (
                <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}20`, padding: "2px 6px", borderRadius: 3, letterSpacing: 1, marginBottom: 8, display: "inline-block" }}>PINNED</span>
              )}
              <h2 style={{ fontFamily: sans, fontSize: 20, color: T.white, fontWeight: 700, margin: 0, lineHeight: 1.25 }}>{selectedThread.title}</h2>
            </div>
          </>
        )}

        {/* Original post body + meta */}
        <div style={{ margin: "0 16px 12px", background: T.darkCard, borderRadius: 12, padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: T.copper }}>{selectedThread.initial}</span>
            </div>
            <div>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, display: "block" }}>@{selectedThread.author}</span>
              <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{formatPostTime(selectedThread.time)}{selectedThread.editedAt ? " · edited" : ""}</span>
            </div>
          </div>
          {selectedThread.body && (
            <div style={{ fontFamily: serif, fontSize: 14, color: T.warmStone, lineHeight: 1.6, margin: 0 }} dangerouslySetInnerHTML={{ __html: `${thRbCSS}<div class="th-rb">${selectedThread.body}</div>` }} />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 14, paddingTop: 12, borderTop: `1px solid ${T.charcoal}` }}>
            <button onClick={() => toggleForumLike(threadLikeKey, selectedThread.likes || 0)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px 8px 4px 0" }}>
              <Heart size={14} color={threadLiked ? T.red : T.tertiary} strokeWidth={1.5} fill={threadLiked ? T.red : "none"} />
              {threadLikes > 0 && <span style={{ fontFamily: sans, fontSize: 11, color: threadLiked ? T.red : T.tertiary }}>{threadLikes}</span>}
            </button>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <MessageCircle size={14} color={T.tertiary} />
              <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{allPosts.length} replies</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Eye size={14} color={T.tertiary} />
              <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{getViewCount(selectedThread)} views</span>
            </div>
            <div style={{ position: "relative", marginLeft: "auto" }}>
              <button onClick={() => setForumShareMenu(threadShareOpen ? null : threadLikeKey)} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: "none", cursor: "pointer", padding: "4px" }}>
                <Share2 size={14} color={T.tertiary} strokeWidth={1.5} />
              </button>
              {threadShareOpen && (
                <div style={{ position: "absolute", bottom: "100%", right: 0, background: T.darkBg, border: `1px solid ${T.charcoal}`, borderRadius: 8, padding: 4, marginBottom: 4, zIndex: 200, minWidth: 150, boxShadow: "0 -4px 16px rgba(0,0,0,0.5)" }}>
                  <button onClick={() => { shareToFeed(selectedThread.title, selectedThread.body, selectedThread.author); setForumShareMenu(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", border: "none", cursor: "pointer" }}>
                    <Share2 size={12} color={T.copper} />
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.white }}>Share to Feed</span>
                  </button>
                  <button onClick={() => { sendViaDM(selectedThread.title, selectedThread.author); setForumShareMenu(null); }} style={{ width: "100%", display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", background: "none", border: "none", cursor: "pointer" }}>
                    <Mail size={12} color={T.copper} />
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.white }}>Send via DM</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Replies */}
        {allPosts.length > 0 && (() => {
          // Separate top-level replies and sub-replies
          const topLevel = [];
          const subReplies = {}; // { parentIdx: [reply, ...] }
          allPosts.forEach((post, i) => {
            if (post.replyTo && typeof post.parentIdx === "number") {
              if (!subReplies[post.parentIdx]) subReplies[post.parentIdx] = [];
              subReplies[post.parentIdx].push({ ...post, _origIdx: i });
            } else {
              topLevel.push({ ...post, _origIdx: i });
            }
          });
          const renderReply = (post, i, isSub, rootParentIdx) => (
            <div key={post._origIdx} style={{ background: isSub ? `${T.charcoal}40` : T.darkCard, padding: isSub ? "10px 14px 10px 20px" : "14px 16px", marginLeft: isSub ? 24 : 0, borderLeft: isSub ? `2px solid ${T.copper}30` : "none", borderBottom: `1px solid ${T.charcoal}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: isSub ? 22 : 26, height: isSub ? 22 : 26, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: isSub ? 9 : 11, fontWeight: 700, color: T.copper }}>{post.initial}</span>
                </div>
                <span style={{ fontFamily: sans, fontSize: isSub ? 11 : 12, color: T.white, fontWeight: 600 }}>@{post.author}</span>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{formatPostTime(post.time)}</span>
              </div>
              {isSub && post.replyTo && (
                <div style={{ marginBottom: 4, paddingLeft: isSub ? 30 : 34 }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.copper }}>replying to @{post.replyTo}</span>
                </div>
              )}
              {post.body ? (
                <div style={{ fontFamily: serif, fontSize: isSub ? 12 : 13, color: T.warmStone, lineHeight: 1.5, margin: "0 0 4px", paddingLeft: isSub ? 30 : 34 }} dangerouslySetInnerHTML={{ __html: post.body.includes("<") ? `<div class="th-rb">${post.body}</div>` : post.body }} />
              ) : (
                <p style={{ fontFamily: serif, fontSize: isSub ? 12 : 13, color: T.warmStone, lineHeight: 1.5, margin: "0 0 4px", paddingLeft: isSub ? 30 : 34 }}>{post.body}</p>
              )}
              {post.photos && post.photos.length > 0 && (
                <div style={{ display: "flex", gap: 6, marginTop: 6, paddingLeft: isSub ? 30 : 34, overflowX: "auto" }}>
                  {post.photos.map((url, pi) => (
                    <img key={pi} src={url} alt="" style={{ width: post.photos.length === 1 ? "100%" : 120, height: post.photos.length === 1 ? 160 : 90, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  ))}
                </div>
              )}
              <div style={{ paddingLeft: isSub ? 30 : 34 }}>
                {replyActionBar(post, post._origIdx, isSub ? rootParentIdx : undefined)}
              </div>
            </div>
          );
          const renderInlineReplyInput = () => (
            <div style={{ marginLeft: 24, borderLeft: `2px solid ${T.copper}30`, background: `${T.charcoal}25`, padding: "10px 14px" }}>
              <input ref={replyFileRef} type="file" accept="image/*" multiple onChange={handleReplyPhoto} style={{ display: "none" }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontFamily: sans, fontSize: 11, color: T.copper }}>Replying to @{replyToReply.author}</span>
                <button onClick={() => setReplyToReply(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  <X size={14} color={T.tertiary} />
                </button>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
                  <MentionInput value={forumReplyText} onChange={setForumReplyText} onKeyDown={e => { if (e.key === "Enter" && (forumReplyText.trim() || replyPhotos.length > 0)) { submitReply(); } }} placeholder={`Reply to @${replyToReply.author}...`} style={{ flex: 1, padding: "10px 38px 10px 12px", borderRadius: 8, background: T.darkBg, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 13, outline: "none", width: "100%" }} />
                  <button onClick={() => replyFileRef.current && replyFileRef.current.click()} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                    <Camera size={16} color={T.tertiary} />
                  </button>
                </div>
                <button onClick={submitReply} style={{ padding: "0 14px", borderRadius: 8, height: 40, background: (forumReplyText.trim() || replyPhotos.length > 0) ? T.red : T.charcoal, border: "none", cursor: (forumReplyText.trim() || replyPhotos.length > 0) ? "pointer" : "default", opacity: (forumReplyText.trim() || replyPhotos.length > 0) ? 1 : 0.4, display: "flex", alignItems: "center" }}>
                  <ChevronRight size={16} color={T.white} />
                </button>
              </div>
              {replyPhotos.length > 0 && (
                <div style={{ marginTop: 6 }}>
                  <PhotoUploader photos={replyPhotos} onChange={setReplyPhotos} />
                </div>
              )}
            </div>
          );
          return (
          <div style={{ padding: "0 16px" }}>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }}>REPLIES ({allPosts.length})</span>
            <div style={{ borderRadius: 8, overflow: "hidden" }}>
              {topLevel.map((post, ti) => {
                const isReplyTarget = replyToReply && replyToReply.idx === post._origIdx;
                return (
                <React.Fragment key={post._origIdx}>
                  {renderReply(post, ti, false, undefined)}
                  {subReplies[post._origIdx] && subReplies[post._origIdx].map((sub, si) => renderReply(sub, si, true, post._origIdx))}
                  {isReplyTarget && renderInlineReplyInput()}
                </React.Fragment>
                );
              })}
            </div>
          </div>
          );
        })()}

        {/* Reply input — only at bottom when not replying to a specific reply */}
        {!replyToReply && (
        <div style={{ margin: "16px 16px 0" }}>
          <input ref={replyFileRef} type="file" accept="image/*" multiple onChange={handleReplyPhoto} style={{ display: "none" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
              <MentionInput value={forumReplyText} onChange={setForumReplyText} onKeyDown={e => {
                if (e.key === "Enter" && (forumReplyText.trim() || replyPhotos.length > 0)) { submitReply(); }
              }} placeholder="Write a reply..." style={{ flex: 1, padding: "12px 38px 12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 13, outline: "none", width: "100%" }} />
              <button onClick={() => replyFileRef.current && replyFileRef.current.click()} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", alignItems: "center" }}>
                <Camera size={16} color={T.tertiary} />
              </button>
            </div>
            <button onClick={submitReply} style={{ padding: "0 16px", borderRadius: 8, height: 42, background: (forumReplyText.trim() || replyPhotos.length > 0) ? T.red : T.charcoal, border: "none", cursor: (forumReplyText.trim() || replyPhotos.length > 0) ? "pointer" : "default", opacity: (forumReplyText.trim() || replyPhotos.length > 0) ? 1 : 0.4, display: "flex", alignItems: "center" }}>
              <ChevronRight size={18} color={T.white} />
            </button>
          </div>
          {replyPhotos.length > 0 && (
            <div style={{ marginTop: 8 }}>
              <PhotoUploader photos={replyPhotos} onChange={setReplyPhotos} />
            </div>
          )}
        </div>
        )}

        {/* Edit thread overlay — mobile-friendly, constrained to app width */}
        {editingThreadId === selectedThread.id && (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: T.darkBg, zIndex: 500, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", borderBottom: `1px solid ${T.charcoal}`, flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <button onClick={() => { setEditingThreadId(null); setEditLinkInput(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  <X size={20} color={T.white} strokeWidth={1.5} />
                </button>
                <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 700 }}>Edit Thread</span>
              </div>
              <button onClick={() => {
                const newBody = editBodyRef.current ? editBodyRef.current.innerHTML : editBody;
                const cleanBody = (newBody && newBody.replace(/<[^>]+>/g, "").trim()) ? newBody : null;
                const newPhotos = editPhotos.map(p => p.url);
                const subName = selectedSub?.name;
                if (subName) {
                  setUserThreads(prev => {
                    const threads = prev[subName] || [];
                    return { ...prev, [subName]: threads.map(t => t.id === selectedThread.id ? { ...t, title: editTitle.trim(), body: cleanBody, photos: newPhotos.length > 0 ? newPhotos : undefined, editedAt: Date.now() } : t) };
                  });
                }
                setSelectedThread({ ...selectedThread, title: editTitle.trim(), body: cleanBody, photos: newPhotos.length > 0 ? newPhotos : undefined, editedAt: Date.now() });
                setEditingThreadId(null); setEditLinkInput(false);
              }} style={{ padding: "8px 18px", borderRadius: 8, background: editTitle.trim() ? T.red : T.charcoal, border: "none", cursor: editTitle.trim() ? "pointer" : "default", opacity: editTitle.trim() ? 1 : 0.5 }}>
                <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>SAVE</span>
              </button>
            </div>
            {/* Scrollable content */}
            <div style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
              {/* Edit title */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>TITLE *</span>
                <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box" }} />
              </div>
              {/* Edit body with formatting toolbar */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>BODY</span>
                {/* Formatting toolbar */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: "6px 8px", background: T.charcoal, borderRadius: "8px 8px 0 0", border: `1px solid ${T.charcoal}`, borderBottom: "none" }}>
                  {[
                    { cmd: "bold", label: "B", style: { fontWeight: 700 } },
                    { cmd: "italic", label: "I", style: { fontStyle: "italic" } },
                    { cmd: "underline", label: "U", style: { textDecoration: "underline" } },
                    { cmd: "strikeThrough", label: "S", style: { textDecoration: "line-through" } },
                  ].map(btn => {
                    const isActive = editActiveFormats[btn.cmd];
                    return (
                    <button key={btn.cmd} onMouseDown={(e) => { e.preventDefault(); document.execCommand(btn.cmd, false, null); editBodyRef.current && setEditBody(editBodyRef.current.innerHTML); setTimeout(updateEditFormats, 0); }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${T.copper}30` : "none", border: isActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", ...btn.style, color: isActive ? T.copper : T.white, fontFamily: serif, fontSize: 13, transition: "all 0.15s" }}>
                      {btn.label}
                    </button>
                    );
                  })}
                  <div style={{ width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" }} />
                  {[
                    { cmd: "formatBlock", arg: "<h1>", label: "H1", key: "h1" },
                    { cmd: "formatBlock", arg: "<h2>", label: "H2", key: "h2" },
                    { cmd: "formatBlock", arg: "<h3>", label: "H3", key: "h3" },
                    { cmd: "formatBlock", arg: "<p>", label: "P", key: "p" },
                  ].map(btn => {
                    const isActive = editActiveFormats[btn.key];
                    return (
                    <button key={btn.label} onMouseDown={(e) => { e.preventDefault(); document.execCommand(btn.cmd, false, btn.arg); editBodyRef.current && setEditBody(editBodyRef.current.innerHTML); setTimeout(updateEditFormats, 0); }} style={{ minWidth: 28, height: 28, padding: "0 6px", display: "flex", alignItems: "center", justifyContent: "center", background: isActive ? `${T.copper}30` : "none", border: isActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: isActive ? T.copper : T.white, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: 0.3, transition: "all 0.15s" }}>
                      {btn.label}
                    </button>
                    );
                  })}
                  <div style={{ width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" }} />
                  {(() => { const ulActive = editActiveFormats.insertUnorderedList; return (
                  <button onMouseDown={(e) => { e.preventDefault(); document.execCommand("insertUnorderedList", false, null); editBodyRef.current && setEditBody(editBodyRef.current.innerHTML); setTimeout(updateEditFormats, 0); }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: ulActive ? `${T.copper}30` : "none", border: ulActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: ulActive ? T.copper : T.white, fontFamily: sans, fontSize: 11, transition: "all 0.15s" }} title="Bullet list">
                    •≡
                  </button>
                  ); })()}
                  {(() => { const olActive = editActiveFormats.insertOrderedList; return (
                  <button onMouseDown={(e) => { e.preventDefault(); document.execCommand("insertOrderedList", false, null); editBodyRef.current && setEditBody(editBodyRef.current.innerHTML); setTimeout(updateEditFormats, 0); }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: olActive ? `${T.copper}30` : "none", border: olActive ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: olActive ? T.copper : T.white, fontFamily: sans, fontSize: 11, transition: "all 0.15s" }} title="Numbered list">
                    1.
                  </button>
                  ); })()}
                  {/* Highlight */}
                  {(() => {
                    const sel = window.getSelection && window.getSelection();
                    let isHighlighted = false;
                    if (sel && sel.rangeCount > 0 && sel.anchorNode) {
                      let node = sel.anchorNode.nodeType === 3 ? sel.anchorNode.parentElement : sel.anchorNode;
                      while (node && node !== editBodyRef.current) {
                        const bg = node.style && node.style.backgroundColor;
                        if (bg && bg !== "transparent" && bg !== "rgba(0, 0, 0, 0)" && bg !== "") { isHighlighted = true; break; }
                        node = node.parentElement;
                      }
                    }
                    return (
                    <button onMouseDown={(e) => { e.preventDefault(); document.execCommand("hiliteColor", false, isHighlighted ? "transparent" : "#C49A6C40"); editBodyRef.current && setEditBody(editBodyRef.current.innerHTML); }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: isHighlighted ? `${T.copper}60` : `${T.copper}20`, border: isHighlighted ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 10, fontWeight: 700, transition: "all 0.15s" }} title="Highlight">
                      Hi
                    </button>
                    );
                  })()}
                  {/* Link */}
                  <button onMouseDown={(e) => {
                    e.preventDefault();
                    const selection = window.getSelection();
                    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) return;
                    editSavedRange.current = selection.getRangeAt(0).cloneRange();
                    setEditLinkInput(true); setEditLinkUrl("");
                  }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: editLinkInput ? `${T.copper}30` : "none", border: editLinkInput ? `1px solid ${T.copper}` : `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 11, textDecoration: "underline", transition: "all 0.15s" }} title="Insert link">
                    🔗
                  </button>
                  <div style={{ width: 1, height: 20, background: `${T.tertiary}30`, margin: "4px 4px", alignSelf: "center" }} />
                  {/* Inline image */}
                  <button onMouseDown={(e) => {
                    e.preventDefault();
                    const selection = window.getSelection();
                    if (selection && selection.rangeCount > 0) editSavedRange.current = selection.getRangeAt(0).cloneRange();
                    const fileInput = document.createElement("input");
                    fileInput.type = "file"; fileInput.accept = "image/*"; fileInput.multiple = true;
                    fileInput.onchange = (ev) => {
                      Array.from(ev.target.files || []).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (re) => {
                          if (editBodyRef.current) {
                            editBodyRef.current.focus();
                            const sel = window.getSelection();
                            if (editSavedRange.current) { sel.removeAllRanges(); sel.addRange(editSavedRange.current); }
                            document.execCommand("insertHTML", false, `<div style="margin:8px 0"><img src="${re.target.result}" style="max-width:100%;border-radius:8px;display:block" /></div>`);
                            setEditBody(editBodyRef.current.innerHTML);
                          }
                        };
                        reader.readAsDataURL(file);
                      });
                    };
                    fileInput.click();
                  }} style={{ width: 30, height: 28, display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: `1px solid ${T.tertiary}30`, borderRadius: 4, cursor: "pointer", color: T.copper, fontFamily: sans, fontSize: 13, transition: "all 0.15s" }} title="Insert image">
                    📷
                  </button>
                </div>
                {/* Link URL input for edit */}
                {editLinkInput && (
                  <div style={{ display: "flex", gap: 6, padding: "8px 10px", background: T.darkBg, border: `1px solid ${T.copper}`, borderBottom: "none" }}>
                    <input autoFocus value={editLinkUrl} onChange={e => setEditLinkUrl(e.target.value)} onKeyDown={e => {
                      if (e.key === "Enter" && editLinkUrl.trim()) {
                        e.preventDefault();
                        const sel = window.getSelection();
                        if (editSavedRange.current) { sel.removeAllRanges(); sel.addRange(editSavedRange.current); }
                        document.execCommand("createLink", false, editLinkUrl.trim().startsWith("http") ? editLinkUrl.trim() : "https://" + editLinkUrl.trim());
                        editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                        setEditLinkInput(false); setEditLinkUrl(""); editSavedRange.current = null;
                      } else if (e.key === "Escape") { setEditLinkInput(false); setEditLinkUrl(""); editSavedRange.current = null; }
                    }} placeholder="Paste URL and press Enter..." style={{ flex: 1, padding: "6px 10px", borderRadius: 6, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: sans, fontSize: 12, outline: "none" }} />
                    <button onClick={() => {
                      if (editLinkUrl.trim()) {
                        const sel = window.getSelection();
                        if (editSavedRange.current) { sel.removeAllRanges(); sel.addRange(editSavedRange.current); }
                        document.execCommand("createLink", false, editLinkUrl.trim().startsWith("http") ? editLinkUrl.trim() : "https://" + editLinkUrl.trim());
                        editBodyRef.current && setEditBody(editBodyRef.current.innerHTML);
                      }
                      setEditLinkInput(false); setEditLinkUrl(""); editSavedRange.current = null;
                    }} style={{ padding: "6px 12px", borderRadius: 6, background: T.copper, border: "none", cursor: "pointer" }}>
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600 }}>Add</span>
                    </button>
                    <button onClick={() => { setEditLinkInput(false); setEditLinkUrl(""); editSavedRange.current = null; }} style={{ padding: "6px 8px", borderRadius: 6, background: "none", border: `1px solid ${T.tertiary}40`, cursor: "pointer" }}>
                      <X size={12} color={T.tertiary} />
                    </button>
                  </div>
                )}
                {/* Editable body */}
                <div
                  ref={(el) => {
                    editBodyRef.current = el;
                    if (el && editInitialized.current !== editingThreadId) {
                      el.innerHTML = editBody;
                      editInitialized.current = editingThreadId;
                    }
                  }}
                  contentEditable
                  onInput={() => { editBodyRef.current && setEditBody(editBodyRef.current.innerHTML); updateEditFormats(); }}
                  onKeyUp={updateEditFormats}
                  onMouseUp={updateEditFormats}
                  onSelect={updateEditFormats}
                  onFocus={updateEditFormats}
                  onPaste={(e) => { e.preventDefault(); const text = e.clipboardData.getData("text/html") || e.clipboardData.getData("text/plain"); document.execCommand("insertHTML", false, text); editBodyRef.current && setEditBody(editBodyRef.current.innerHTML); }}
                  style={{ width: "100%", minHeight: 180, padding: "12px 14px", borderRadius: "0 0 8px 8px", background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box", lineHeight: 1.6, overflowY: "auto", maxHeight: 400 }}
                />
                <style>{`
                  [contenteditable] h1 { font-size: 26px !important; font-weight: 700; color: ${T.white}; margin: 10px 0 6px; font-family: ${sans}; line-height: 1.2; }
                  [contenteditable] h2 { font-size: 21px !important; font-weight: 700; color: ${T.white}; margin: 8px 0 4px; font-family: ${sans}; line-height: 1.3; }
                  [contenteditable] h3 { font-size: 17px !important; font-weight: 600; color: ${T.white}; margin: 6px 0 3px; font-family: ${sans}; line-height: 1.3; }
                  [contenteditable] img { max-width: 100%; border-radius: 8px; display: block; margin: 8px 0; }
                  [contenteditable] a { color: ${T.copper}; text-decoration: underline; }
                  [contenteditable] ul { list-style-type: disc !important; padding-left: 24px !important; }
                  [contenteditable] ol { list-style-type: decimal !important; padding-left: 24px !important; }
                  [contenteditable] li { display: list-item !important; }
                `}</style>
              </div>
              {/* Edit hero image */}
              <div style={{ marginBottom: 16 }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>HERO IMAGE</span>
                <PhotoUploader photos={editPhotos} onChange={setEditPhotos} />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Thread List View ───
  if (view === "threads" && selectedSub && selectedCat) {
    const threads = [...(userThreads[selectedSub.name] || []), ...(forumData.threads[selectedSub.name] || [])];
    return (
      <div style={{ padding: "0 0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
          <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ChevronLeft size={20} color={T.white} strokeWidth={1.5} />
          </button>
          <div style={{ flex: 1 }}>
            <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 700, display: "block" }}>{selectedSub.name}</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{selectedCat.name}</span>
          </div>
          <button onClick={openNewThreadFromSub} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }}>
            <Plus size={14} color={T.white} />
            <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>NEW</span>
          </button>
        </div>

        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {threads.map((t, i) => (
              <div key={t.id} onClick={() => openThread(t)} style={{ background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === threads.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < threads.length - 1 ? `1px solid ${T.charcoal}` : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  {t.pinned && <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}20`, padding: "2px 6px", borderRadius: 3, letterSpacing: 1 }}>PINNED</span>}
                </div>
                <p style={{ fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 8px", lineHeight: 1.4 }}>{t.title}</p>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>@{t.author}</span>
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{formatPostTime(t.time)}</span>
                  </div>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <MessageCircle size={12} color={T.tertiary} />
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{getReplyCount(t)}</span>
                    </div>
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{getViewCount(t)}</span>
                    <ChevronRight size={14} color={T.tertiary} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ─── Subcategories View ───
  if (view === "subcategories" && selectedCat) {
    return (
      <div style={{ padding: "0 0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px" }}>
          <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ChevronLeft size={20} color={T.white} strokeWidth={1.5} />
          </button>
          <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 700 }}>{selectedCat.name}</span>
        </div>

        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            {selectedCat.subs.map((sub, i) => {
              const threadCount = (forumData.threads[sub.name] || []).length;
              return (
                <div key={sub.name} onClick={() => openSubcategory(sub)} style={{ background: T.darkCard, padding: "16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === selectedCat.subs.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < selectedCat.subs.length - 1 ? `1px solid ${T.charcoal}` : "none", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: `${selectedCat.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <MessageCircle size={16} color={selectedCat.color} />
                    </div>
                    <div>
                      <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }}>{sub.name}</span>
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{sub.threads} threads</span>
                    </div>
                  </div>
                  <ChevronRight size={16} color={T.tertiary} />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ─── Categories View (default) ───
  const totalThreads = (cat) => cat.subs.reduce((sum, s) => sum + s.threads, 0);

  // Collect recent threads across all subcategories for the home view
  const recentThreads = Object.values(forumData.threads).flat().sort((a, b) => {
    const timeVal = (t) => t.includes("m ago") ? 1 : t.includes("h ago") ? parseInt(t) : t.includes("d ago") ? parseInt(t) * 24 : 999;
    return timeVal(a.time) - timeVal(b.time);
  }).slice(0, 5);

  return (
    <div style={{ padding: "0 0 16px" }}>
      <div style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px", border: searchActive ? `1px solid ${T.copper}` : `1px solid transparent` }}>
            <Search size={16} color={searchActive ? T.copper : T.tertiary} />
            <input
              ref={searchInputRef}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => setSearchActive(true)}
              placeholder="Search threads, keywords, or @users..."
              style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, marginLeft: 8, padding: 0 }}
            />
            {searchQuery && (
              <button onClick={() => { setSearchQuery(""); setSearchActive(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", marginLeft: 4 }}>
                <X size={14} color={T.tertiary} />
              </button>
            )}
          </div>
          <button onClick={openNewThreadFromHome} style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", whiteSpace: "nowrap" }}>
            <Plus size={14} color={T.white} />
            <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>NEW THREAD</span>
          </button>
        </div>
      </div>

      {/* Search Results */}
      {searchQuery.trim().length > 0 ? (
        <div style={{ padding: "0 16px 16px" }}>
          <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }}>
            {searchResults.length} RESULT{searchResults.length !== 1 ? "S" : ""} FOR "{searchQuery.trim().toUpperCase()}"
          </span>
          {searchResults.length === 0 ? (
            <div style={{ background: T.darkCard, borderRadius: 8, padding: "24px 16px", textAlign: "center" }}>
              <Search size={24} color={T.tertiary} style={{ marginBottom: 8 }} />
              <p style={{ fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "8px 0 4px" }}>No threads found</p>
              <p style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }}>Try different keywords or check the spelling</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {searchResults.map((t, i) => {
                const q = searchQuery.trim().toLowerCase();
                const matchesAuthor = t.author.toLowerCase().includes(q);
                const matchesReply = t.posts && t.posts.some(p => p.author.toLowerCase().includes(q));
                return (
                  <div key={t.id} onClick={() => {
                    setSelectedCat(t.cat);
                    setSelectedSub(t.sub);
                    setSelectedThread(t);
                    setView("thread");
                    trackView(t.id);
                  }} style={{ background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === searchResults.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < searchResults.length - 1 ? `1px solid ${T.charcoal}` : "none" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}15`, padding: "2px 6px", borderRadius: 3, letterSpacing: 0.5 }}>{t.catName}</span>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary }}>›</span>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 0.5 }}>{t.subName}</span>
                      {matchesAuthor && <span style={{ fontFamily: sans, fontSize: 9, color: T.green, background: `${T.green}20`, padding: "2px 6px", borderRadius: 3, marginLeft: "auto" }}>AUTHOR MATCH</span>}
                      {!matchesAuthor && matchesReply && <span style={{ fontFamily: sans, fontSize: 9, color: T.green, background: `${T.green}20`, padding: "2px 6px", borderRadius: 3, marginLeft: "auto" }}>REPLY MATCH</span>}
                    </div>
                    <p style={{ fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 6px", lineHeight: 1.4 }}>{t.title}</p>
                    {t.body && <p style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, margin: "0 0 8px", lineHeight: 1.4 }}>{t.body.length > 80 ? t.body.slice(0, 80) + "..." : t.body}</p>}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", gap: 12 }}>
                        <span style={{ fontFamily: sans, fontSize: 11, color: matchesAuthor ? T.green : T.tertiary, fontWeight: matchesAuthor ? 600 : 400 }}>@{t.author}</span>
                        <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{formatPostTime(t.time)}</span>
                      </div>
                      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                          <MessageCircle size={12} color={T.tertiary} />
                          <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{getReplyCount(t)}</span>
                        </div>
                        <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{getViewCount(t)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
      <>
      {/* Categories */}
      <div style={{ padding: "0 16px 16px" }}>
        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }}>CATEGORIES</span>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {forumData.categories.map((cat) => (
            <div key={cat.name} onClick={() => openCategory(cat)} style={{ background: T.darkCard, borderRadius: 8, padding: "14px", cursor: "pointer", borderLeft: `3px solid ${cat.color}` }}>
              <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block", marginBottom: 4 }}>{cat.name}</span>
              <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>{totalThreads(cat)} threads</span>
              <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, display: "block", marginTop: 2 }}>{cat.subs.length} subcategories</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Threads */}
      <div style={{ padding: "0 16px" }}>
        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 10 }}>RECENT THREADS</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {recentThreads.map((t, i) => (
            <div key={t.id} onClick={() => {
              // Find the category and sub for this thread
              for (const cat of forumData.categories) {
                for (const sub of cat.subs) {
                  if ((forumData.threads[sub.name] || []).find(th => th.id === t.id)) {
                    setSelectedCat(cat);
                    setSelectedSub(sub);
                    setSelectedThread(t);
                    setView("thread");
                    trackView(t.id);
                    return;
                  }
                }
              }
            }} style={{ background: T.darkCard, padding: "14px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === recentThreads.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < recentThreads.length - 1 ? `1px solid ${T.charcoal}` : "none" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                {t.pinned && <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, background: `${T.copper}20`, padding: "2px 6px", borderRadius: 3, letterSpacing: 1 }}>PINNED</span>}
              </div>
              <p style={{ fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 8px", lineHeight: 1.4 }}>{t.title}</p>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", gap: 12 }}>
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>@{t.author}</span>
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{formatPostTime(t.time)}</span>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <MessageCircle size={12} color={T.tertiary} />
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{getReplyCount(t)}</span>
                  </div>
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{getViewCount(t)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      </>
      )}
    </div>
  );
}

/* ─── ROUTES SCREEN ─── */
/* ─── Route Recorder Overlay ─── */
function RouteRecorder({ onClose, onSave }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const polyRef = useRef(null);
  const userDotRef = useRef(null);
  const watchRef = useRef(null);
  const startTimeRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [recording, setRecording] = useState(false);
  const [paused, setPaused] = useState(false);
  const [trackPoints, setTrackPoints] = useState([]); // [{ lat, lng, alt, speed, time }]
  const [elapsed, setElapsed] = useState(0);
  const [stats, setStats] = useState({ speed: 0, maxSpeed: 0, elevation: 0, elevGain: 0, distance: 0 });
  const [showDetails, setShowDetails] = useState(false);
  const timerRef = useRef(null);
  const pausedTimeRef = useRef(0);
  const pauseStartRef = useRef(null);
  const [routePhotos, setRoutePhotos] = useState([]); // [{ url, name, lat?, lng? }]
  const recCamRef = useRef(null);
  const photoMarkersRef = useRef([]);

  const handleRecPhoto = (e) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    // Copy files array BEFORE clearing the input (FileList is a live reference)
    const files = Array.from(fileList);
    e.target.value = "";
    // Get current GPS position for the photo pin
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const photo = { url: ev.target.result, name: file.name, lat, lng };
              setRoutePhotos(prev => [...prev, photo]);
              // Add marker on map
              if (mapInst.current && window.google) {
                const m = new window.google.maps.Marker({
                  position: { lat, lng },
                  map: mapInst.current,
                  label: { text: "\u{1F4F7}", fontSize: "14px" },
                  icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 16, fillColor: "#4A7C59", fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 },
                  zIndex: 998,
                });
                photoMarkersRef.current.push(m);
              }
            };
            reader.readAsDataURL(file);
          });
        },
        () => {
          // No GPS — still save photo without location
          files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (ev) => {
              setRoutePhotos(prev => [...prev, { url: ev.target.result, name: file.name }]);
            };
            reader.readAsDataURL(file);
          });
        },
        { enableHighAccuracy: true, timeout: 3000 }
      );
    } else {
      // No geolocation API — save photos without location
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setRoutePhotos(prev => [...prev, { url: ev.target.result, name: file.name }]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  // Init map
  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try { await loadGmaps(); } catch (e) { return; }
      if (cancelled || !mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 39.5, lng: -98.35 },
        zoom: 5,
        mapTypeId: "terrain",
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
          { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
          { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
        ],
      });
      mapInst.current = map;
      polyRef.current = new window.google.maps.Polyline({
        map,
        path: [],
        strokeColor: T.red,
        strokeWeight: 4,
        strokeOpacity: 0.9,
      });
      // Try to center on user
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (p) => { map.setCenter({ lat: p.coords.latitude, lng: p.coords.longitude }); map.setZoom(15); },
          () => {},
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
      setMapReady(true);
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Timer
  useEffect(() => {
    if (recording && !paused) {
      timerRef.current = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startTimeRef.current - pausedTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [recording, paused]);

  const formatTime = (s) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}` : `${m}:${String(sec).padStart(2, "0")}`;
  };

  const startRecording = () => {
    if (!navigator.geolocation) return;
    setRecording(true);
    setPaused(false);
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setTrackPoints([]);
    setStats({ speed: 0, maxSpeed: 0, elevation: 0, elevGain: 0, distance: 0 });
    setElapsed(0);
    if (polyRef.current) polyRef.current.setPath([]);

    let prevAlt = null;
    let totalDist = 0;
    let totalGain = 0;
    let maxSpd = 0;
    let lastLat = null;
    let lastLng = null;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const alt = pos.coords.altitude; // may be null
        const speed = pos.coords.speed; // m/s, may be null
        const pt = { lat, lng, alt, speed, time: Date.now() };

        setTrackPoints(prev => [...prev, pt]);

        // Update polyline
        if (polyRef.current) {
          const path = polyRef.current.getPath();
          path.push(new window.google.maps.LatLng(lat, lng));
        }

        // Update user dot
        const p = new window.google.maps.LatLng(lat, lng);
        if (!userDotRef.current && mapInst.current) {
          userDotRef.current = new window.google.maps.Marker({
            position: p,
            map: mapInst.current,
            icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#4285F4", fillOpacity: 1, strokeColor: T.white, strokeWeight: 3 },
            zIndex: 999,
          });
        } else if (userDotRef.current) {
          userDotRef.current.setPosition(p);
        }
        if (mapInst.current) mapInst.current.panTo(p);

        // Calc stats
        if (lastLat !== null) {
          totalDist += haversine(lastLat, lastLng, lat, lng);
        }
        lastLat = lat;
        lastLng = lng;

        if (alt !== null && prevAlt !== null && alt > prevAlt) {
          totalGain += (alt - prevAlt);
        }
        if (alt !== null) prevAlt = alt;

        const spdMph = speed !== null ? speed * 2.237 : 0; // m/s to mph
        if (spdMph > maxSpd) maxSpd = spdMph;

        setStats({
          speed: Math.round(spdMph),
          maxSpeed: Math.round(maxSpd),
          elevation: alt !== null ? Math.round(alt * 3.281) : 0, // m to ft
          elevGain: Math.round(totalGain * 3.281),
          distance: totalDist,
        });
      },
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );
  };

  const pauseRecording = () => {
    setPaused(true);
    pauseStartRef.current = Date.now();
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
  };

  const resumeRecording = () => {
    setPaused(false);
    if (pauseStartRef.current) {
      pausedTimeRef.current += Date.now() - pauseStartRef.current;
      pauseStartRef.current = null;
    }
    // Restart GPS watch — reuse same accumulator via closure
    let prevAlt = trackPoints.length > 0 ? trackPoints[trackPoints.length - 1].alt : null;
    let totalDist = stats.distance;
    let totalGain = stats.elevGain / 3.281;
    let maxSpd = stats.maxSpeed;
    let lastPt = trackPoints.length > 0 ? trackPoints[trackPoints.length - 1] : null;
    let lastLat = lastPt ? lastPt.lat : null;
    let lastLng = lastPt ? lastPt.lng : null;

    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const alt = pos.coords.altitude;
        const speed = pos.coords.speed;
        const pt = { lat, lng, alt, speed, time: Date.now() };

        setTrackPoints(prev => [...prev, pt]);
        if (polyRef.current) polyRef.current.getPath().push(new window.google.maps.LatLng(lat, lng));
        const p = new window.google.maps.LatLng(lat, lng);
        if (userDotRef.current) userDotRef.current.setPosition(p);
        if (mapInst.current) mapInst.current.panTo(p);

        if (lastLat !== null) totalDist += haversine(lastLat, lastLng, lat, lng);
        lastLat = lat; lastLng = lng;
        if (alt !== null && prevAlt !== null && alt > prevAlt) totalGain += (alt - prevAlt);
        if (alt !== null) prevAlt = alt;
        const spdMph = speed !== null ? speed * 2.237 : 0;
        if (spdMph > maxSpd) maxSpd = spdMph;

        setStats({
          speed: Math.round(spdMph),
          maxSpeed: Math.round(maxSpd),
          elevation: alt !== null ? Math.round(alt * 3.281) : 0,
          elevGain: Math.round(totalGain * 3.281),
          distance: totalDist,
        });
      },
      (err) => console.warn("GPS error:", err.message),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
    );
  };

  const stopRecording = () => {
    setRecording(false);
    setPaused(false);
    if (watchRef.current !== null) {
      navigator.geolocation.clearWatch(watchRef.current);
      watchRef.current = null;
    }
    if (userDotRef.current) { userDotRef.current.setMap(null); userDotRef.current = null; }
    if (mapInst.current && trackPoints.length > 1) {
      const bounds = new window.google.maps.LatLngBounds();
      trackPoints.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      mapInst.current.fitBounds(bounds, 40);
    }
    // Open details form after stopping
    setShowDetails(true);
  };

  const handlePublish = (details) => {
    onSave({
      ...details,
      points: trackPoints,
      distance: stats.distance,
      elevGain: stats.elevGain,
      maxSpeed: stats.maxSpeed,
      duration: elapsed,
    });
  };

  const distMi = (stats.distance / 1609.34).toFixed(1);

  // ─── Trip Details Form (after recording) ───
  if (showDetails) {
    return (
      <RouteDetailsForm
        autoStats={{ distance: distMi, elevGain: stats.elevGain, maxSpeed: stats.maxSpeed, duration: formatTime(elapsed), elevation: stats.elevation }}
        onBack={() => setShowDetails(false)}
        onPublish={handlePublish}
        initialPhotos={routePhotos}
      />
    );
  }

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 300, background: T.darkBg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ChevronLeft size={22} color={T.white} strokeWidth={1.5} />
          </button>
          <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }}>Record Route</span>
        </div>
        {recording && (
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: paused ? T.copper : T.red, animation: paused ? "none" : "thspin 2s linear infinite" }} />
            <span style={{ fontFamily: sans, fontSize: 12, color: paused ? T.copper : T.red, fontWeight: 600 }}>{paused ? "PAUSED" : "REC"}</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        {!mapReady && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: T.darkBg }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <span style={{ fontFamily: sans, fontSize: 13, color: T.tertiary }}>Loading map...</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Panel */}
      {recording && (
        <div style={{ background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, padding: "12px 16px", flexShrink: 0 }}>
          <div style={{ textAlign: "center", marginBottom: 10 }}>
            <span style={{ fontFamily: sans, fontSize: 32, fontWeight: 700, color: T.white, letterSpacing: 1 }}>{formatTime(elapsed)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>SPEED</span>
              <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }}>{stats.speed}</span>
              <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>MPH</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>MAX</span>
              <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.copper }}>{stats.maxSpeed}</span>
              <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>MPH</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>ELEV</span>
              <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }}>{stats.elevation.toLocaleString()}</span>
              <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>FT</span>
            </div>
            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>GAIN</span>
              <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.green }}>{stats.elevGain.toLocaleString()}</span>
              <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>FT</span>
            </div>
          </div>
          <div style={{ textAlign: "center", marginBottom: 12, padding: "8px 0", borderTop: `1px solid ${T.darkCard}`, borderBottom: `1px solid ${T.darkCard}` }}>
            <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1 }}>DISTANCE </span>
            <span style={{ fontFamily: sans, fontSize: 20, fontWeight: 700, color: T.red }}>{distMi}</span>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}> MI</span>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ padding: "12px 16px", background: T.charcoal, borderTop: recording ? "none" : `1px solid ${T.darkCard}`, flexShrink: 0, display: "flex", gap: 10 }}>
        {!recording ? (
          <button onClick={startRecording} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }}>
            <Radio size={16} color={T.white} />
            <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>START RECORDING</span>
          </button>
        ) : (
          <>
            {paused ? (
              <button onClick={resumeRecording} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px", borderRadius: 8, background: T.green, border: "none", cursor: "pointer" }}>
                <Navigation size={14} color={T.white} />
                <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>RESUME</span>
              </button>
            ) : (
              <button onClick={pauseRecording} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "14px", borderRadius: 8, background: T.copper, border: "none", cursor: "pointer" }}>
                <Clock size={14} color={T.white} />
                <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>PAUSE</span>
              </button>
            )}
            <input ref={recCamRef} type="file" accept="image/*" capture="environment" onChange={handleRecPhoto} style={{ display: "none" }} />
            <button onClick={() => recCamRef.current && recCamRef.current.click()} style={{ padding: "14px 18px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
              <Camera size={16} color={T.white} />
              {routePhotos.length > 0 && (
                <span style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: T.green, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: sans, fontSize: 9, color: T.white, fontWeight: 700 }}>{routePhotos.length}</span>
              )}
            </button>
            <button onClick={stopRecording} style={{ padding: "14px 18px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ width: 14, height: 14, borderRadius: 2, background: T.white, display: "block" }} />
            </button>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Route Details Form (used after recording or for manual entry) ─── */
const rdInput = { width: "100%", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", boxSizing: "border-box" };
const rdLabel = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 };
const rdStatBox = { textAlign: "center", padding: "10px 0", background: T.darkCard, borderRadius: 8 };

/* ─── Route Map Preview (read-only, for expanded route cards) ─── */
function RouteMapPreview({ pins, points, photos }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef([]);
  const polyRef = useRef(null);
  const infoRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  useEffect(() => {
    if ((!pins || pins.length === 0) && (!points || points.length === 0)) return;
    if (!mapRef.current) return;
    const tryInit = () => {
      if (!window.google || !window.google.maps) { setTimeout(tryInit, 200); return; }
      if (mapInst.current) return;
      const bounds = new window.google.maps.LatLngBounds();
      const allPts = points && points.length > 0 ? points : pins;
      allPts.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      if (pins) pins.forEach(p => bounds.extend({ lat: p.lat, lng: p.lng }));
      const map = new window.google.maps.Map(mapRef.current, {
        center: bounds.getCenter(),
        zoom: 12,
        disableDefaultUI: true,
        zoomControl: true,
        gestureHandling: "greedy",
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#8b7d6b" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#111111" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a28" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
          { featureType: "poi", stylers: [{ visibility: "off" }] },
        ],
      });
      map.fitBounds(bounds, 30);
      mapInst.current = map;
      // Build photo lookup by lat/lng for matching pins to photos
      const photoList = photos || [];
      let photoIdx = 0;
      // Draw pin markers
      if (pins && pins.length > 0) {
        pins.forEach((p, i) => {
          const isPhoto = !!p.photo;
          const marker = new window.google.maps.Marker({
            position: { lat: p.lat, lng: p.lng },
            map,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: isPhoto ? 10 : 6,
              fillColor: isPhoto ? "#4A7C59" : (i === 0 ? T.green : i === pins.length - 1 ? T.red : T.copper),
              fillOpacity: 1,
              strokeColor: T.white,
              strokeWeight: isPhoto ? 2 : 1.5,
            },
            label: isPhoto ? { text: "\uD83D\uDCF7", fontSize: "12px" } : null,
            zIndex: isPhoto ? 100 : 10,
          });
          // Match photo pin to a photo from the photos array
          if (isPhoto && photoList.length > 0) {
            // Find matching photo by lat/lng proximity or use sequential index
            let matchedPhoto = null;
            const pPhoto = photoList.find(ph => ph.lat && ph.lng && Math.abs(ph.lat - p.lat) < 0.0005 && Math.abs(ph.lng - p.lng) < 0.0005);
            if (pPhoto) {
              matchedPhoto = pPhoto.url || pPhoto;
            } else if (photoIdx < photoList.length) {
              matchedPhoto = photoList[photoIdx].url || photoList[photoIdx];
              photoIdx++;
            }
            if (matchedPhoto) {
              marker.addListener("click", () => {
                setSelectedPhoto(matchedPhoto);
              });
              marker.setCursor("pointer");
            }
          }
          markersRef.current.push(marker);
        });
      }
      // Draw polyline — use full GPS track if available, otherwise connect pins
      const polyPath = points && points.length > 1 ? points.map(p => ({ lat: p.lat, lng: p.lng })) : (pins && pins.length > 1 ? pins.map(p => ({ lat: p.lat, lng: p.lng })) : []);
      if (polyPath.length > 1) {
        polyRef.current = new window.google.maps.Polyline({
          path: polyPath,
          map,
          strokeColor: T.red,
          strokeWeight: 3,
          strokeOpacity: 0.85,
        });
      }
      setReady(true);
    };
    tryInit();
    return () => {
      markersRef.current.forEach(m => m.setMap(null));
      markersRef.current = [];
      if (polyRef.current) { polyRef.current.setMap(null); polyRef.current = null; }
      mapInst.current = null;
    };
  }, [pins]);

  if (!pins || pins.length === 0) return null;
  return (
    <>
      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
      {selectedPhoto && (
        <div onClick={() => setSelectedPhoto(null)} style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.85)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50, cursor: "pointer", borderRadius: 10 }}>
          <img src={selectedPhoto} alt="" style={{ maxWidth: "90%", maxHeight: "90%", borderRadius: 10, objectFit: "contain" }} />
          <button onClick={() => setSelectedPhoto(null)} style={{ position: "absolute", top: 8, right: 8, background: "rgba(0,0,0,0.6)", border: "none", borderRadius: "50%", width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <X size={14} color="#fff" />
          </button>
        </div>
      )}
    </>
  );
}

/* ─── In-App Route Navigation ─── */
function RouteNavigation({ route, onClose }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const userDotRef = useRef(null);
  const watchRef = useRef(null);
  const dirRendererRef = useRef(null);
  const [mapReady, setMapReady] = useState(false);
  const [currentStep, setCurrentStep] = useState(null); // { instruction, distance, duration }
  const [distToNext, setDistToNext] = useState("");
  const [arrived, setArrived] = useState(false);
  const [userPos, setUserPos] = useState(null);
  const stepsRef = useRef([]);
  const routeLegsRef = useRef([]);

  const rPins = route.pins || [];
  const startPin = rPins.length > 0 ? rPins[0] : null;
  const endPin = rPins.length > 1 ? rPins[rPins.length - 1] : null;

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try { await loadGmaps(); } catch (e) { return; }
      if (cancelled || !mapRef.current) return;
      const center = startPin ? { lat: startPin.lat, lng: startPin.lng } : { lat: 39.5, lng: -98.35 };
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeId: "terrain",
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
          { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
        ],
      });
      mapInst.current = map;

      // Route from first pin to last pin via waypoints
      if (startPin && endPin) {
        const ds = new window.google.maps.DirectionsService();
        const dr = new window.google.maps.DirectionsRenderer({
          map,
          suppressMarkers: false,
          polylineOptions: { strokeColor: T.red, strokeWeight: 5, strokeOpacity: 0.9 },
          markerOptions: { visible: false },
        });
        dirRendererRef.current = dr;
        const waypoints = rPins.slice(1, -1).filter(p => !p.photo).map(p => ({ location: { lat: p.lat, lng: p.lng }, stopover: true }));
        ds.route({
          origin: { lat: startPin.lat, lng: startPin.lng },
          destination: { lat: endPin.lat, lng: endPin.lng },
          waypoints,
          travelMode: window.google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        }, (result, status) => {
          if (status === "OK") {
            dr.setDirections(result);
            // Extract steps
            const allSteps = [];
            result.routes[0].legs.forEach(leg => {
              routeLegsRef.current.push(leg);
              leg.steps.forEach(step => allSteps.push(step));
            });
            stepsRef.current = allSteps;
            if (allSteps.length > 0) {
              setCurrentStep({ instruction: allSteps[0].instructions, distance: allSteps[0].distance.text, duration: allSteps[0].duration.text });
            }
            // Fit to route
            const bounds = new window.google.maps.LatLngBounds();
            result.routes[0].overview_path.forEach(p => bounds.extend(p));
            map.fitBounds(bounds, 60);
          }
        });

        // Start/end markers
        new window.google.maps.Marker({ position: { lat: startPin.lat, lng: startPin.lng }, map, icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: T.green, fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 }, label: { text: "S", color: T.white, fontWeight: "bold", fontSize: "11px" } });
        new window.google.maps.Marker({ position: { lat: endPin.lat, lng: endPin.lng }, map, icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: T.red, fillOpacity: 1, strokeColor: T.white, strokeWeight: 2 }, label: { text: "F", color: T.white, fontWeight: "bold", fontSize: "11px" } });
      }

      // Track user position
      if (navigator.geolocation) {
        watchRef.current = navigator.geolocation.watchPosition(
          (pos) => {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            setUserPos({ lat, lng });
            const p = new window.google.maps.LatLng(lat, lng);
            if (!userDotRef.current) {
              userDotRef.current = new window.google.maps.Marker({
                position: p, map,
                icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 10, fillColor: "#4285F4", fillOpacity: 1, strokeColor: T.white, strokeWeight: 3 },
                zIndex: 999,
              });
            } else {
              userDotRef.current.setPosition(p);
            }
            map.panTo(p);

            // Find closest upcoming step
            if (stepsRef.current.length > 0) {
              let closest = null;
              let closestDist = Infinity;
              stepsRef.current.forEach((step, si) => {
                const sLat = step.start_location.lat();
                const sLng = step.start_location.lng();
                const d = Math.sqrt(Math.pow(lat - sLat, 2) + Math.pow(lng - sLng, 2));
                if (d < closestDist) { closestDist = d; closest = si; }
              });
              if (closest !== null) {
                const step = stepsRef.current[closest];
                setCurrentStep({ instruction: step.instructions, distance: step.distance.text, duration: step.duration.text });
              }
            }
            // Check if arrived (within ~50m of end)
            if (endPin) {
              const dEnd = haversine(lat, lng, endPin.lat, endPin.lng);
              if (dEnd < 50) setArrived(true);
            }
          },
          () => {},
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 2000 }
        );
      }
      setMapReady(true);
    };
    init();
    return () => {
      cancelled = true;
      if (watchRef.current !== null) navigator.geolocation.clearWatch(watchRef.current);
      if (userDotRef.current) { userDotRef.current.setMap(null); userDotRef.current = null; }
    };
  }, []);

  // Strip HTML from directions instructions
  const stripHtml = (html) => { const div = document.createElement("div"); div.innerHTML = html; return div.textContent || div.innerText || ""; };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 400, background: T.darkBg, display: "flex", flexDirection: "column" }}>
      {/* Direction banner */}
      <div style={{ background: T.charcoal, padding: "12px 16px", borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Navigation size={16} color={T.copper} />
            <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, color: T.white, letterSpacing: 0.5 }}>{route.name || route.title || "Route Navigation"}</span>
          </div>
          <button onClick={onClose} style={{ background: `${T.red}30`, border: "none", borderRadius: 6, padding: "6px 12px", cursor: "pointer" }}>
            <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.red, letterSpacing: 0.5 }}>END</span>
          </button>
        </div>
        {arrived ? (
          <div style={{ background: `${T.green}20`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle size={18} color={T.green} />
            <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.green }}>You have arrived!</span>
          </div>
        ) : currentStep ? (
          <div style={{ background: T.darkCard, borderRadius: 8, padding: "10px 14px" }}>
            <p style={{ fontFamily: serif, fontSize: 15, color: T.white, margin: "0 0 4px", lineHeight: 1.4 }}>{stripHtml(currentStep.instruction)}</p>
            <div style={{ display: "flex", gap: 12 }}>
              <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600 }}>{currentStep.distance}</span>
              <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{currentStep.duration}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0" }}>
            <div style={{ width: 14, height: 14, border: `2px solid ${T.copper}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite" }} />
            <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary }}>Calculating route...</span>
          </div>
        )}
      </div>

      {/* Map */}
      <div style={{ flex: 1, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        {!mapReady && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: T.darkBg }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ width: 28, height: 28, border: `3px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite", margin: "0 auto 12px" }} />
              <span style={{ fontFamily: sans, fontSize: 13, color: T.tertiary }}>Loading navigation...</span>
            </div>
          </div>
        )}
        {/* Re-center button */}
        {userPos && (
          <button onClick={() => mapInst.current && mapInst.current.panTo(userPos)} style={{ position: "absolute", bottom: 16, right: 16, width: 44, height: 44, borderRadius: "50%", background: T.charcoal, border: `1px solid ${T.tertiary}40`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.4)" }}>
            <Target size={18} color={T.copper} />
          </button>
        )}
      </div>

      {/* Bottom stats bar */}
      <div style={{ background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, padding: "10px 16px", flexShrink: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-around" }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>DISTANCE</span>
            <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }}>{route.distance || "—"}</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>EST. TIME</span>
            <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }}>{route.time || route.duration || "—"}</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>ELEVATION</span>
            <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white }}>{route.elevation || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Route Pin Map (for manual route entry) ─── */
function RoutePinMap({ pins, setPins, linkingPhotoIdx, onLinkPin, onRoutePoints }) {
  const mapRef = useRef(null);
  const mapInst = useRef(null);
  const markersRef = useRef([]);
  const polyRef = useRef(null);
  const dirRendererRef = useRef(null);
  const dirServiceRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      try { await loadGmaps(); } catch (e) { return; }
      if (cancelled || !mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 39.5, lng: -98.35 },
        zoom: 5,
        mapTypeId: "terrain",
        disableDefaultUI: true,
        zoomControl: true,
        styles: [
          { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
          { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
          { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
          { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
          { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#263c3f" }] },
        ],
      });
      mapInst.current = map;
      polyRef.current = new window.google.maps.Polyline({ map, path: [], strokeColor: T.red, strokeWeight: 3, strokeOpacity: 0.8 });
      dirServiceRef.current = new window.google.maps.DirectionsService();
      dirRendererRef.current = new window.google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
        polylineOptions: { strokeColor: T.red, strokeWeight: 4, strokeOpacity: 0.9 },
      });

      // Click to add pin
      map.addListener("click", (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setPins(prev => [...prev, { lat, lng }]);
      });

      // Try to center on user location
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (p) => { map.setCenter({ lat: p.coords.latitude, lng: p.coords.longitude }); map.setZoom(10); },
          () => {},
          { enableHighAccuracy: true, timeout: 5000 }
        );
      }
      setReady(true);
    };
    init();
    return () => { cancelled = true; };
  }, []);

  // Sync markers + road-snapped polyline with pins state
  useEffect(() => {
    if (!mapInst.current || !ready) return;
    // Clear old markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];
    // Add new markers
    pins.forEach((p, i) => {
      const isPhoto = !!p.photo;
      const marker = new window.google.maps.Marker({
        position: { lat: p.lat, lng: p.lng },
        map: mapInst.current,
        label: isPhoto ? { text: "\u{1F4F7}", fontSize: "14px" } : { text: `${i + 1}`, color: T.white, fontWeight: "bold", fontSize: "11px" },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isPhoto ? 16 : 14,
          fillColor: isPhoto ? "#4A7C59" : (i === 0 ? T.green : i === pins.length - 1 ? T.red : T.copper),
          fillOpacity: 1,
          strokeColor: T.white,
          strokeWeight: 2,
        },
      });
      // Click pin: link photo if in linking mode, otherwise remove pin
      marker.addListener("click", () => {
        if (typeof linkingPhotoIdx === "number" && onLinkPin) {
          onLinkPin(i);
        } else {
          setPins(prev => prev.filter((_, idx) => idx !== i));
        }
      });
      markersRef.current.push(marker);
    });

    // Route polyline: use Directions API for road-snapping when >= 2 non-photo pins
    const routePins = pins.filter(p => !p.photo);
    if (routePins.length >= 2 && dirServiceRef.current && dirRendererRef.current) {
      // Hide simple polyline, use directions renderer
      if (polyRef.current) polyRef.current.setPath([]);
      const origin = { lat: routePins[0].lat, lng: routePins[0].lng };
      const destination = { lat: routePins[routePins.length - 1].lat, lng: routePins[routePins.length - 1].lng };
      const waypoints = routePins.slice(1, -1).map(p => ({ location: { lat: p.lat, lng: p.lng }, stopover: true }));
      dirServiceRef.current.route({
        origin,
        destination,
        waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        optimizeWaypoints: false,
      }, (result, status) => {
        if (status === "OK") {
          dirRendererRef.current.setDirections(result);
          // Extract road-snapped polyline points and pass up
          if (onRoutePoints && result.routes && result.routes[0]) {
            const routePoints = [];
            result.routes[0].legs.forEach(leg => {
              leg.steps.forEach(step => {
                step.path.forEach(pt => {
                  routePoints.push({ lat: pt.lat(), lng: pt.lng() });
                });
              });
            });
            onRoutePoints(routePoints);
          }
        } else {
          // Fallback to straight polyline if directions fail
          dirRendererRef.current.setDirections({ routes: [] });
          if (polyRef.current) {
            polyRef.current.setPath(pins.map(p => ({ lat: p.lat, lng: p.lng })));
          }
          onRoutePoints && onRoutePoints([]);
        }
      });
    } else {
      // Less than 2 pins or only photo pins — use simple polyline
      if (dirRendererRef.current) dirRendererRef.current.setDirections({ routes: [] });
      if (polyRef.current) {
        polyRef.current.setPath(pins.map(p => ({ lat: p.lat, lng: p.lng })));
      }
    }
  }, [pins, ready, linkingPhotoIdx]);

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <span style={rdLabel}>{typeof linkingPhotoIdx === "number" ? "TAP A PIN TO LINK PHOTO" : "ROUTE MAP — TAP TO ADD PINS"}</span>
        {pins.length > 0 && (
          <button onClick={() => setPins([])} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.red, fontWeight: 600 }}>CLEAR ALL</span>
          </button>
        )}
      </div>
      <div style={{ borderRadius: 12, overflow: "hidden", border: typeof linkingPhotoIdx === "number" ? `2px solid ${T.copper}` : `1px solid ${T.charcoal}`, height: 220, position: "relative" }}>
        <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
        {!ready && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: T.darkCard }}>
            <div style={{ width: 22, height: 22, border: `2px solid ${T.red}`, borderTopColor: "transparent", borderRadius: "50%", animation: "thspin 0.8s linear infinite" }} />
          </div>
        )}
      </div>
      {pins.length > 0 && (
        <div style={{ marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.green }} />
          <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>Start</span>
          {pins.length > 1 && (<>
            <div style={{ flex: 1, height: 1, background: T.charcoal }} />
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: T.red }} />
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>End</span>
          </>)}
          <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }}>{pins.length} pin{pins.length !== 1 ? "s" : ""} — tap pin to remove</span>
        </div>
      )}
    </div>
  );
}

function RouteDetailsForm({ autoStats, onBack, onPublish, isManual, initialPhotos, isEdit, initialData, initialPins }) {
  const d = initialData || {};
  const [name, setName] = useState(d.name || "");
  const [desc, setDesc] = useState(d.desc || "");
  const [difficulty, setDifficulty] = useState(d.difficulty || "Moderate");
  const [region, setRegion] = useState(d.region || d.location || "");
  const [terrains, setTerrains] = useState(d.terrains || []); // multi-select
  const [tags, setTags] = useState(d.tags ? d.tags.join(", ") : "");
  const [shareToFeed, setShareToFeed] = useState(isEdit ? false : true);
  const [pins, setPins] = useState(initialPins || []);
  const [routePhotos, setRoutePhotos] = useState(initialPhotos || []); // [{ url, name, lat?, lng? }]
  const routePhotoRef = useRef(null);
  // Manual-only fields
  const [manualDistance, setManualDistance] = useState(d.distance ? d.distance.replace(/[^0-9.]/g, "") : "");
  const [manualTime, setManualTime] = useState(d.time || "");
  const [manualElevGain, setManualElevGain] = useState(d.elevation ? d.elevation.replace(/[^0-9,]/g, "").replace(/,/g, "") : "");
  const [manualMaxElev, setManualMaxElev] = useState("");
  const [manualLocation, setManualLocation] = useState(d.location || "");

  // Extract GPS EXIF from image
  const extractGPS = (file) => new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const view = new DataView(e.target.result);
        if (view.getUint16(0) !== 0xFFD8) { resolve(null); return; }
        let offset = 2;
        while (offset < view.byteLength) {
          const marker = view.getUint16(offset);
          if (marker === 0xFFE1) {
            const exifData = view.buffer.slice(offset + 10);
            const dv = new DataView(exifData);
            const le = dv.getUint16(0) === 0x4949;
            const ifdOffset = dv.getUint32(4, le);
            const entries = dv.getUint16(ifdOffset, le);
            let gpsOffset = null;
            for (let i = 0; i < entries; i++) {
              const tag = dv.getUint16(ifdOffset + 2 + i * 12, le);
              if (tag === 0x8825) { gpsOffset = dv.getUint32(ifdOffset + 2 + i * 12 + 8, le); break; }
            }
            if (!gpsOffset) { resolve(null); return; }
            const gpsEntries = dv.getUint16(gpsOffset, le);
            let latRef = "N", lngRef = "E", latVals = null, lngVals = null;
            const readRational = (off) => dv.getUint32(off, le) / dv.getUint32(off + 4, le);
            const readDMS = (valOff) => {
              const d = readRational(valOff);
              const m = readRational(valOff + 8);
              const s = readRational(valOff + 16);
              return d + m / 60 + s / 3600;
            };
            for (let i = 0; i < gpsEntries; i++) {
              const gTag = dv.getUint16(gpsOffset + 2 + i * 12, le);
              const gValOff = dv.getUint32(gpsOffset + 2 + i * 12 + 8, le);
              if (gTag === 1) latRef = String.fromCharCode(dv.getUint8(gpsOffset + 2 + i * 12 + 8));
              if (gTag === 2) latVals = gValOff;
              if (gTag === 3) lngRef = String.fromCharCode(dv.getUint8(gpsOffset + 2 + i * 12 + 8));
              if (gTag === 4) lngVals = gValOff;
            }
            if (latVals && lngVals) {
              let lat = readDMS(latVals);
              let lng = readDMS(lngVals);
              if (latRef === "S") lat = -lat;
              if (lngRef === "W") lng = -lng;
              resolve({ lat, lng });
              return;
            }
          }
          offset += 2 + view.getUint16(offset + 2);
        }
      } catch (e) { /* EXIF parse error */ }
      resolve(null);
    };
    reader.readAsArrayBuffer(file.slice(0, 128 * 1024)); // only first 128KB for EXIF
  });

  const handleRoutePhoto = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    for (const file of Array.from(files)) {
      // Try EXIF GPS first
      const gps = await extractGPS(file);
      const photoReader = new FileReader();
      photoReader.onload = (ev) => {
        const photo = { url: ev.target.result, name: file.name, ...(gps || {}) };
        setRoutePhotos(prev => [...prev, photo]);
        // Auto-add pin if GPS found
        if (gps) {
          setPins(prev => [...prev, { lat: gps.lat, lng: gps.lng, photo: ev.target.result, label: file.name }]);
        }
      };
      photoReader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  // Road-snapped polyline points from Directions API
  const [roadPoints, setRoadPoints] = useState([]);
  // Photo-to-pin linking mode: select a photo, then tap a pin on the map
  const [linkingPhotoIdx, setLinkingPhotoIdx] = useState(null);

  const linkPhotoToPin = (pinIdx) => {
    if (linkingPhotoIdx === null) return;
    const photo = routePhotos[linkingPhotoIdx];
    if (!photo) return;
    // Attach photo to the selected pin
    setPins(prev => prev.map((p, i) => i === pinIdx ? { ...p, photo: photo.url, label: photo.name } : p));
    // Update the photo with pin coordinates
    const pin = pins[pinIdx];
    if (pin) {
      setRoutePhotos(prev => prev.map((p, i) => i === linkingPhotoIdx ? { ...p, lat: pin.lat, lng: pin.lng, pinIdx } : p));
    }
    setLinkingPhotoIdx(null);
  };

  const difficulties = ["Easy", "Moderate", "Hard", "Expert"];
  const terrainOpts = ["Dirt/Gravel", "Rock/Slickrock", "Sand", "Mud", "Snow/Ice", "Mixed", "Paved"];
  const diffColor = (d) => d === "Expert" ? T.red : d === "Hard" ? T.copper : d === "Moderate" ? T.tertiary : T.green;

  const toggleTerrain = (t) => {
    setTerrains(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    onPublish({
      name, desc, difficulty, region, terrains, tags: tags.split(",").map(t => t.trim()).filter(Boolean), shareToFeed, pins, photos: routePhotos,
      ...(roadPoints.length > 0 ? { points: roadPoints } : {}),
      ...(isManual ? { distance: manualDistance, time: manualTime, elevGain: manualElevGain, maxElev: manualMaxElev, location: manualLocation } : {}),
    });
  };

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 300, background: T.darkBg, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <ChevronLeft size={22} color={T.white} strokeWidth={1.5} />
        </button>
        <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }}>{isEdit ? "Edit Route" : isManual ? "Add Route" : "Trip Details"}</span>
      </div>

      {/* Scrollable form */}
      <div className="th-scroll" style={{ flex: 1, overflowY: "auto", padding: "16px" }}>
        {/* Auto-collected stats (if from recording) */}
        {autoStats && (
          <div style={{ marginBottom: 20 }}>
            <span style={rdLabel}>RECORDED DATA</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              <div style={rdStatBox}>
                <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.red }}>{autoStats.distance}</span>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>MILES</span>
              </div>
              <div style={rdStatBox}>
                <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.white }}>{autoStats.duration}</span>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>TIME</span>
              </div>
              <div style={rdStatBox}>
                <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.green }}>+{autoStats.elevGain.toLocaleString()}</span>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>ELEV GAIN (FT)</span>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
              <div style={rdStatBox}>
                <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.copper }}>{autoStats.maxSpeed}</span>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>MAX SPEED (MPH)</span>
              </div>
              <div style={rdStatBox}>
                <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.white }}>{autoStats.elevation.toLocaleString()}</span>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>MAX ELEV (FT)</span>
              </div>
            </div>
          </div>
        )}

        {/* Route name */}
        <div style={{ marginBottom: 16 }}>
          <span style={rdLabel}>ROUTE NAME *</span>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Hell's Revenge Loop" style={rdInput} />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 16 }}>
          <span style={rdLabel}>DESCRIPTION</span>
          <textarea value={desc} onChange={e => setDesc(e.target.value)} placeholder="Describe the trail, conditions, highlights..." rows={3} style={{ ...rdInput, resize: "vertical", fontFamily: serif }} />
        </div>

        {/* Region / Location */}
        <div style={{ marginBottom: 16 }}>
          <span style={rdLabel}>{isManual ? "LOCATION / TRAILHEAD" : "REGION"}</span>
          <input value={isManual ? manualLocation : region} onChange={e => isManual ? setManualLocation(e.target.value) : setRegion(e.target.value)} placeholder="e.g. Moab, UT" style={rdInput} />
        </div>

        {/* Interactive map for pin placement */}
        {isManual && <RoutePinMap pins={pins} setPins={setPins} linkingPhotoIdx={linkingPhotoIdx} onLinkPin={linkPhotoToPin} onRoutePoints={setRoadPoints} />}

        {/* Difficulty */}
        <div style={{ marginBottom: 16 }}>
          <span style={rdLabel}>DIFFICULTY</span>
          <div style={{ display: "flex", gap: 8 }}>
            {difficulties.map(d => (
              <button key={d} onClick={() => setDifficulty(d)} style={{ flex: 1, padding: "10px 0", borderRadius: 8, background: difficulty === d ? `${diffColor(d)}25` : T.darkCard, border: `1px solid ${difficulty === d ? diffColor(d) : T.charcoal}`, cursor: "pointer" }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: difficulty === d ? diffColor(d) : T.tertiary, fontWeight: 600, letterSpacing: 0.5 }}>{d.toUpperCase()}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Terrain type — multi-select */}
        <div style={{ marginBottom: 16 }}>
          <span style={rdLabel}>TERRAIN (SELECT ALL THAT APPLY)</span>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {terrainOpts.map(t => {
              const sel = terrains.includes(t);
              return (
                <button key={t} onClick={() => toggleTerrain(t)} style={{ padding: "8px 14px", borderRadius: 20, background: sel ? `${T.copper}25` : T.darkCard, border: `1px solid ${sel ? T.copper : T.charcoal}`, cursor: "pointer" }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: sel ? T.copper : T.tertiary, fontWeight: 600, letterSpacing: 0.5 }}>{t.toUpperCase()}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Manual-only: distance, time, elevation */}
        {isManual && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <span style={rdLabel}>DISTANCE (MI)</span>
                <input value={manualDistance} onChange={e => setManualDistance(e.target.value)} placeholder="0.0" type="number" style={rdInput} />
              </div>
              <div>
                <span style={rdLabel}>EST. TIME</span>
                <input value={manualTime} onChange={e => setManualTime(e.target.value)} placeholder="e.g. 3H 15M" style={rdInput} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div>
                <span style={rdLabel}>ELEVATION GAIN (FT)</span>
                <input value={manualElevGain} onChange={e => setManualElevGain(e.target.value)} placeholder="0" type="number" style={rdInput} />
              </div>
              <div>
                <span style={rdLabel}>MAX ELEVATION (FT)</span>
                <input value={manualMaxElev} onChange={e => setManualMaxElev(e.target.value)} placeholder="0" type="number" style={rdInput} />
              </div>
            </div>
          </>
        )}

        {/* Photos */}
        <div style={{ marginBottom: 16 }}>
          <span style={rdLabel}>PHOTOS</span>
          <input ref={routePhotoRef} type="file" accept="image/*" multiple onChange={handleRoutePhoto} style={{ display: "none" }} />
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
            {routePhotos.map((p, i) => (
              <div key={i} style={{ position: "relative", width: 72, height: 72, borderRadius: 8, overflow: "hidden", outline: linkingPhotoIdx === i ? `2px solid ${T.copper}` : "none", outlineOffset: 2 }}>
                <img src={p.url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                {p.lat ? (
                  <div style={{ position: "absolute", bottom: 2, left: 2, background: `${T.darkBg}CC`, borderRadius: 4, padding: "1px 4px", display: "flex", alignItems: "center", gap: 2 }}>
                    <MapPin size={8} color={T.green} />
                    <span style={{ fontFamily: sans, fontSize: 7, color: T.green }}>PINNED</span>
                  </div>
                ) : pins.length > 0 ? (
                  <button onClick={() => setLinkingPhotoIdx(linkingPhotoIdx === i ? null : i)} style={{ position: "absolute", bottom: 2, left: 2, background: linkingPhotoIdx === i ? T.copper : `${T.copper}DD`, borderRadius: 4, padding: "2px 5px", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 2 }}>
                    <MapPin size={8} color={T.white} />
                    <span style={{ fontFamily: sans, fontSize: 7, color: T.white }}>{linkingPhotoIdx === i ? "TAP PIN" : "LINK PIN"}</span>
                  </button>
                ) : null}
                <button onClick={() => setRoutePhotos(prev => prev.filter((_, idx) => idx !== i))} style={{ position: "absolute", top: 2, right: 2, width: 18, height: 18, borderRadius: "50%", background: `${T.darkBg}CC`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <X size={10} color={T.white} />
                </button>
              </div>
            ))}
            <button onClick={() => routePhotoRef.current && routePhotoRef.current.click()} style={{ width: 72, height: 72, borderRadius: 8, background: T.darkCard, border: `1px dashed ${T.charcoal}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 }}>
              <Camera size={18} color={T.tertiary} />
              <span style={{ fontFamily: sans, fontSize: 8, color: T.tertiary, letterSpacing: 0.5 }}>ADD</span>
            </button>
          </div>
          {linkingPhotoIdx !== null && (
            <div style={{ background: `${T.copper}15`, border: `1px solid ${T.copper}30`, borderRadius: 8, padding: "8px 12px", display: "flex", alignItems: "center", gap: 8 }}>
              <MapPin size={14} color={T.copper} />
              <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, flex: 1 }}>Tap a pin on the map to link this photo</span>
              <button onClick={() => setLinkingPhotoIdx(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                <X size={14} color={T.tertiary} />
              </button>
            </div>
          )}
          {routePhotos.length > 0 && pins.length > 0 && linkingPhotoIdx === null && routePhotos.some(p => !p.lat) && (
            <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, display: "block" }}>Tap "Link Pin" on a photo, then tap a map pin to associate them</span>
          )}
        </div>

        {/* Tags */}
        <div style={{ marginBottom: 16 }}>
          <span style={rdLabel}>TAGS (COMMA SEPARATED)</span>
          <input value={tags} onChange={e => setTags(e.target.value)} placeholder="e.g. scenic, technical, family-friendly" style={rdInput} />
        </div>

        {/* Share to feed toggle */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `1px solid ${T.charcoal}`, marginBottom: 16 }}>
          <div>
            <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>Share to Feed</span>
            <span style={{ fontFamily: serif, fontSize: 12, color: T.tertiary }}>Post this route to the community feed</span>
          </div>
          <button onClick={() => setShareToFeed(!shareToFeed)} style={{ width: 48, height: 28, borderRadius: 14, background: shareToFeed ? T.green : T.charcoal, border: `1px solid ${shareToFeed ? T.green : T.tertiary}40`, cursor: "pointer", position: "relative", transition: "background 0.2s" }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: shareToFeed ? 23 : 2, transition: "left 0.2s" }} />
          </button>
        </div>
      </div>

      {/* Submit */}
      <div style={{ padding: "12px 16px", background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
        <button onClick={handleSubmit} disabled={!name.trim()} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 8, background: name.trim() ? T.green : T.charcoal, border: "none", cursor: name.trim() ? "pointer" : "default", opacity: name.trim() ? 1 : 0.5 }}>
          <CheckCircle size={16} color={T.white} />
          <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>{isEdit ? "SAVE CHANGES" : isManual ? "ADD ROUTE" : "PUBLISH ROUTE"}</span>
        </button>
      </div>
    </div>
  );
}

function RoutesScreen({ onRecordRoute, onManualEntry, userRoutes, onUpdateRoute, savedRoutes, onSaveRoute, onUnsaveRoute, onOpenDM, onAddFeedPost, onStartNav }) {
  const seedRoutes = [
    { name: "The Timberline Traverse", difficulty: "Hard", distance: "64.2 MI", time: "5H 30M", elevation: "+4,200 FT", rating: 4.8, reviews: 142, desc: "Scenic high-altitude crawl across the eastern slopes of Mt. Hood.", location: "Mt. Hood, OR", terrains: ["Dirt/Gravel", "Rock/Slickrock"], tags: ["scenic", "challenging"] },
    { name: "Hell's Revenge Loop", difficulty: "Expert", distance: "6.5 MI", time: "2H 45M", elevation: "+1,800 FT", rating: 4.9, reviews: 312, desc: "Iconic slickrock trail in Moab with steep climbs and ledges.", location: "Moab, UT", terrains: ["Rock/Slickrock"], tags: ["technical", "iconic"] },
    { name: "Eagle Rim Loop", difficulty: "Moderate", distance: "42.5 MI", time: "3H 15M", elevation: "+2,100 FT", rating: 4.6, reviews: 89, desc: "Desert canyon walls and sweeping ridgeline views.", location: "Sedona, AZ", terrains: ["Dirt/Gravel", "Sand"], tags: ["scenic", "family-friendly"] },
    { name: "Shadow Peak Traverse", difficulty: "Hard", distance: "38.0 MI", time: "4H 00M", elevation: "+3,600 FT", rating: 4.7, reviews: 67, desc: "Technical grade 7 route through volcanic terrain.", location: "Lassen, CA", terrains: ["Rock/Slickrock", "Mixed"], tags: ["technical", "volcanic"] },
  ];
  const routes = [...(userRoutes || []), ...seedRoutes];
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [routeTab, setRouteTab] = useState("all"); // "all" or "saved"
  const [routeShareMenu, setRouteShareMenu] = useState(null);
  const [editingRoute, setEditingRoute] = useState(null); // route object being edited

  const diffColor = (d) => d === "Expert" ? T.red : d === "Hard" ? T.copper : d === "Moderate" ? T.tertiary : T.green;
  const displayRoutes = routeTab === "saved" ? (savedRoutes || []) : routes;

  return (
    <div style={{ padding: "0 0 16px" }}>
      <div style={{ padding: "16px", display: "flex", gap: 8 }}>
        <div style={{ flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px" }}>
          <Search size={16} color={T.tertiary} />
          <span style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, marginLeft: 8 }}>Search trails, regions...</span>
        </div>
        <button onClick={onManualEntry} style={{ display: "flex", alignItems: "center", gap: 5, padding: "10px 12px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer" }}>
          <Plus size={14} color={T.copper} />
          <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 700, letterSpacing: 0.5 }}>ADD</span>
        </button>
        <button onClick={onRecordRoute} style={{ display: "flex", alignItems: "center", gap: 6, padding: "10px 14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }}>
          <Radio size={14} color={T.white} />
          <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>RECORD</span>
        </button>
      </div>

      {/* Featured Route */}
      <div style={{ margin: "0 16px 16px", borderRadius: 12, overflow: "hidden", background: T.charcoal, position: "relative", height: 200, display: "flex", alignItems: "flex-end" }}>
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(180deg, ${T.charcoal}00 40%, ${T.charcoal} 100%)` }} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Mountain size={80} color={T.tertiary} strokeWidth={0.3} style={{ opacity: 0.15 }} />
        </div>
        <div style={{ position: "relative", padding: 16, width: "100%", boxSizing: "border-box" }}>
          <span style={{ fontFamily: sans, fontSize: 10, color: T.red, letterSpacing: 2, fontWeight: 600 }}>FEATURED ROUTE</span>
          <h2 style={{ fontFamily: sans, fontSize: 22, color: T.white, margin: "4px 0 8px", fontWeight: 700 }}>The Timberline Traverse</h2>
          <div style={{ display: "flex", gap: 16 }}>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.copper }}>64.2 MI</span>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.copper }}>5H 30M</span>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.copper }}>+4,200 FT</span>
          </div>
        </div>
      </div>

      {/* Tabs: All Routes / Saved */}
      <div style={{ display: "flex", gap: 0, margin: "0 16px 12px", background: T.darkCard, borderRadius: 8, overflow: "hidden" }}>
        <button onClick={() => { setRouteTab("all"); setExpandedRoute(null); }} style={{ flex: 1, padding: "10px 0", background: routeTab === "all" ? T.charcoal : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderBottom: routeTab === "all" ? `2px solid ${T.copper}` : "2px solid transparent" }}>
          <Map size={13} color={routeTab === "all" ? T.copper : T.tertiary} />
          <span style={{ fontFamily: sans, fontSize: 11, color: routeTab === "all" ? T.white : T.tertiary, fontWeight: 600, letterSpacing: 0.5 }}>ALL ROUTES</span>
        </button>
        <button onClick={() => { setRouteTab("saved"); setExpandedRoute(null); }} style={{ flex: 1, padding: "10px 0", background: routeTab === "saved" ? T.charcoal : "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderBottom: routeTab === "saved" ? `2px solid ${T.copper}` : "2px solid transparent", position: "relative" }}>
          <Bookmark size={13} color={routeTab === "saved" ? T.copper : T.tertiary} />
          <span style={{ fontFamily: sans, fontSize: 11, color: routeTab === "saved" ? T.white : T.tertiary, fontWeight: 600, letterSpacing: 0.5 }}>SAVED</span>
          {savedRoutes && savedRoutes.length > 0 && (
            <span style={{ position: "absolute", top: 5, right: "18%", width: 16, height: 16, borderRadius: "50%", background: T.red, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: sans, fontSize: 9, color: T.white, fontWeight: 700 }}>{savedRoutes.length}</span>
            </span>
          )}
        </button>
      </div>

      {/* Route List */}
      <div style={{ padding: "0 16px" }}>
        {routeTab === "saved" && (!savedRoutes || savedRoutes.length === 0) && (
          <div style={{ textAlign: "center", padding: "40px 20px" }}>
            <Bookmark size={36} color={T.tertiary} strokeWidth={1} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 6px" }}>No saved routes yet</p>
            <p style={{ fontFamily: sans, fontSize: 11, color: T.tertiary, opacity: 0.6 }}>Save routes from the feed or routes list to build your bucket list</p>
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {displayRoutes.map((r, i) => {
            const isExp = expandedRoute === i;
            return (
            <div key={i} onClick={() => setExpandedRoute(isExp ? null : i)} style={{ ...cardStyle, cursor: "pointer", overflow: "hidden" }}>
              <div style={{ padding: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <h3 style={{ fontFamily: sans, fontSize: 16, color: T.white, margin: 0, fontWeight: 600, flex: 1 }}>{r.name}</h3>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontFamily: sans, fontSize: 10, color: diffColor(r.difficulty), background: `${diffColor(r.difficulty)}20`, padding: "3px 8px", borderRadius: 4, letterSpacing: 0.5 }}>{r.difficulty.toUpperCase()}</span>
                    <ChevronDown size={14} color={T.tertiary} style={{ transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                  </div>
                </div>
                <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 12px", lineHeight: 1.5 }}>{r.desc}</p>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", gap: 16 }}>
                    <div>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>DISTANCE</span>
                      <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600 }}>{r.distance}</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>EST. TIME</span>
                      <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600 }}>{r.time}</span>
                    </div>
                    <div>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>ELEVATION</span>
                      <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600 }}>{r.elevation}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    {r.rating ? (
                      <>
                        <Star size={12} color={T.copper} fill={T.copper} />
                        <span style={{ fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }}>{r.rating}</span>
                        <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>({r.reviews})</span>
                      </>
                    ) : (
                      <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, fontStyle: "italic" }}>New</span>
                    )}
                  </div>
                </div>
              </div>
              {/* Expanded details */}
              {isExp && (() => {
                const rPins = r.pins || [];
                const rPhotos = r.photos || [];
                const rPoints = r.points || [];
                const hasMap = rPins.length > 0 || rPoints.length > 0;
                return (
                <div style={{ borderTop: `1px solid ${T.charcoal}`, padding: 16 }}>
                  {/* Map preview */}
                  {hasMap && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>ROUTE MAP</span>
                      <div style={{ width: "100%", height: 180, borderRadius: 10, overflow: "hidden", position: "relative", background: T.charcoal }}>
                        <RouteMapPreview pins={rPins} points={rPoints} photos={rPhotos} />
                      </div>
                    </div>
                  )}
                  {/* Location */}
                  {r.location && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <MapPin size={13} color={T.copper} />
                      <span style={{ fontFamily: serif, fontSize: 13, color: T.warmStone }}>{r.location}</span>
                    </div>
                  )}
                  {/* Terrain tags */}
                  {r.terrains && r.terrains.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>TERRAIN</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {r.terrains.map((t, ti) => (
                          <span key={ti} style={{ fontFamily: sans, fontSize: 10, color: T.copper, background: `${T.copper}18`, padding: "4px 10px", borderRadius: 12, letterSpacing: 0.5 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Tags */}
                  {r.tags && r.tags.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>TAGS</span>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {r.tags.map((t, ti) => (
                          <span key={ti} style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, background: T.charcoal, padding: "4px 10px", borderRadius: 12, letterSpacing: 0.5 }}>{t}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Photos */}
                  {rPhotos.length > 0 && (
                    <div style={{ marginBottom: 12 }}>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, fontWeight: 600, display: "block", marginBottom: 6 }}>PHOTOS</span>
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                        {rPhotos.map((p, pi) => (
                          <img key={pi} src={p.url || p} alt="" style={{ width: 80, height: 80, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {/* Author / saved-from info */}
                  {(r.author || r.savedFrom) && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 8, borderTop: `1px solid ${T.charcoal}` }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white }}>{(r.author || r.savedFrom)[0]}</span>
                      </div>
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600 }}>@{r.author || r.savedFrom}</span>
                      {r.savedAt && <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }}>Saved {formatPostTime(r.savedAt)}</span>}
                      {!r.savedAt && r.createdAt && <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, marginLeft: "auto" }}>{formatPostTime(r.createdAt)}</span>}
                    </div>
                  )}
                  {/* Route action buttons */}
                  {(() => {
                    const startPin = rPins.length > 0 ? rPins[0] : null;
                    const endPin = rPins.length > 1 ? rPins[rPins.length - 1] : null;
                    const isSaved = savedRoutes && savedRoutes.some(sr => sr.id === r.id || sr.name === r.name);
                    const showMenu = routeShareMenu === (r.id || i);
                    return (
                      <div style={{ position: "relative" }}>
                        <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                          <button onClick={(e) => { e.stopPropagation(); if (startPin) { window.open(`https://www.google.com/maps/dir/?api=1&destination=${startPin.lat},${startPin.lng}&travelmode=driving`, "_blank"); } }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.green, border: "none", cursor: startPin ? "pointer" : "default", opacity: startPin ? 1 : 0.4 }}>
                            <MapPin size={13} color={T.white} />
                            <span style={{ fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }}>DIRECTIONS</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); if (startPin && endPin && onStartNav) { onStartNav({ name: r.name, pins: rPins, points: rPoints, distance: r.distance, time: r.time, elevation: r.elevation }); } }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.copper, border: "none", cursor: startPin && endPin ? "pointer" : "default", opacity: startPin && endPin ? 1 : 0.4 }}>
                            <Navigation size={13} color={T.white} />
                            <span style={{ fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }}>START ROUTE</span>
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); setRouteShareMenu(showMenu ? null : (r.id || i)); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "10px 6px", borderRadius: 8, background: T.charcoal, border: `1px solid ${T.tertiary}30`, cursor: "pointer" }}>
                            <Share2 size={13} color={T.white} />
                            <span style={{ fontFamily: sans, fontSize: 10, color: T.white, fontWeight: 600, letterSpacing: 0.3 }}>SHARE / SAVE</span>
                          </button>
                          {r.author === "KyleLPO" && (
                            <button onClick={(e) => { e.stopPropagation(); setEditingRoute(r); }} style={{ padding: "10px 12px", borderRadius: 8, background: T.charcoal, border: `1px solid ${T.tertiary}30`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                              <Edit3 size={13} color={T.copper} />
                            </button>
                          )}
                        </div>
                        {/* Share/Save dropdown */}
                        {showMenu && (
                          <div style={{ position: "absolute", bottom: "100%", right: 0, marginBottom: 6, background: T.darkCard, border: `1px solid ${T.charcoal}`, borderRadius: 10, padding: "6px 0", minWidth: 180, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,0.5)" }}>
                            <button onClick={(e) => { e.stopPropagation(); onOpenDM && onOpenDM(null, null, { type: "route", title: r.name, distance: r.distance, duration: r.time }); setRouteShareMenu(null); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }}>
                              <Send size={14} color={T.copper} />
                              <span style={{ fontFamily: sans, fontSize: 12, color: T.white }}>Send in DM</span>
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); if (onAddFeedPost) { onAddFeedPost({ id: "shared_route_" + Date.now(), type: "ROUTES", user: "KyleLPO", initial: "K", time: Date.now(), title: r.name, body: r.desc || null, distance: r.distance, duration: r.time, badge: null, verified: 0, likes: 0, comments: 0, difficulty: r.difficulty, elevation: r.elevation || "—", location: r.location || "", terrains: r.terrains || [], tags: r.tags || [], photos: rPhotos, pins: rPins }); } setRouteShareMenu(null); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }}>
                              <Share2 size={14} color={T.copper} />
                              <span style={{ fontFamily: sans, fontSize: 12, color: T.white }}>Share to Feed</span>
                            </button>
                            <div style={{ height: 1, background: T.charcoal, margin: "2px 10px" }} />
                            <button onClick={(e) => { e.stopPropagation(); if (isSaved) { onUnsaveRoute && onUnsaveRoute(r.id || r.name); } else { onSaveRoute && onSaveRoute({ id: r.id || "seed_" + i, name: r.name, desc: r.desc || "", difficulty: r.difficulty, distance: r.distance, time: r.time, elevation: r.elevation || "—", location: r.location || "", terrains: r.terrains || [], tags: r.tags || [], pins: rPins, photos: rPhotos, rating: r.rating, reviews: r.reviews, savedFrom: r.author || "Community", savedAt: Date.now() }); } setRouteShareMenu(null); }} style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "10px 14px", background: "none", border: "none", cursor: "pointer" }}>
                              <Bookmark size={14} color={isSaved ? T.red : T.copper} fill={isSaved ? T.red : "none"} />
                              <span style={{ fontFamily: sans, fontSize: 12, color: isSaved ? T.red : T.white }}>{isSaved ? "Unsave Route" : "Save for Later"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
                );
              })()}
            </div>
            );
          })}
        </div>
      </div>
      {/* Edit Route overlay */}
      {editingRoute && (
        <RouteDetailsForm
          isManual
          isEdit
          initialData={editingRoute}
          initialPhotos={editingRoute.photos || []}
          initialPins={editingRoute.pins || []}
          onBack={() => setEditingRoute(null)}
          onPublish={(updatedData) => {
            if (onUpdateRoute) {
              onUpdateRoute(editingRoute.id, {
                name: updatedData.name,
                desc: updatedData.desc,
                difficulty: updatedData.difficulty,
                location: updatedData.location || updatedData.region || editingRoute.location,
                terrains: updatedData.terrains,
                tags: updatedData.tags,
                pins: updatedData.pins,
                photos: updatedData.photos,
                ...(updatedData.distance ? { distance: updatedData.distance + " MI" } : {}),
                ...(updatedData.time ? { time: updatedData.time } : {}),
                ...(updatedData.elevGain ? { elevation: "+" + Number(updatedData.elevGain).toLocaleString() + " FT" } : {}),
                editedAt: Date.now(),
              });
            }
            setEditingRoute(null);
          }}
        />
      )}
    </div>
  );
}

/* ─── BUILDS / PROFILE SCREEN ─── */
function BuildsScreen({ onViewUser, userBuilds }) {
  const [filter, setFilter] = useState("all"); // "all" | "mine" | "following"
  const [search, setSearch] = useState("");
  const [expandedBuild, setExpandedBuild] = useState(null);
  const [carouselImages, setCarouselImages] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [likedBuilds, setLikedBuilds] = useState({});
  const [likeBonuses, setLikeBonuses] = useState({});

  const toggleLikeBuild = (id) => {
    const wasLiked = !!likedBuilds[id];
    setLikedBuilds(prev => ({ ...prev, [id]: !wasLiked }));
    setLikeBonuses(prev => ({ ...prev, [id]: wasLiked ? (prev[id] || 0) - 1 : (prev[id] || 0) + 1 }));
  };

  const getBuildLikes = (b) => b.likes + (likeBonuses[b.id] || 0);

  const collectBuildImagesGallery = (bd) => {
    const imgs = [];
    if (bd.mainPhotos) bd.mainPhotos.forEach(p => imgs.push(p.url));
    [bd.suspension, bd.tires, bd.wheels, bd.bumpers, bd.armor, bd.lighting, bd.rack, bd.winch, bd.otherMods].forEach(mod => {
      if (mod && mod.photo) mod.photo.forEach(p => imgs.push(p.url));
    });
    if (bd.camperPhoto) bd.camperPhoto.forEach(p => imgs.push(p.url));
    return imgs;
  };

  const openGalleryCarousel = (build, startIdx) => {
    const imgs = [];
    if (build.buildData) {
      imgs.push(...collectBuildImagesGallery(build.buildData));
    } else if (build.image) {
      imgs.push(build.image);
    }
    if (imgs.length > 0) {
      setCarouselImages(imgs);
      setCarouselIndex(startIdx || 0);
    }
  };

  const defaultBuilds = [
    { id: 1, name: "THE HIGHLANDER", owner: "Kyle Morrison", handle: "@KyleLPO", initial: "K", year: 2022, make: "Toyota", model: "Tundra", tags: ["V8 OVERLAND", "CLASS 4 READY"], suspension: "Icon Stage 3, 2.5\" lift", tires: "BFG KO2 35x12.5R17", bumpers: "CBI front & rear", miles: "2,482", elevation: "84K ft", routes: 34, hasCamper: true, camperMake: "Four Wheel Campers", camperModel: "Fleet Flatbed", isMine: true, isFollowing: true, likes: 312 },
    { id: 2, name: "PROJECT VULCAN", owner: "Overland Expert", handle: "@Overland_Expert", initial: "O", year: 2022, make: "Toyota", model: "Tacoma", tags: ["TACOMA 22", "35\" TIRES"], suspension: "Fox 2.5 Factory Race Series", tires: "Toyo Open Country M/T 35\"", bumpers: "Pelfreybilt front bumper", miles: "3,800", elevation: "112K ft", routes: 56, hasCamper: false, isMine: false, isFollowing: true, likes: 540 },
    { id: 3, name: "DESERT HAWK", owner: "Kyle Morrison", handle: "@KyleLPO", initial: "K", year: 2019, make: "Jeep", model: "Gladiator", tags: ["TRAIL RATED", "EXPO READY"], suspension: "AEV 3.5\" DualSport", tires: "Falken Wildpeak A/T3W 37\"", bumpers: "AEV front & rear", miles: "1,120", elevation: "42K ft", routes: 18, hasCamper: false, isMine: true, isFollowing: true, likes: 189 },
    { id: 4, name: "IRON MAIDEN", owner: "DesertRat 4x4", handle: "@DesertRat_4x4", initial: "D", year: 2021, make: "Ford", model: "Bronco", tags: ["SASQUATCH", "FULL ARMOR"], suspension: "Bilstein 5100 Series, 2\" lift", tires: "Nitto Ridge Grappler 37\"", bumpers: "ARB Hoopless front", miles: "1,950", elevation: "56K ft", routes: 28, hasCamper: false, isMine: false, isFollowing: true, likes: 273 },
    { id: 5, name: "GHOST RUNNER", owner: "Sierra Tactical", handle: "@Sierra_Tactical", initial: "S", year: 2023, make: "Lexus", model: "GX 550", tags: ["LUXURY OVERLAND", "AIR SUSPENSION"], suspension: "Ironman Foam Cell Pro, 2\" lift", tires: "BFG Trail Terrain 33\"", bumpers: "RCI Rock Armor", miles: "980", elevation: "38K ft", routes: 12, hasCamper: true, camperMake: "Go Fast Campers", camperModel: "V2", isMine: false, isFollowing: false, likes: 421 },
    { id: 6, name: "MUD WITCH", owner: "TrailBoss_88", handle: "@TrailBoss_88", initial: "T", year: 2020, make: "Toyota", model: "4Runner TRD Pro", tags: ["CRAWL RIG", "LOCKED"], suspension: "King 2.5 Extended Travel", tires: "Mickey Thompson Baja Boss 35\"", bumpers: "C4 Fabrication Lo-Pro", miles: "4,200", elevation: "132K ft", routes: 72, hasCamper: false, isMine: false, isFollowing: false, likes: 687 },
    { id: 7, name: "RIDGE REAPER", owner: "Nomad Queen", handle: "@Nomad_Queen", initial: "N", year: 2024, make: "Land Rover", model: "Defender 110", tags: ["EXPEDITION", "ROOF TENT"], suspension: "Old Man Emu BP-51, 2\" lift", tires: "Cooper Discoverer STT Pro 33\"", bumpers: "Terrafirma front winch bumper", miles: "1,640", elevation: "68K ft", routes: 24, hasCamper: true, camperMake: "Alu-Cab", camperModel: "Canopy Camper", isMine: false, isFollowing: false, likes: 358 },
    { id: 8, name: "BLACK MAMBA", owner: "Peak Finder", handle: "@Peak_Finder", initial: "P", year: 2023, make: "Ram", model: "2500 Power Wagon", tags: ["HEAVY DUTY", "WINCH READY"], suspension: "Carli Backcountry 2.0, 3\" lift", tires: "Toyo Open Country R/T 37\"", bumpers: "Expedition One front & rear", miles: "2,870", elevation: "94K ft", routes: 41, hasCamper: true, camperMake: "Bundutop", camperModel: "Explorer", isMine: false, isFollowing: false, likes: 512 },
  ];

  const mappedUserBuilds = (userBuilds || []).map((b, i) => ({
    id: 100 + i,
    name: b.name || "UNNAMED BUILD",
    owner: "Kyle Morrison",
    handle: "@KyleLPO",
    initial: "K",
    year: parseInt(b.year) || 2024,
    make: b.make || "",
    model: b.model || "",
    tags: b.tags || [],
    suspension: (b.buildData && b.buildData.suspension && b.buildData.suspension.value) || "",
    tires: (b.buildData && b.buildData.tires && b.buildData.tires.value) || "",
    bumpers: (b.buildData && b.buildData.bumpers && b.buildData.bumpers.value) || "",
    miles: "0",
    elevation: "0 ft",
    routes: 0,
    hasCamper: !!(b.camperMake || b.camperModel),
    camperMake: b.camperMake || "",
    camperModel: b.camperModel || "",
    isMine: true,
    isFollowing: true,
    likes: 0,
    image: b.heroImg || null,
    buildData: b.buildData || null,
  }));

  const allBuilds = [...defaultBuilds, ...mappedUserBuilds];

  const filters = [
    { key: "all", label: "ALL BUILDS", icon: Globe },
    { key: "mine", label: "MY BUILDS", icon: Wrench },
    { key: "following", label: "FOLLOWING", icon: Users },
  ];

  const filtered = allBuilds.filter(b => {
    if (filter === "mine" && !b.isMine) return false;
    if (filter === "following" && !b.isFollowing) return false;
    if (search) {
      const q = search.toLowerCase();
      return b.name.toLowerCase().includes(q) || b.owner.toLowerCase().includes(q) || b.make.toLowerCase().includes(q) || b.model.toLowerCase().includes(q) || b.tags.some(t => t.toLowerCase().includes(q));
    }
    return true;
  }).sort((a, b) => getBuildLikes(b) - getBuildLikes(a));

  const gradients = [
    `linear-gradient(135deg, ${T.charcoal} 0%, ${T.red}20 100%)`,
    `linear-gradient(135deg, ${T.charcoal} 0%, ${T.copper}20 100%)`,
    `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}25 100%)`,
    `linear-gradient(135deg, ${T.charcoal} 0%, ${T.green}20 100%)`,
  ];

  return (
    <div style={{ padding: "0 0 16px" }}>
      {/* Image Carousel */}
      {carouselImages && (
        <ImageCarousel images={carouselImages} startIndex={carouselIndex} onClose={() => setCarouselImages(null)} />
      )}
      {/* Header */}
      <div style={{ padding: "16px 16px 0" }}>
        <h2 style={{ fontFamily: sans, fontSize: 22, color: T.white, margin: "0 0 4px", fontWeight: 700 }}>Build Gallery</h2>
        <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 16px" }}>Explore rigs from the Trailhead community</p>

        {/* Search Bar */}
        <div style={{ position: "relative", marginBottom: 14 }}>
          <Search size={16} color={T.tertiary} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name, make, model, owner..."
            style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px 12px 38px", borderRadius: 10, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 4 }}>
              <X size={14} color={T.tertiary} />
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          {filters.map(f => {
            const active = filter === f.key;
            const Icon = f.icon;
            return (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 8px", borderRadius: 8, background: active ? `${T.red}18` : T.darkCard, border: active ? `1px solid ${T.red}40` : `1px solid transparent`, cursor: "pointer" }}>
                <Icon size={13} color={active ? T.red : T.tertiary} />
                <span style={{ fontFamily: sans, fontSize: 10, color: active ? T.red : T.tertiary, letterSpacing: 1, fontWeight: 600 }}>{f.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Results count */}
      <div style={{ padding: "0 16px", marginBottom: 12 }}>
        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5 }}>{filtered.length} BUILD{filtered.length !== 1 ? "S" : ""} FOUND</span>
      </div>

      {/* Build Grid */}
      {filtered.length === 0 ? (
        <div style={{ padding: "40px 16px", textAlign: "center" }}>
          <Wrench size={40} color={T.tertiary} strokeWidth={0.8} style={{ opacity: 0.3, marginBottom: 12 }} />
          <p style={{ fontFamily: sans, fontSize: 14, color: T.tertiary, margin: 0 }}>No builds match your search</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "0 16px" }}>
          {filtered.map((b, i) => (
            <div key={b.id} style={{ ...cardStyle, overflow: "hidden" }}>
              {/* Build Header with gradient */}
              <div onClick={() => setExpandedBuild(expandedBuild === b.id ? null : b.id)} style={{ cursor: "pointer" }}>
                <div style={{ height: 120, background: b.image ? "none" : gradients[i % gradients.length], position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
                  {b.image ? (
                    <>
                      <img src={b.image} alt="" onClick={(e) => { e.stopPropagation(); openGalleryCarousel(b, 0); }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 20%, rgba(0,0,0,0.75))" }} />
                    </>
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Wrench size={60} color={T.tertiary} strokeWidth={0.2} style={{ opacity: 0.06 }} />
                    </div>
                  )}
                  {/* Owner badge */}
                  <div style={{ position: "absolute", top: 10, left: 10, display: "flex", alignItems: "center", gap: 6, background: `${T.darkBg}CC`, padding: "5px 10px 5px 5px", borderRadius: 20 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontFamily: sans, fontSize: 9, fontWeight: 700, color: T.white }}>{b.initial}</span>
                    </div>
                    <span style={{ fontFamily: sans, fontSize: 10, color: T.white }}>{b.owner}</span>
                  </div>
                  {/* Likes */}
                  <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 4, background: `${T.darkBg}CC`, padding: "5px 10px", borderRadius: 12 }}>
                    <Heart size={11} color={T.red} fill={likedBuilds[b.id] ? T.red : "none"} />
                    <span style={{ fontFamily: sans, fontSize: 10, color: T.white }}>{getBuildLikes(b)}</span>
                  </div>
                  {/* Camper badge */}
                  {b.hasCamper && (
                    <div style={{ position: "absolute", top: 40, right: 10, display: "flex", alignItems: "center", gap: 4, background: `${T.copper}30`, padding: "4px 8px", borderRadius: 8 }}>
                      <Home size={10} color={T.copper} />
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 0.5 }}>CAMPER</span>
                    </div>
                  )}
                  <div style={{ position: "relative", padding: "0 12px 10px" }}>
                    <div style={{ display: "flex", gap: 5, marginBottom: 4 }}>
                      {b.tags.map((tag, j) => (
                        <span key={j} style={{ fontFamily: sans, fontSize: 8, color: T.warmBg, background: "#3D3D3A", padding: "3px 6px", borderRadius: 3, letterSpacing: 0.8 }}>{tag}</span>
                      ))}
                    </div>
                    <h3 style={{ fontFamily: sans, fontSize: 22, color: T.warmBg, margin: 0, fontWeight: 700, letterSpacing: 1 }}>{b.name}</h3>
                    <span style={{ fontFamily: serif, fontSize: 12, color: T.tertiary }}>{b.year} {b.make} {b.model}</span>
                  </div>
                </div>

                {/* Stats row */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${T.charcoal}` }}>
                  <div style={{ padding: "10px 12px", textAlign: "center", borderRight: `1px solid ${T.charcoal}` }}>
                    <span style={{ fontFamily: sans, fontSize: 8, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 1 }}>TRAIL MILES</span>
                    <span style={{ fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }}>{b.miles}</span>
                  </div>
                  <div style={{ padding: "10px 12px", textAlign: "center", borderRight: `1px solid ${T.charcoal}` }}>
                    <span style={{ fontFamily: sans, fontSize: 8, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 1 }}>ELEVATION</span>
                    <span style={{ fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }}>{b.elevation}</span>
                  </div>
                  <div style={{ padding: "10px 12px", textAlign: "center" }}>
                    <span style={{ fontFamily: sans, fontSize: 8, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 1 }}>ROUTES</span>
                    <span style={{ fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }}>{b.routes}</span>
                  </div>
                </div>
              </div>

              {/* Expanded Detail */}
              {expandedBuild === b.id && (() => {
                const bd = b.buildData;
                const specRow = (label, val, mod) => {
                  const text = mod ? (mod.value || "") : (val || "");
                  if (!text) return null;
                  return (
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.charcoal}20` }}>
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary, flexShrink: 0, minWidth: 70 }}>{label}</span>
                      <div style={{ flex: 1, textAlign: "right" }}>
                        <span style={{ fontFamily: serif, fontSize: 12, color: T.white }}>{text}</span>
                        {mod && mod.photo && mod.photo.length > 0 && (
                          <img src={mod.photo[0].url} alt="" onClick={(e) => { e.stopPropagation(); openGalleryCarousel(b, 0); }} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", marginLeft: 8, verticalAlign: "middle", cursor: "pointer" }} />
                        )}
                        {mod && mod.link && (
                          <div style={{ marginTop: 2 }}>
                            <a href={ensureUrl(mod.link)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><ExternalLink size={9} /> View Product</a>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                };
                return (
                <div style={{ borderTop: `1px solid ${T.charcoal}`, padding: "14px 14px 16px" }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 10 }}>BUILD SPECS</span>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    {bd ? (
                      <>
                        {specRow("Suspension", null, bd.suspension)}
                        {specRow("Tires", null, bd.tires)}
                        {specRow("Wheels", null, bd.wheels)}
                        {specRow("Bumpers", null, bd.bumpers)}
                        {specRow("Armor", null, bd.armor)}
                        {specRow("Lighting", null, bd.lighting)}
                        {specRow("Rack/Storage", null, bd.rack)}
                        {specRow("Winch", null, bd.winch)}
                        {specRow("Other Mods", null, bd.otherMods)}
                      </>
                    ) : (
                      <>
                        {specRow("Suspension", b.suspension)}
                        {specRow("Tires", b.tires)}
                        {specRow("Bumpers", b.bumpers)}
                      </>
                    )}
                  </div>
                  {b.hasCamper && (
                    <>
                      <div style={{ height: 1, background: T.charcoal, margin: "12px 0" }} />
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Home size={12} color={T.copper} />
                        <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }}>CAMPER</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
                        <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>Setup</span>
                        <span style={{ fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }}>{b.camperMake} {b.camperModel}</span>
                      </div>
                      {bd && bd.camperPhoto && bd.camperPhoto.length > 0 && (
                        <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                          {bd.camperPhoto.map((p, pi) => (
                            <img key={pi} src={p.url} alt="" onClick={(e) => { e.stopPropagation(); openGalleryCarousel(b, 0); }} style={{ width: 56, height: 56, borderRadius: 6, objectFit: "cover", cursor: "pointer" }} />
                          ))}
                        </div>
                      )}
                      {bd && bd.camperLink && (
                        <div style={{ marginTop: 6 }}>
                          <a href={ensureUrl(bd.camperLink)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><ExternalLink size={9} /> View Product</a>
                        </div>
                      )}
                    </>
                  )}
                  {/* Additional photos from build */}
                  {bd && bd.mainPhotos && bd.mainPhotos.length > 1 && (
                    <>
                      <div style={{ height: 1, background: T.charcoal, margin: "12px 0" }} />
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, display: "block", marginBottom: 8 }}>MORE PHOTOS</span>
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                        {bd.mainPhotos.slice(1).map((p, pi) => (
                          <img key={pi} src={p.url} alt="" onClick={(e) => { e.stopPropagation(); openGalleryCarousel(b, pi + 1); }} style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", flexShrink: 0, cursor: "pointer" }} />
                        ))}
                      </div>
                    </>
                  )}
                  <div style={{ height: 1, background: T.charcoal, margin: "12px 0" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={(e) => { e.stopPropagation(); onViewUser && onViewUser(b.handle.replace("@", "")); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, background: T.charcoal, border: "none", cursor: "pointer" }}>
                      <Eye size={14} color={T.white} />
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>VIEW PROFILE</span>
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); toggleLikeBuild(b.id); }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, background: likedBuilds[b.id] ? `${T.red}30` : `${T.red}18`, border: `1px solid ${likedBuilds[b.id] ? T.red + "60" : T.red + "30"}`, cursor: "pointer", transition: "all 0.2s" }}>
                      <Heart size={14} color={T.red} fill={likedBuilds[b.id] ? T.red : "none"} />
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.red, fontWeight: 600, letterSpacing: 0.5 }}>{likedBuilds[b.id] ? "LIKED" : "LIKE BUILD"}</span>
                    </button>
                  </div>
                </div>
                );
              })()}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── RANKS / LEADERBOARD SCREEN ─── */
function RanksScreen() {
  const leaderboard = [
    { rank: "01", name: "Sierra_Tactical", badge: "Expedition Lead", points: "48,900", isYou: false },
    { rank: "02", name: "Nomad_Queen", badge: "Master Builder", points: "32,100", isYou: false },
    { rank: "03", name: "Peak_Finder", badge: "Navigator", points: "28,750", isYou: false },
    { rank: "42", name: "You", badge: "Pathfinder Rank", points: "12,450", isYou: true },
    { rank: "43", name: "Nomad_Mike", badge: "Wilderness Guide", points: "11,200", isYou: false },
  ];

  const missions = [
    { title: "Share a New Route", desc: "Upload a verified GPS track with at least 3 photos and a terrain rating.", pts: "+150 PTS", expiry: "EXPIRES IN 2D", action: "START MISSION" },
    { title: "Technical Advisor", desc: "Answer a technical question in the Gear Forum that gets marked as 'Helpful'.", pts: "+50 PTS", expiry: "DAILY TASK", action: "GO TO FORUM" },
    { title: "Full Build Profile", desc: "Complete your vehicle build profile with a full gear list and weight measurements.", pts: "+300 PTS", expiry: "ONE-TIME BONUS", action: "UPDATE BUILD" },
  ];

  return (
    <div style={{ padding: "0 0 16px" }}>
      {/* Rank Hero */}
      <div style={{ padding: "24px 16px", textAlign: "center" }}>
        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2 }}>CURRENT STANDING</span>
        <h1 style={{ fontFamily: sans, fontSize: 36, color: T.white, margin: "4px 0 16px", fontWeight: 700 }}>Rank #42</h1>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
          <div style={{ background: T.darkCard, borderRadius: 10, padding: 16 }}>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 4 }}>SEASON POINTS</span>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 4 }}>
              <span style={{ fontFamily: sans, fontSize: 22, color: T.copper, fontWeight: 700 }}>12,450</span>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary }}>pts</span>
            </div>
          </div>
          <div style={{ background: T.darkCard, borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
            <CheckCircle size={18} color={T.copper} strokeWidth={1.5} style={{ marginBottom: 4 }} />
            <span style={{ fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }}>Verified Badge</span>
          </div>
        </div>
      </div>

      {/* Credit Card */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ background: `linear-gradient(135deg, ${T.copper}, ${T.tertiary})`, borderRadius: 16, padding: 24 }}>
          <span style={{ fontFamily: sans, fontSize: 12, color: T.white, letterSpacing: 1, opacity: 0.8 }}>Available Credit</span>
          <h2 style={{ fontFamily: sans, fontSize: 32, color: T.white, margin: "4px 0 16px", fontWeight: 700 }}>$1,240.00</h2>
          <button style={{ background: T.charcoal, color: T.white, fontFamily: sans, fontSize: 12, fontWeight: 600, padding: "10px 24px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 1 }}>Redeem Credit</button>
        </div>
      </div>

      {/* Global Ranks */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600 }}>Global Ranks</span>
          <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, background: T.darkCard, padding: "4px 10px", borderRadius: 12, letterSpacing: 1 }}>Season 04</span>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {leaderboard.map((r, i) => (
            <div key={i} style={{ background: r.isYou ? `${T.red}15` : T.darkCard, borderRadius: 10, padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, border: r.isYou ? `1px solid ${T.red}30` : "1px solid transparent" }}>
              <span style={{ fontFamily: sans, fontSize: 18, color: r.rank === "01" ? T.copper : r.isYou ? T.red : T.white, fontWeight: 700, width: 28 }}>{r.rank}</span>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: r.isYou ? T.red : T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <span style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, color: T.white }}>{r.name[0]}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{ fontFamily: sans, fontSize: 13, color: r.isYou ? T.red : T.white, fontWeight: 600, display: "block" }}>{r.name}</span>
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{r.badge}</span>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontFamily: sans, fontSize: 14, color: T.copper, fontWeight: 600, display: "block" }}>{r.points}</span>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>Points</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Active Missions */}
      <div style={{ padding: "0 16px" }}>
        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 2, fontWeight: 600, display: "block", marginBottom: 12 }}>ACTIVE MISSIONS</span>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {missions.map((m, i) => (
            <div key={i} style={{ ...cardStyle, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: i === 2 ? `${T.red}15` : T.warmBg + "15", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Target size={16} color={i === 2 ? T.red : T.tertiary} />
                </div>
                <span style={{ fontFamily: sans, fontSize: 12, color: T.red, fontWeight: 700 }}>{m.pts}</span>
              </div>
              <h3 style={{ fontFamily: sans, fontSize: 17, color: T.white, margin: "0 0 6px", fontWeight: 600 }}>{m.title}</h3>
              <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 12px", lineHeight: 1.5 }}>{m.desc}</p>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1 }}>{m.expiry}</span>
                <button style={{ fontFamily: sans, fontSize: 10, color: T.charcoal, background: T.warmBg, padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 1, fontWeight: 600 }}>{m.action}</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── ADD BUILD FORM ─── */
function AddBuildForm({ onClose, onSave, initialData }) {
  const d = initialData || {};
  const initMod = (m) => m && m.value != null ? { ...m } : { value: "", photo: [], link: "" };
  const [buildName, setBuildName] = useState(d.buildName || "");
  const [year, setYear] = useState(d.year || "");
  const [make, setMake] = useState(d.make || "");
  const [model, setModel] = useState(d.model || "");
  const [trim, setTrim] = useState(d.trim || "");
  const [showPreview, setShowPreview] = useState(false);
  const [shareToFeed, setShareToFeed] = useState(initialData ? false : true);
  const [mainPhotos, setMainPhotos] = useState(d.mainPhotos || []);
  // Each mod: { value, photo: [] (max 1), link }
  const emptyMod = () => ({ value: "", photo: [], link: "" });
  const [suspension, setSuspension] = useState(initMod(d.suspension));
  const [tires, setTires] = useState(initMod(d.tires));
  const [wheels, setWheels] = useState(initMod(d.wheels));
  const [bumpers, setBumpers] = useState(initMod(d.bumpers));
  const [armor, setArmor] = useState(initMod(d.armor));
  const [lighting, setLighting] = useState(initMod(d.lighting));
  const [rack, setRack] = useState(initMod(d.rack));
  const [winch, setWinch] = useState(initMod(d.winch));
  const [otherMods, setOtherMods] = useState(initMod(d.otherMods));
  const [hasCamper, setHasCamper] = useState(d.hasCamper || false);
  const [camperMake, setCamperMake] = useState(d.camperMake || "");
  const [camperModel, setCamperModel] = useState(d.camperModel || "");
  const [camperPhoto, setCamperPhoto] = useState(d.camperPhoto || []);
  const [camperLink, setCamperLink] = useState(d.camperLink || "");

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 8,
    background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white,
    fontFamily: serif, fontSize: 14, outline: "none", transition: "border 0.2s",
  };
  const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };
  const sectionTitle = (text, icon) => (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, marginTop: 24 }}>
      {icon}
      <span style={{ fontFamily: sans, fontSize: 12, color: T.copper, letterSpacing: 1.5, fontWeight: 700 }}>{text}</span>
    </div>
  );
  const fieldGroup = (label, value, setter, placeholder, multiline) => (
    <div style={{ marginBottom: 14 }}>
      <label style={labelStyle}>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={e => setter(e.target.value)} placeholder={placeholder} style={{ ...inputStyle, minHeight: 70, resize: "vertical", lineHeight: 1.6 }} />
      ) : (
        <input value={value} onChange={e => setter(e.target.value)} placeholder={placeholder} style={inputStyle} />
      )}
    </div>
  );

  // Mod field with photo + link
  const ModFieldPhoto = ({ mod, setMod }) => {
    const fRef = useRef(null);
    const handleF = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      if (fRef.current) fRef.current.value = "";
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMod({ ...mod, photo: [{ id: Date.now(), url: ev.target.result, name: file.name }] });
      };
      reader.readAsDataURL(file);
    };
    return (
      <>
        <input ref={fRef} type="file" accept="image/*" onChange={handleF} style={{ display: "none" }} />
        {mod.photo.length > 0 ? (
          <div style={{ position: "relative", flexShrink: 0 }}>
            <img src={mod.photo[0].url} alt="" style={{ width: 52, height: 52, borderRadius: 6, objectFit: "cover", display: "block", border: `1px solid ${T.charcoal}` }} />
            <button onClick={() => setMod({ ...mod, photo: [] })} style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: T.red, border: `2px solid ${T.darkBg}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
              <X size={8} color={T.white} />
            </button>
          </div>
        ) : (
          <button onClick={() => fRef.current && fRef.current.click()} style={{ width: 52, height: 52, borderRadius: 6, background: T.darkCard, border: `1px dashed ${T.charcoal}`, cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 2, flexShrink: 0, padding: 0 }}>
            <Camera size={14} color={T.tertiary} />
            <span style={{ fontFamily: sans, fontSize: 7, color: T.tertiary, letterSpacing: 0.3 }}>PHOTO</span>
          </button>
        )}
      </>
    );
  };

  const modField = (label, mod, setMod, placeholder) => (
    <div style={{ marginBottom: 16 }}>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <div style={{ flex: 1 }}>
          <input value={mod.value} onChange={e => setMod({ ...mod, value: e.target.value })} placeholder={placeholder} style={inputStyle} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}>
            <ExternalLink size={12} color={mod.link ? T.copper : T.tertiary} style={{ flexShrink: 0 }} />
            <input value={mod.link} onChange={e => setMod({ ...mod, link: e.target.value })} placeholder="Product link (optional)" style={{ ...inputStyle, padding: "7px 10px", fontSize: 11, background: "transparent", border: `1px solid ${mod.link ? T.copper + "40" : T.charcoal}` }} />
          </div>
        </div>
        <div style={{ marginTop: 0 }}>
          <ModFieldPhoto mod={mod} setMod={setMod} />
        </div>
      </div>
    </div>
  );

  const handleSave = () => {
    if (!make || !model || !year) return;
    onSave && onSave({ buildName, year, make, model, trim, mainPhotos, suspension, tires, wheels, bumpers, armor, lighting, rack, winch, otherMods, hasCamper, camperMake, camperModel, camperPhoto, camperLink, shareToFeed });
    onClose();
  };

  const formView = (
    <div style={{ padding: "8px 16px 32px" }}>
      {/* Build Identity */}
      {sectionTitle("BUILD IDENTITY", <Wrench size={16} color={T.copper} />)}
      {fieldGroup("BUILD NAME", buildName, setBuildName, "e.g. THE HIGHLANDER")}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>YEAR</label>
          <input value={year} onChange={e => setYear(e.target.value)} placeholder="2024" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>MAKE</label>
          <input value={make} onChange={e => setMake(e.target.value)} placeholder="Toyota" style={inputStyle} />
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {(() => { const f = fieldGroup("MODEL", model, setModel, "Tundra"); return f; })()}
        {(() => { const f = fieldGroup("TRIM / PACKAGE", trim, setTrim, "TRD Pro"); return f; })()}
      </div>

      {/* Main Build Photo */}
      {sectionTitle("BUILD PHOTOS", <Camera size={16} color={T.copper} />)}
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>MAIN IMAGE</label>
        {mainPhotos.length > 0 ? (
          <div style={{ position: "relative", marginBottom: 8 }}>
            <img src={mainPhotos[0].url} alt="" style={{ width: "100%", height: 180, borderRadius: 10, objectFit: "cover", display: "block", border: `1px solid ${T.charcoal}` }} />
            <button onClick={() => setMainPhotos([])} style={{ position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: "50%", background: `${T.darkBg}CC`, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <X size={14} color={T.white} />
            </button>
          </div>
        ) : (
          <PhotoUploader photos={mainPhotos} onChange={(p) => setMainPhotos(p.slice(0, 1))} maxPhotos={1} />
        )}
        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, marginTop: 4, display: "block" }}>This will be the hero image on your build card</span>
      </div>

      {/* Suspension & Wheels */}
      {sectionTitle("SUSPENSION & WHEELS", <ChevronUp size={16} color={T.copper} />)}
      {modField("SUSPENSION", suspension, setSuspension, "e.g. Icon Stage 3, 2.5\" lift")}
      {modField("TIRES", tires, setTires, "e.g. BFGoodrich KO2 35x12.5R17")}
      {modField("WHEELS", wheels, setWheels, "e.g. Method 305 NV 17x8.5")}

      {/* Armor & Protection */}
      {sectionTitle("ARMOR & PROTECTION", <Shield size={16} color={T.copper} />)}
      {modField("BUMPERS", bumpers, setBumpers, "e.g. CBI front & rear bumpers")}
      {modField("SKID PLATES / ARMOR", armor, setArmor, "e.g. RCI full skid package")}

      {/* Accessories */}
      {sectionTitle("ACCESSORIES", <Star size={16} color={T.copper} />)}
      {modField("LIGHTING", lighting, setLighting, "e.g. Baja Designs squadron, ditch lights")}
      {modField("ROOF RACK / BED RACK", rack, setRack, "e.g. Uptop Overland Alpha bed rack")}
      {modField("RECOVERY / WINCH", winch, setWinch, "e.g. WARN Zeon 10-S")}
      {modField("OTHER MODS", otherMods, setOtherMods, "Snorkel, dual battery, fridge slide, etc.")}

      {/* Camper Toggle */}
      {sectionTitle("CAMPER", <Home size={16} color={T.copper} />)}
      <div
        onClick={() => setHasCamper(!hasCamper)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.darkCard, borderRadius: 10, cursor: "pointer", marginBottom: 14, border: hasCamper ? `1px solid ${T.copper}40` : `1px solid ${T.charcoal}` }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Home size={18} color={hasCamper ? T.copper : T.tertiary} />
          <div>
            <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }}>Camper Installed</span>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{hasCamper ? "Tap to remove camper details" : "Tap to add camper details"}</span>
          </div>
        </div>
        <div style={{ width: 44, height: 24, borderRadius: 12, background: hasCamper ? T.copper : T.charcoal, position: "relative", transition: "background 0.2s" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: hasCamper ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        </div>
      </div>

      {hasCamper && (
        <div style={{ background: `${T.copper}08`, borderRadius: 10, padding: "4px 0 0", marginBottom: 14 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {(() => { const f = fieldGroup("CAMPER MAKE", camperMake, setCamperMake, "e.g. Four Wheel Campers"); return f; })()}
            {(() => { const f = fieldGroup("CAMPER MODEL", camperModel, setCamperModel, "e.g. Fleet Flatbed"); return f; })()}
          </div>
          {/* Product link */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <ExternalLink size={12} color={camperLink ? T.copper : T.tertiary} style={{ flexShrink: 0 }} />
              <input value={camperLink} onChange={e => setCamperLink(e.target.value)} placeholder="Product link (optional)" style={{ ...inputStyle, padding: "7px 10px", fontSize: 11, background: "transparent", border: `1px solid ${camperLink ? T.copper + "40" : T.charcoal}` }} />
            </div>
          </div>
          {/* Photo upload */}
          <div style={{ marginBottom: 12 }}>
            <ModFieldPhoto mod={{ photo: camperPhoto }} setMod={(m) => setCamperPhoto(m.photo)} />
            {camperPhoto.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                {camperPhoto.map((p, pi) => (
                  <div key={pi} style={{ position: "relative" }}>
                    <img src={p.url} alt="" style={{ width: 52, height: 52, borderRadius: 6, objectFit: "cover" }} />
                    <button onClick={() => setCamperPhoto(camperPhoto.filter((_, j) => j !== pi))} style={{ position: "absolute", top: -4, right: -4, width: 16, height: 16, borderRadius: "50%", background: T.red, border: "none", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", padding: 0 }}>
                      <X size={8} color={T.white} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Preview Button */}
      <button
        onClick={() => { if (make && model && year) setShowPreview(true); }}
        style={{ width: "100%", padding: "16px", borderRadius: 10, background: (!make || !model || !year) ? T.charcoal : T.red, border: "none", cursor: (!make || !model || !year) ? "default" : "pointer", fontFamily: sans, fontSize: 14, color: (!make || !model || !year) ? T.tertiary : T.white, fontWeight: 700, letterSpacing: 1, marginTop: 8, opacity: (!make || !model || !year) ? 0.5 : 1, transition: "all 0.2s" }}
      >
        PREVIEW BUILD
      </button>
      {(!make || !model || !year) && (
        <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, textAlign: "center", display: "block", marginTop: 8 }}>Year, make, and model are required</span>
      )}
    </div>
  );

  /* ─── Preview Card ─── */
  const displayName = buildName || `${year} ${make} ${model}`;
  const specRows = [
    suspension.value && { label: "Suspension", mod: suspension },
    tires.value && { label: "Tires", mod: tires },
    wheels.value && { label: "Wheels", mod: wheels },
    bumpers.value && { label: "Bumpers", mod: bumpers },
    armor.value && { label: "Armor / Skid Plates", mod: armor },
    lighting.value && { label: "Lighting", mod: lighting },
    rack.value && { label: "Rack", mod: rack },
    winch.value && { label: "Recovery / Winch", mod: winch },
    otherMods.value && { label: "Other", mod: otherMods },
  ].filter(Boolean);

  const previewView = (
    <div style={{ padding: "8px 16px 32px" }}>
      {/* Preview Card */}
      <div style={{ ...cardStyle, overflow: "hidden", marginBottom: 16 }}>
        {/* Hero image or gradient */}
        <div style={{ height: 180, background: mainPhotos.length > 0 ? "none" : `linear-gradient(135deg, ${T.charcoal} 0%, ${T.red}20 100%)`, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
          {mainPhotos.length > 0 ? (
            <img src={mainPhotos[0].url} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Wrench size={70} color={T.tertiary} strokeWidth={0.2} style={{ opacity: 0.06 }} />
            </div>
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 30%, rgba(0,0,0,0.8) 100%)" }} />
          <div style={{ position: "relative", padding: "0 14px 12px" }}>
            {trim && (
              <span style={{ fontFamily: sans, fontSize: 8, color: T.warmBg, background: "#3D3D3A", padding: "3px 6px", borderRadius: 3, letterSpacing: 0.8, marginBottom: 4, display: "inline-block" }}>{trim.toUpperCase()}</span>
            )}
            <h3 style={{ fontFamily: sans, fontSize: 24, color: T.warmBg, margin: "4px 0 0", fontWeight: 700, letterSpacing: 1 }}>{displayName.toUpperCase()}</h3>
            <span style={{ fontFamily: serif, fontSize: 12, color: T.tertiary }}>{year} {make} {model}</span>
          </div>
        </div>

        {/* Specs list with images and links */}
        {specRows.length > 0 && (
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.charcoal}` }}>
            <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 10 }}>MODIFICATIONS</span>
            {specRows.map((row, j) => (
              <div key={j} style={{ padding: "10px 0", borderTop: j > 0 ? `1px solid ${T.charcoal}` : "none" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary, flexShrink: 0 }}>{row.label}</span>
                  <span style={{ fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }}>{row.mod.value}</span>
                </div>
                {row.mod.photo.length > 0 && (
                  <img src={row.mod.photo[0].url} alt="" style={{ width: "100%", height: 100, borderRadius: 6, objectFit: "cover", display: "block", marginTop: 8, border: `1px solid ${T.charcoal}` }} />
                )}
                {row.mod.link && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                    <ExternalLink size={11} color={T.copper} />
                    <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>View Product</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Camper section */}
        {hasCamper && (camperMake || camperModel) && (
          <div style={{ padding: "12px 14px", borderTop: `1px solid ${T.charcoal}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <Home size={12} color={T.copper} />
              <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }}>CAMPER</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 8 }}>
              <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>Make / Model</span>
              <span style={{ fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }}>{[camperMake, camperModel].filter(Boolean).join(" ")}</span>
            </div>
            {camperPhoto.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                {camperPhoto.map((p, pi) => (
                  <img key={pi} src={p.url} alt="" style={{ width: 60, height: 60, borderRadius: 6, objectFit: "cover", border: `1px solid ${T.charcoal}` }} />
                ))}
              </div>
            )}
            {camperLink && (
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                <ExternalLink size={11} color={T.copper} />
                <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }}>View Product</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Share to Feed Toggle */}
      <div
        onClick={() => setShareToFeed(!shareToFeed)}
        style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.darkCard, borderRadius: 10, cursor: "pointer", marginBottom: 20, border: shareToFeed ? `1px solid ${T.red}40` : `1px solid ${T.charcoal}` }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Share2 size={18} color={shareToFeed ? T.red : T.tertiary} />
          <div>
            <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }}>Share to Feed</span>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{shareToFeed ? "Your build will appear in the community feed" : "Only visible on your profile"}</span>
          </div>
        </div>
        <div style={{ width: 44, height: 24, borderRadius: 12, background: shareToFeed ? T.red : T.charcoal, position: "relative", transition: "background 0.2s" }}>
          <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: shareToFeed ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: "flex", gap: 10 }}>
        <button
          onClick={() => setShowPreview(false)}
          style={{ flex: 1, padding: "14px", borderRadius: 10, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}
        >
          EDIT
        </button>
        <button
          onClick={handleSave}
          style={{ flex: 2, padding: "14px", borderRadius: 10, background: T.red, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 700, letterSpacing: 1 }}
        >
          {shareToFeed ? "SAVE & SHARE" : "SAVE BUILD"}
        </button>
      </div>
    </div>
  );

  return showPreview ? previewView : formView;
}

/* ─── PROFILE SCREEN (Own Profile) ─── */
function ProfileScreen({ onViewUser, onLogout, userBuilds, onAddBuild, onUpdateBuild, onDeleteBuild, profilePic, onSetProfilePic, notifPrefs, onSetNotifPrefs, feedItems, onDeletePost, onEditPost, onGoToPost }) {
  const [isPublic, setIsPublic] = useState(true);
  const [activeTab, setActiveTab] = useState("builds");
  const [activeBuild, setActiveBuild] = useState(0);
  const [showAddBuild, setShowAddBuild] = useState(false);
  const [editingBuild, setEditingBuild] = useState(null); // { id, buildData } or null
  const [expandedProfileBuild, setExpandedProfileBuild] = useState(false);
  const [deleteBuildConfirm, setDeleteBuildConfirm] = useState(null);
  const [carouselImages, setCarouselImages] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showNotifSettings, setShowNotifSettings] = useState(false);
  const [userName, setUserName] = useState("Kyle Morrison");
  const [userHandle, setUserHandle] = useState("@KyleLPO");
  const [userBio, setUserBio] = useState("");
  const profilePicRef = useRef(null);
  const settingsPicRef = useRef(null);

  const handleProfilePicUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      onSetProfilePic && onSetProfilePic(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const collectAndOpenCarousel = (build, startIdx) => {
    const imgs = [];
    const bd = build.buildData;
    if (bd && bd.mainPhotos) bd.mainPhotos.forEach(p => imgs.push(p.url));
    else if (build.image) imgs.push(build.image);
    if (bd) {
      [bd.suspension, bd.tires, bd.wheels, bd.bumpers, bd.armor, bd.lighting, bd.rack, bd.winch, bd.otherMods].forEach(mod => {
        if (mod && mod.photo) mod.photo.forEach(p => imgs.push(p.url));
      });
      if (bd.camperPhoto) bd.camperPhoto.forEach(p => imgs.push(p.url));
    }
    if (imgs.length > 0) {
      setCarouselImages(imgs);
      setCarouselIndex(startIdx != null && startIdx < imgs.length ? startIdx : 0);
    }
  };

  const user = {
    name: userName,
    handle: userHandle,
    badge: "Verified Explorer",
    followers: 847,
    following: 234,
    points: 12450,
    joinDate: "Mar 2025",
  };

  const defaultBuilds = [
    { name: "THE HIGHLANDER", vehicle: "2022 Toyota Tundra", tags: ["V8 OVERLAND", "CLASS 4 READY"], miles: "2,482", elevation: "84K ft", routes: 34 },
    { name: "DESERT HAWK", vehicle: "2019 Jeep Gladiator", tags: ["TRAIL RATED", "EXPO READY"], miles: "1,120", elevation: "42K ft", routes: 18 },
  ];
  const mappedUserBuilds = (userBuilds || []).map(b => ({
    id: b.id,
    name: b.name || "UNNAMED BUILD",
    vehicle: `${b.year || ""} ${b.make || ""} ${b.model || ""}`.trim(),
    tags: b.tags || [],
    miles: "0",
    elevation: "0 ft",
    routes: 0,
    image: b.heroImg || null,
    buildData: b.buildData || null,
    isUserBuild: true,
  }));
  const builds = [...defaultBuilds, ...mappedUserBuilds];

  const trips = [
    { name: "Shadow Peak Traverse", date: "Oct 12, 2025", distance: "42.5 mi", grade: 7, build: "THE HIGHLANDER" },
    { name: "Eagle Rim Loop", date: "Oct 8, 2025", distance: "38.0 mi", grade: 5, build: "THE HIGHLANDER" },
    { name: "Baja Norte Expedition", date: "Sep 22, 2025", distance: "286 mi", grade: 4, build: "DESERT HAWK" },
    { name: "Rubicon Trail", date: "Sep 5, 2025", distance: "22 mi", grade: 9, build: "THE HIGHLANDER" },
  ];

  const [editingPost, setEditingPost] = useState(null);
  const [editPostText, setEditPostText] = useState("");
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const userPosts = (feedItems || []).filter(p => p.user === "KyleLPO");
  const staticActivity = [
    { type: "forum", title: "Best budget lift kit for 3rd Gen Tacoma?", time: "5 days ago", replies: 47, category: "FORUM REPLY" },
    { type: "forum", title: "Custom skid plate fabrication — my walkthrough", time: "2 weeks ago", replies: 89, category: "FORUM POST" },
    { type: "forum", title: "ARB bumper install tips for 200 Series", time: "1 month ago", replies: 56, category: "FORUM REPLY" },
  ];
  const activity = [
    ...userPosts.map(p => ({ type: "post", title: p.title, time: p.time, likes: p.likes, comments: p.comments, category: p.type, feedId: p.id, isOwn: true })),
    ...staticActivity,
  ];

  const pendingRequests = [
    { name: "TrailRunner_88", badge: "Scout" },
    { name: "MountainGoat", badge: "Explorer" },
  ];

  const tabs = ["builds", "trips", "activity"];

  if (showAddBuild || editingBuild) {
    const isEdit = !!editingBuild;
    const closeForm = () => { setShowAddBuild(false); setEditingBuild(null); };
    return (
      <div style={{ padding: "0 0 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 0" }}>
          <button onClick={closeForm} style={{ background: T.darkCard, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={18} color={T.white} />
          </button>
          <div>
            <h2 style={{ fontFamily: sans, fontSize: 18, color: T.white, margin: 0, fontWeight: 700 }}>{isEdit ? "Edit Build" : "Add New Build"}</h2>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{isEdit ? "Update your vehicle and mod details" : "Enter your vehicle and mod details"}</span>
          </div>
        </div>
        <AddBuildForm
          key={isEdit ? editingBuild.id : "new"}
          onClose={closeForm}
          initialData={isEdit ? editingBuild.buildData : undefined}
          onSave={(data) => {
            if (isEdit) {
              onUpdateBuild && onUpdateBuild(editingBuild.id, data);
            } else {
              onAddBuild && onAddBuild(data);
            }
            closeForm();
          }}
        />
      </div>
    );
  }

  if (showSettings) {
    const inputStyle = { width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none" };
    const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };
    const handleSettingsPic = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => { onSetProfilePic && onSetProfilePic(ev.target.result); };
      reader.readAsDataURL(file);
      e.target.value = "";
    };

    if (showNotifSettings) {
      const togglePref = (key) => onSetNotifPrefs && onSetNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }));
      const prefToggle = (label, desc, key, icon, iconColor) => (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderBottom: `1px solid ${T.charcoal}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            {React.createElement(icon, { size: 16, color: iconColor })}
            <div>
              <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>{label}</span>
              <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>{desc}</span>
            </div>
          </div>
          <div onClick={() => togglePref(key)} style={{ width: 44, height: 24, borderRadius: 12, background: notifPrefs[key] ? T.green : T.charcoal, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: notifPrefs[key] ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
          </div>
        </div>
      );
      return (
        <div style={{ padding: "0 0 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 20px" }}>
            <button onClick={() => setShowNotifSettings(false)} style={{ background: T.darkCard, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <ChevronLeft size={18} color={T.white} />
            </button>
            <div>
              <h2 style={{ fontFamily: sans, fontSize: 18, color: T.white, margin: 0, fontWeight: 700 }}>Notifications</h2>
              <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>Choose what alerts you receive</span>
            </div>
          </div>
          <div style={{ padding: "0 16px" }}>
            <div style={{ background: T.darkCard, borderRadius: 12, padding: "4px 16px 0" }}>
              {prefToggle("Likes", "When someone likes your posts or routes", "likes", Heart, T.red)}
              {prefToggle("Comments", "When someone comments on your posts", "comments", MessageCircle, T.copper)}
              {prefToggle("Replies", "When someone replies to your threads", "replies", MessageCircle, T.copper)}
              {prefToggle("Follows", "When someone follows you or requests to follow", "follows", UserPlus, T.green)}
              {prefToggle("Mentions", "When someone mentions you in a post or comment", "mentions", AtSign, T.copper)}
            </div>
            <div style={{ marginTop: 16, background: T.darkCard, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
                  <Smartphone size={16} color={T.copper} />
                  <div>
                    <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>Push Notifications</span>
                    <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>
                      {notifPrefs.push ? "Enabled — you'll receive alerts on this device" : typeof Notification === "undefined" ? "Not supported on this browser" : Notification.permission === "denied" ? "Blocked — enable in browser settings" : "Get notified even when the app is closed"}
                    </span>
                  </div>
                </div>
                <div onClick={async () => {
                  if (typeof Notification === "undefined") return;
                  if (!notifPrefs.push) {
                    const perm = await Notification.requestPermission();
                    if (perm === "granted") {
                      onSetNotifPrefs && onSetNotifPrefs(prev => ({ ...prev, push: true }));
                      new Notification("Trailhead", { body: "Push notifications enabled! You'll stay in the loop.", icon: "" });
                    }
                  } else {
                    onSetNotifPrefs && onSetNotifPrefs(prev => ({ ...prev, push: false }));
                  }
                }} style={{ width: 44, height: 24, borderRadius: 12, background: notifPrefs.push ? T.green : T.charcoal, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0, opacity: (typeof Notification !== "undefined" && Notification.permission !== "denied") ? 1 : 0.4 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: notifPrefs.push ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            </div>
            <div style={{ marginTop: 16, background: T.darkCard, borderRadius: 12, padding: 16 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>Mute All</span>
                  <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>Temporarily silence all notifications</span>
                </div>
                <div onClick={() => {
                  const allOn = Object.entries(notifPrefs).filter(([k]) => k !== "push").every(([,v]) => v);
                  const newVal = allOn ? { likes: false, comments: false, replies: false, follows: false, mentions: false, push: notifPrefs.push } : { likes: true, comments: true, replies: true, follows: true, mentions: true, push: notifPrefs.push };
                  onSetNotifPrefs && onSetNotifPrefs(newVal);
                }} style={{ width: 44, height: 24, borderRadius: 12, background: Object.entries(notifPrefs).filter(([k]) => k !== "push").every(([,v]) => !v) ? T.red : T.charcoal, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: Object.entries(notifPrefs).filter(([k]) => k !== "push").every(([,v]) => !v) ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                </div>
              </div>
            </div>
            <p style={{ fontFamily: serif, fontSize: 11, color: T.tertiary, textAlign: "center", marginTop: 16, lineHeight: 1.5 }}>
              Disabled notifications won't appear in your bell icon or notification panel. Push notifications require browser permission. You can always change these later.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div style={{ padding: "0 0 16px" }}>
        <input ref={settingsPicRef} type="file" accept="image/*" onChange={handleSettingsPic} style={{ display: "none" }} />
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "16px 16px 20px" }}>
          <button onClick={() => setShowSettings(false)} style={{ background: T.darkCard, border: "none", borderRadius: 8, width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <ChevronLeft size={18} color={T.white} />
          </button>
          <div>
            <h2 style={{ fontFamily: sans, fontSize: 18, color: T.white, margin: 0, fontWeight: 700 }}>Settings</h2>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>Manage your profile and preferences</span>
          </div>
        </div>

        <div style={{ padding: "0 16px" }}>
          {/* Edit Profile Section */}
          <div style={{ background: T.darkCard, borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Settings size={14} color={T.copper} />
              <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }}>EDIT PROFILE</span>
            </div>

            {/* Profile photo */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ position: "relative", display: "inline-block" }}>
                {profilePic ? (
                  <img src={profilePic} alt="" style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", border: `3px solid ${T.copper}` }} />
                ) : (
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `3px dashed ${T.copper}40` }}>
                    <Camera size={24} color={T.copper} strokeWidth={1.2} style={{ opacity: 0.5 }} />
                  </div>
                )}
                <button onClick={() => settingsPicRef.current && settingsPicRef.current.click()} style={{ position: "absolute", bottom: -2, right: -2, width: 26, height: 26, borderRadius: "50%", background: T.copper, border: `2px solid ${T.darkCard}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Camera size={11} color={T.white} />
                </button>
              </div>
              <button onClick={() => settingsPicRef.current && settingsPicRef.current.click()} style={{ display: "block", margin: "8px auto 0", background: "none", border: "none", cursor: "pointer" }}>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 0.5 }}>{profilePic ? "CHANGE PHOTO" : "ADD PHOTO"}</span>
              </button>
            </div>

            {/* Name */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>DISPLAY NAME</label>
              <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="Your name" style={inputStyle} />
            </div>

            {/* Handle */}
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>USERNAME</label>
              <input value={userHandle} onChange={e => setUserHandle(e.target.value)} placeholder="@username" style={inputStyle} />
            </div>

            {/* Bio */}
            <div>
              <label style={labelStyle}>BIO</label>
              <textarea value={userBio} onChange={e => setUserBio(e.target.value)} placeholder="Tell the community about yourself..." rows={3} style={{ ...inputStyle, resize: "vertical", fontFamily: serif, lineHeight: 1.5 }} />
            </div>
          </div>

          {/* Privacy Section */}
          <div style={{ background: T.darkCard, borderRadius: 12, padding: 16, marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Shield size={14} color={T.copper} />
              <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }}>PRIVACY</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {isPublic ? <Globe size={16} color={T.green} /> : <Lock size={16} color={T.copper} />}
                <div>
                  <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>{isPublic ? "Public Profile" : "Private Profile"}</span>
                  <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>{isPublic ? "Anyone can see your builds and activity" : "Only approved followers can see your content"}</span>
                </div>
              </div>
              <div onClick={() => setIsPublic(!isPublic)} style={{ width: 44, height: 24, borderRadius: 12, background: isPublic ? T.green : T.charcoal, position: "relative", cursor: "pointer", transition: "background 0.2s", flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.white, position: "absolute", top: 2, left: isPublic ? 22 : 2, transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
              </div>
            </div>
          </div>

          {/* Account Section */}
          <div style={{ background: T.darkCard, borderRadius: 12, overflow: "hidden", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 16px 12px" }}>
              <Settings size={14} color={T.copper} />
              <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }}>ACCOUNT</span>
            </div>
            <button onClick={() => setShowNotifSettings(true)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", borderTop: `1px solid ${T.charcoal}`, cursor: "pointer", textAlign: "left" }}>
              <Bell size={16} color={T.tertiary} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: sans, fontSize: 13, color: T.white, display: "block" }}>Notifications</span>
                <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>Manage push and in-app alerts</span>
              </div>
              <ChevronRight size={16} color={T.tertiary} />
            </button>
            <button style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "none", border: "none", borderTop: `1px solid ${T.charcoal}`, cursor: "pointer", textAlign: "left" }}>
              <Shield size={16} color={T.tertiary} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: sans, fontSize: 13, color: T.white, display: "block" }}>Blocked Users</span>
                <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>Manage blocked accounts</span>
              </div>
              <ChevronRight size={16} color={T.tertiary} />
            </button>
          </div>

          {/* Sign Out */}
          <button onClick={onLogout} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "14px", borderRadius: 10, background: `${T.red}12`, border: `1px solid ${T.red}25`, cursor: "pointer" }}>
            <ChevronLeft size={16} color={T.red} />
            <span style={{ fontFamily: sans, fontSize: 13, color: T.red, fontWeight: 600, letterSpacing: 0.5 }}>SIGN OUT</span>
          </button>

          {/* App info */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>TRAILHEAD v1.0</span>
            <span style={{ fontFamily: serif, fontSize: 10, color: T.tertiary, display: "block", marginTop: 4 }}>Member since {user.joinDate}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 16px" }}>
      {/* Image Carousel Overlay */}
      {carouselImages && (
        <ImageCarousel images={carouselImages} startIndex={carouselIndex} onClose={() => setCarouselImages(null)} />
      )}
      {/* Profile Header */}
      <input ref={profilePicRef} type="file" accept="image/*" onChange={handleProfilePicUpload} style={{ display: "none" }} />
      <div style={{ padding: "24px 16px 0", textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
          {profilePic ? (
            <img src={profilePic} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${T.red}` }} />
          ) : (
            <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${T.red}` }}>
              <span style={{ fontFamily: sans, fontSize: 28, fontWeight: 700, color: T.white }}>K</span>
            </div>
          )}
          <button onClick={() => profilePicRef.current && profilePicRef.current.click()} style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%", background: T.charcoal, border: `2px solid ${T.darkCard}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <Camera size={12} color={T.white} />
          </button>
        </div>
        <h2 style={{ fontFamily: sans, fontSize: 20, color: T.white, margin: "0 0 2px", fontWeight: 700 }}>{user.name}</h2>
        <span style={{ fontFamily: sans, fontSize: 13, color: T.tertiary, display: "block", marginBottom: 4 }}>{user.handle}</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${T.red}18`, padding: "4px 10px", borderRadius: 12, marginBottom: 16 }}>
          <CheckCircle size={12} color={T.red} />
          <span style={{ fontFamily: sans, fontSize: 10, color: T.red, letterSpacing: 1, fontWeight: 600 }}>{user.badge.toUpperCase()}</span>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700, display: "block" }}>{user.followers}</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>FOLLOWERS</span>
          </div>
          <div style={{ width: 1, background: T.charcoal }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700, display: "block" }}>{user.following}</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>FOLLOWING</span>
          </div>
          <div style={{ width: 1, background: T.charcoal }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 18, color: T.copper, fontWeight: 700, display: "block" }}>{user.points.toLocaleString()}</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>POINTS</span>
          </div>
        </div>

        {/* Bio */}
        {userBio && (
          <p style={{ fontFamily: serif, fontSize: 13, color: T.warmBg, margin: "0 0 12px", lineHeight: 1.5, maxWidth: 300, marginLeft: "auto", marginRight: "auto" }}>{userBio}</p>
        )}

        {/* Settings Button */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          <button onClick={() => setShowSettings(true)} style={{ display: "flex", alignItems: "center", gap: 6, background: T.darkCard, padding: "10px 20px", borderRadius: 8, border: "none", cursor: "pointer" }}>
            <Settings size={14} color={T.tertiary} />
            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary, letterSpacing: 1, fontWeight: 600 }}>SETTINGS</span>
          </button>
        </div>

        {/* Follow Requests (only when private) */}
        {!isPublic && pendingRequests.length > 0 && (
          <div style={{ background: `${T.copper}15`, borderRadius: 10, padding: 14, marginBottom: 16, textAlign: "left" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
              <Shield size={14} color={T.copper} />
              <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, letterSpacing: 1, fontWeight: 600 }}>FOLLOW REQUESTS ({pendingRequests.length})</span>
            </div>
            {pendingRequests.map((req, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderTop: i > 0 ? `1px solid ${T.charcoal}` : "none" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: T.white }}>{req.name[0]}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600 }}>{req.name}</span>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, display: "block" }}>{req.badge}</span>
                </div>
                <button style={{ background: T.red, color: T.white, fontFamily: sans, fontSize: 10, padding: "6px 12px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 0.5, fontWeight: 600 }}>ACCEPT</button>
                <button style={{ background: "none", color: T.tertiary, fontFamily: sans, fontSize: 10, padding: "6px 8px", borderRadius: 6, border: `1px solid ${T.charcoal}`, cursor: "pointer", letterSpacing: 0.5 }}>DENY</button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tab Bar */}
      <div style={{ display: "flex", borderBottom: `1px solid ${T.charcoal}`, margin: "0 16px", marginBottom: 16 }}>
        {tabs.map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "12px 0 10px", borderBottom: activeTab === t ? `2px solid ${T.red}` : "2px solid transparent", transition: "all 0.2s" }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: activeTab === t ? T.white : T.tertiary, letterSpacing: 1.5, fontWeight: 600 }}>{t.toUpperCase()}</span>
          </button>
        ))}
      </div>

      {/* BUILDS TAB */}
      {activeTab === "builds" && (
        <div style={{ padding: "0 16px" }}>
          {/* Build Selector (for multiple builds) */}
          <div className="th-hscroll" style={{ display: "flex", gap: 8, marginBottom: 16, overflowX: "auto" }}>
            {builds.map((b, i) => (
              <button key={i} onClick={() => setActiveBuild(i)} style={{ padding: "10px 16px", borderRadius: 8, background: activeBuild === i ? `${T.red}20` : T.darkCard, border: activeBuild === i ? `1px solid ${T.red}40` : "1px solid transparent", cursor: "pointer", whiteSpace: "nowrap", minWidth: 0, flexShrink: 0 }}>
                <span style={{ fontFamily: sans, fontSize: 12, color: activeBuild === i ? T.red : T.white, fontWeight: 600, display: "block" }}>{b.name}</span>
                <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary }}>{b.vehicle}</span>
              </button>
            ))}
            <button onClick={() => setShowAddBuild(true)} style={{ padding: "10px 16px", borderRadius: 8, background: T.darkCard, border: `1px dashed ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
              <Plus size={14} color={T.tertiary} />
              <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>Add Build</span>
            </button>
          </div>

          {/* Active Build Card */}
          {builds[activeBuild] && (() => {
            const ab = builds[activeBuild];
            const bd = ab.buildData;
            const isExp = expandedProfileBuild;
            const profSpecRow = (label, mod) => {
              if (!mod || !mod.value) return null;
              return (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, padding: "7px 0", borderBottom: `1px solid ${T.charcoal}20` }}>
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary, flexShrink: 0, minWidth: 70 }}>{label}</span>
                  <div style={{ flex: 1, textAlign: "right" }}>
                    <span style={{ fontFamily: serif, fontSize: 12, color: T.white }}>{mod.value}</span>
                    {mod.photo && mod.photo.length > 0 && (
                      <img src={mod.photo[0].url} alt="" onClick={(e) => { e.stopPropagation(); collectAndOpenCarousel(ab); }} style={{ width: 36, height: 36, borderRadius: 6, objectFit: "cover", marginLeft: 8, verticalAlign: "middle", cursor: "pointer" }} />
                    )}
                    {mod.link && (
                      <div style={{ marginTop: 2 }}>
                        <a href={ensureUrl(mod.link)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><ExternalLink size={9} /> View Product</a>
                      </div>
                    )}
                  </div>
                </div>
              );
            };
            return (
            <div style={{ ...cardStyle, overflow: "hidden" }}>
              {/* Hero area — clickable to expand */}
              <div onClick={() => setExpandedProfileBuild(!isExp)} style={{ cursor: "pointer", position: "relative" }}>
                <div style={{ height: 160, background: ab.image ? "none" : `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}30 100%)`, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden" }}>
                  {ab.image ? (
                    <>
                      <img src={ab.image} alt="" onClick={(e) => { e.stopPropagation(); collectAndOpenCarousel(ab); }} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "pointer" }} />
                      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(transparent 20%, rgba(0,0,0,0.75))", pointerEvents: "none" }} />
                    </>
                  ) : (
                    <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Wrench size={60} color={T.tertiary} strokeWidth={0.2} style={{ opacity: 0.08 }} />
                    </div>
                  )}
                  <div style={{ position: "relative", padding: 16, pointerEvents: "none" }}>
                    <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                      {ab.tags.map((tag, j) => (
                        <span key={j} style={{ fontFamily: sans, fontSize: 9, color: T.warmBg, background: "#3D3D3A", padding: "3px 8px", borderRadius: 4, letterSpacing: 1 }}>{tag}</span>
                      ))}
                    </div>
                    <h3 style={{ fontFamily: sans, fontSize: 28, color: T.warmBg, margin: 0, fontWeight: 700, letterSpacing: 1 }}>{ab.name}</h3>
                    <span style={{ fontFamily: serif, fontSize: 13, color: T.tertiary }}>{ab.vehicle}</span>
                  </div>
                  {/* Expand indicator */}
                  <div style={{ position: "absolute", top: 10, right: 10, background: `${T.darkBg}CC`, padding: "5px 10px", borderRadius: 12, display: "flex", alignItems: "center", gap: 4 }}>
                    <ChevronDown size={12} color={T.warmBg} style={{ transform: isExp ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
                    <span style={{ fontFamily: sans, fontSize: 9, color: T.warmBg, letterSpacing: 0.5 }}>{isExp ? "COLLAPSE" : "VIEW BUILD"}</span>
                  </div>
                </div>
              </div>
              {/* Stats row */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0, borderTop: `1px solid ${T.charcoal}` }}>
                <div style={{ padding: "14px 16px", textAlign: "center", borderRight: `1px solid ${T.charcoal}` }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 2 }}>TRAIL MILES</span>
                  <span style={{ fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700 }}>{ab.miles}</span>
                </div>
                <div style={{ padding: "14px 16px", textAlign: "center", borderRight: `1px solid ${T.charcoal}` }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 2 }}>ELEVATION</span>
                  <span style={{ fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700 }}>{ab.elevation}</span>
                </div>
                <div style={{ padding: "14px 16px", textAlign: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block", marginBottom: 2 }}>ROUTES</span>
                  <span style={{ fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700 }}>{ab.routes}</span>
                </div>
              </div>
              {/* Expanded build specs */}
              {isExp && (
                <div style={{ borderTop: `1px solid ${T.charcoal}`, padding: "12px 16px" }}>
                  {bd ? (
                    <>
                      <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 8 }}>BUILD SPECS</span>
                      {profSpecRow("Suspension", bd.suspension)}
                      {profSpecRow("Tires", bd.tires)}
                      {profSpecRow("Wheels", bd.wheels)}
                      {profSpecRow("Bumpers", bd.bumpers)}
                      {profSpecRow("Armor", bd.armor)}
                      {profSpecRow("Lighting", bd.lighting)}
                      {profSpecRow("Rack/Storage", bd.rack)}
                      {profSpecRow("Winch", bd.winch)}
                      {profSpecRow("Other Mods", bd.otherMods)}
                      {bd.hasCamper && (bd.camperMake || bd.camperModel) && (
                        <>
                          <div style={{ height: 1, background: T.charcoal, margin: "10px 0" }} />
                          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                            <Home size={12} color={T.copper} />
                            <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 1.5, fontWeight: 600 }}>CAMPER</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", gap: 10, marginBottom: 6 }}>
                            <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>Setup</span>
                            <span style={{ fontFamily: serif, fontSize: 12, color: T.white, textAlign: "right" }}>{bd.camperMake} {bd.camperModel}</span>
                          </div>
                          {bd.camperPhoto && bd.camperPhoto.length > 0 && (
                            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                              {bd.camperPhoto.map((p, pi) => (
                                <img key={pi} src={p.url} alt="" onClick={(e) => { e.stopPropagation(); collectAndOpenCarousel(ab, 0); }} style={{ width: 56, height: 56, borderRadius: 6, objectFit: "cover", cursor: "pointer" }} />
                              ))}
                            </div>
                          )}
                          {bd.camperLink && (
                            <div style={{ marginTop: 6 }}>
                              <a href={ensureUrl(bd.camperLink)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily: sans, fontSize: 10, color: T.copper, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 3 }}><ExternalLink size={9} /> View Product</a>
                            </div>
                          )}
                        </>
                      )}
                      {/* Photo thumbnails */}
                      {bd.mainPhotos && bd.mainPhotos.length > 1 && (
                        <>
                          <div style={{ height: 1, background: T.charcoal, margin: "10px 0" }} />
                          <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1.5, display: "block", marginBottom: 8 }}>PHOTOS</span>
                          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }}>
                            {bd.mainPhotos.map((p, pi) => (
                              <img key={pi} src={p.url} alt="" onClick={() => collectAndOpenCarousel(ab, pi)} style={{ width: 68, height: 68, borderRadius: 8, objectFit: "cover", flexShrink: 0, cursor: "pointer" }} />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <span style={{ fontFamily: serif, fontSize: 13, color: T.tertiary }}>No detailed specs available for this build.</span>
                  )}
                  {/* Action buttons */}
                  <div style={{ height: 1, background: T.charcoal, margin: "12px 0" }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    {ab.isUserBuild && (
                      <button onClick={() => setEditingBuild({ id: ab.id, buildData: bd })} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, background: `${T.copper}18`, border: `1px solid ${T.copper}30`, cursor: "pointer" }}>
                        <Settings size={14} color={T.copper} />
                        <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600, letterSpacing: 0.5 }}>EDIT BUILD</span>
                      </button>
                    )}
                    {ab.isUserBuild && (
                      <button onClick={() => setDeleteBuildConfirm(deleteBuildConfirm === ab.id ? null : ab.id)} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px 14px", borderRadius: 8, background: `${T.red}18`, border: `1px solid ${T.red}30`, cursor: "pointer" }}>
                        <Trash2 size={14} color={T.red} />
                      </button>
                    )}
                    <button onClick={() => { /* share */ }} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "10px", borderRadius: 8, background: T.charcoal, border: "none", cursor: "pointer" }}>
                      <Share2 size={14} color={T.white} />
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>SHARE</span>
                    </button>
                  </div>
                  {deleteBuildConfirm === ab.id && (
                    <div style={{ background: `${T.red}15`, border: `1px solid ${T.red}40`, borderRadius: 8, padding: 12, marginTop: 8 }}>
                      <p style={{ fontFamily: sans, fontSize: 12, color: T.white, margin: "0 0 8px" }}>Delete this build? This can't be undone.</p>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => { onDeleteBuild && onDeleteBuild(ab.id); setDeleteBuildConfirm(null); setExpandedProfileBuild(false); }} style={{ padding: "6px 14px", borderRadius: 6, background: T.red, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>Delete</button>
                        <button onClick={() => setDeleteBuildConfirm(null)} style={{ padding: "6px 14px", borderRadius: 6, background: T.charcoal, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.tertiary, fontWeight: 600, letterSpacing: 0.5 }}>Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            );
          })()}
        </div>
      )}

      {/* TRIPS TAB */}
      {activeTab === "trips" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {trips.map((t, i) => (
              <div key={i} style={{ ...cardStyle, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: T.charcoal, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Mountain size={16} color={T.copper} strokeWidth={1.5} />
                  <span style={{ fontFamily: sans, fontSize: 8, color: T.tertiary, marginTop: 2 }}>G{t.grade}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block", marginBottom: 2 }}>{t.name}</span>
                  <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                    <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>{t.date}</span>
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.copper }}>{t.distance}</span>
                  </div>
                </div>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, background: T.charcoal, padding: "4px 8px", borderRadius: 4 }}>{t.build}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ACTIVITY TAB */}
      {activeTab === "activity" && (
        <div style={{ padding: "0 16px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {activity.map((a, i) => (
              <div key={a.feedId || i} style={{ ...cardStyle, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: a.type === "forum" ? T.copper : T.red, background: a.type === "forum" ? `${T.copper}18` : `${T.red}18`, padding: "3px 8px", borderRadius: 4, letterSpacing: 1, fontWeight: 600 }}>{a.category}</span>
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{formatPostTime(a.time)}</span>
                  {a.isOwn && (
                    <div style={{ marginLeft: "auto", display: "flex", gap: 6 }}>
                      <button onClick={() => { setEditingPost(a.feedId); setEditPostText(a.title); setDeleteConfirmId(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Edit">
                        <Settings size={13} color={T.tertiary} />
                      </button>
                      <button onClick={() => { setDeleteConfirmId(deleteConfirmId === a.feedId ? null : a.feedId); setEditingPost(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 2 }} title="Delete">
                        <Trash2 size={13} color={T.tertiary} />
                      </button>
                    </div>
                  )}
                </div>
                {editingPost === a.feedId ? (
                  <div style={{ marginBottom: 8 }}>
                    <textarea value={editPostText} onChange={(e) => setEditPostText(e.target.value)} style={{ width: "100%", boxSizing: "border-box", padding: "10px 12px", borderRadius: 8, background: T.darkBg, border: `1px solid ${T.copper}`, color: T.white, fontFamily: serif, fontSize: 14, outline: "none", resize: "vertical", minHeight: 60, lineHeight: 1.5 }} />
                    <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                      <button onClick={() => { onEditPost && onEditPost(a.feedId, editPostText.trim()); setEditingPost(null); }} style={{ padding: "6px 14px", borderRadius: 6, background: T.green, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>Save</button>
                      <button onClick={() => setEditingPost(null)} style={{ padding: "6px 14px", borderRadius: 6, background: T.charcoal, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.tertiary, fontWeight: 600, letterSpacing: 0.5 }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <p style={{ fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 8px", lineHeight: 1.4 }}>{a.title}</p>
                )}
                {deleteConfirmId === a.feedId && (
                  <div style={{ background: `${T.red}15`, border: `1px solid ${T.red}40`, borderRadius: 8, padding: 12, marginBottom: 8 }}>
                    <p style={{ fontFamily: sans, fontSize: 12, color: T.white, margin: "0 0 8px" }}>Delete this post? This can't be undone.</p>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => { onDeletePost && onDeletePost(a.feedId); setDeleteConfirmId(null); }} style={{ padding: "6px 14px", borderRadius: 6, background: T.red, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>Delete</button>
                      <button onClick={() => setDeleteConfirmId(null)} style={{ padding: "6px 14px", borderRadius: 6, background: T.charcoal, border: "none", cursor: "pointer", fontFamily: sans, fontSize: 11, color: T.tertiary, fontWeight: 600, letterSpacing: 0.5 }}>Cancel</button>
                    </div>
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  {a.likes !== undefined && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Heart size={12} color={T.tertiary} strokeWidth={1.5} />
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.likes >= 1000 ? (a.likes / 1000).toFixed(1) + "K" : a.likes}</span>
                    </div>
                  )}
                  {a.comments !== undefined && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MessageCircle size={12} color={T.tertiary} strokeWidth={1.5} />
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.comments}</span>
                    </div>
                  )}
                  {a.replies !== undefined && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MessageCircle size={12} color={T.tertiary} strokeWidth={1.5} />
                      <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.replies} replies</span>
                    </div>
                  )}
                  {a.isOwn && (
                    <button onClick={() => onGoToPost && onGoToPost(a.feedId)} style={{ marginLeft: "auto", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4, padding: "4px 0" }}>
                      <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600, letterSpacing: 0.5 }}>VIEW POST</span>
                      <ChevronRight size={12} color={T.copper} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── OTHER USER PROFILE (Public view / Follow logic) ─── */
function OtherProfileScreen({ userId, onBack, onMessage }) {
  const [followState, setFollowState] = useState("none"); // none | requested | following
  const [activeTab, setActiveTab] = useState("builds");

  // Mock different user based on userId
  const profiles = {
    "Overland_Expert": { name: "Overland Expert", handle: "@Overland_Expert", badge: "Master Builder", followers: 2340, following: 412, points: 32100, isPublic: true, initial: "O",
      builds: [{ name: "PROJECT VULCAN", vehicle: "2022 Tacoma", tags: ["TACOMA 22", "35\" TIRES"], miles: "3,800", elevation: "112K ft", routes: 56 }],
      trips: [{ name: "Mojave Crossing", date: "Oct 1, 2025", distance: "180 mi", grade: 6 }],
      activity: [{ type: "post", title: "Stage 3 Suspension Complete", time: "3d ago", likes: 1200, comments: 84, category: "BUILD" }],
    },
    "DesertRat_4x4": { name: "DesertRat 4x4", handle: "@DesertRat_4x4", badge: "Navigator", followers: 1580, following: 320, points: 18400, isPublic: true, initial: "D",
      builds: [{ name: "SANDSTORM", vehicle: "2020 4Runner TRD Pro", tags: ["TRD PRO", "LONG TRAVEL"], miles: "5,200", elevation: "98K ft", routes: 72 }],
      trips: [{ name: "Black Rock Desert Expedition", date: "Oct 14, 2025", distance: "320 mi", grade: 5 }],
      activity: [{ type: "post", title: "Black Rock Desert Expedition convoy forming", time: "1d ago", likes: 42, comments: 8, category: "CONVOY" }],
    },
    "private_user": { name: "Ghost Rider", handle: "@GhostRider_OHV", badge: "Scout", followers: 89, following: 45, points: 2100, isPublic: false, initial: "G",
      builds: [], trips: [], activity: [],
    },
  };

  const p = profiles[userId] || profiles["Overland_Expert"];
  const isPrivateAndNotFollowing = !p.isPublic && followState !== "following";

  const handleFollow = () => {
    if (followState === "none") {
      setFollowState(p.isPublic ? "following" : "requested");
    } else if (followState === "following") {
      setFollowState("none");
    } else if (followState === "requested") {
      setFollowState("none");
    }
  };

  const tabs = ["builds", "trips", "activity"];

  return (
    <div style={{ padding: "0 0 16px" }}>
      {/* Profile Header */}
      <div style={{ padding: "24px 16px 0", textAlign: "center" }}>
        <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
          <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `3px solid ${p.isPublic ? T.copper : T.tertiary}` }}>
            <span style={{ fontFamily: sans, fontSize: 28, fontWeight: 700, color: T.white }}>{p.initial}</span>
          </div>
          {!p.isPublic && (
            <div style={{ position: "absolute", bottom: -2, right: -2, width: 24, height: 24, borderRadius: "50%", background: T.charcoal, border: `2px solid ${T.darkCard}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Lock size={10} color={T.copper} />
            </div>
          )}
        </div>
        <h2 style={{ fontFamily: sans, fontSize: 20, color: T.white, margin: "0 0 2px", fontWeight: 700 }}>{p.name}</h2>
        <span style={{ fontFamily: sans, fontSize: 13, color: T.tertiary, display: "block", marginBottom: 4 }}>{p.handle}</span>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: `${T.copper}18`, padding: "4px 10px", borderRadius: 12, marginBottom: 14 }}>
          <CheckCircle size={12} color={T.copper} />
          <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 1, fontWeight: 600 }}>{p.badge.toUpperCase()}</span>
        </div>

        {/* Follow + Message Buttons */}
        <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 16 }}>
          <button onClick={handleFollow} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: 1, border: "none", transition: "all 0.2s",
            background: followState === "none" ? T.red : followState === "requested" ? T.darkCard : T.darkCard,
            color: followState === "none" ? T.white : followState === "requested" ? T.copper : T.green,
            ...(followState !== "none" ? { border: `1px solid ${followState === "requested" ? T.copper : T.green}40` } : {}),
          }}>
            {followState === "none" && <><UserPlus size={14} /> FOLLOW</>}
            {followState === "requested" && <><Clock size={14} /> REQUESTED</>}
            {followState === "following" && <><UserCheck size={14} /> FOLLOWING</>}
          </button>
          <button onClick={() => onMessage && onMessage(userId)} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 24px", borderRadius: 8, cursor: "pointer", fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: 1, background: T.darkCard, border: `1px solid ${T.copper}40`, color: T.copper, transition: "all 0.2s" }}>
            <Mail size={14} /> MESSAGE
          </button>
        </div>

        {/* Stats Row */}
        <div style={{ display: "flex", justifyContent: "center", gap: 24, marginBottom: 16 }}>
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700, display: "block" }}>{p.followers.toLocaleString()}</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>FOLLOWERS</span>
          </div>
          <div style={{ width: 1, background: T.charcoal }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 18, color: T.white, fontWeight: 700, display: "block" }}>{p.following.toLocaleString()}</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>FOLLOWING</span>
          </div>
          <div style={{ width: 1, background: T.charcoal }} />
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: sans, fontSize: 18, color: T.copper, fontWeight: 700, display: "block" }}>{p.points.toLocaleString()}</span>
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>POINTS</span>
          </div>
        </div>
      </div>

      {/* Private Account Gate */}
      {isPrivateAndNotFollowing ? (
        <div style={{ padding: "40px 16px", textAlign: "center" }}>
          <Lock size={40} color={T.tertiary} strokeWidth={1} style={{ marginBottom: 12, opacity: 0.5 }} />
          <h3 style={{ fontFamily: sans, fontSize: 16, color: T.white, margin: "0 0 6px" }}>This Account is Private</h3>
          <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: 0, lineHeight: 1.6, maxWidth: 280, marginLeft: "auto", marginRight: "auto" }}>Follow this explorer to see their builds, trips, and activity on Trailhead.</p>
        </div>
      ) : (
        <>
          {/* Tab Bar */}
          <div style={{ display: "flex", borderBottom: `1px solid ${T.charcoal}`, margin: "0 16px", marginBottom: 16 }}>
            {tabs.map((t) => (
              <button key={t} onClick={() => setActiveTab(t)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", padding: "12px 0 10px", borderBottom: activeTab === t ? `2px solid ${T.red}` : "2px solid transparent" }}>
                <span style={{ fontFamily: sans, fontSize: 12, color: activeTab === t ? T.white : T.tertiary, letterSpacing: 1.5, fontWeight: 600 }}>{t.toUpperCase()}</span>
              </button>
            ))}
          </div>

          {/* Builds */}
          {activeTab === "builds" && p.builds.map((b, i) => (
            <div key={i} style={{ ...cardStyle, margin: "0 16px", overflow: "hidden" }}>
              <div style={{ height: 140, background: `linear-gradient(135deg, ${T.charcoal} 0%, ${T.tertiary}30 100%)`, position: "relative", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wrench size={50} color={T.tertiary} strokeWidth={0.2} style={{ opacity: 0.08 }} />
                </div>
                <div style={{ position: "relative", padding: 16 }}>
                  <div style={{ display: "flex", gap: 6, marginBottom: 4 }}>
                    {b.tags.map((tag, j) => (
                      <span key={j} style={{ fontFamily: sans, fontSize: 9, color: T.warmBg, background: "#3D3D3A", padding: "3px 8px", borderRadius: 4, letterSpacing: 1 }}>{tag}</span>
                    ))}
                  </div>
                  <h3 style={{ fontFamily: sans, fontSize: 24, color: T.warmBg, margin: 0, fontWeight: 700 }}>{b.name}</h3>
                  <span style={{ fontFamily: serif, fontSize: 12, color: T.tertiary }}>{b.vehicle}</span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", borderTop: `1px solid ${T.charcoal}` }}>
                <div style={{ padding: 12, textAlign: "center", borderRight: `1px solid ${T.charcoal}` }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>MILES</span>
                  <span style={{ fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }}>{b.miles}</span>
                </div>
                <div style={{ padding: 12, textAlign: "center", borderRight: `1px solid ${T.charcoal}` }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>ELEVATION</span>
                  <span style={{ fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }}>{b.elevation}</span>
                </div>
                <div style={{ padding: 12, textAlign: "center" }}>
                  <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary, letterSpacing: 1, display: "block" }}>ROUTES</span>
                  <span style={{ fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 700 }}>{b.routes}</span>
                </div>
              </div>
            </div>
          ))}

          {/* Trips */}
          {activeTab === "trips" && (
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              {p.trips.map((t, i) => (
                <div key={i} style={{ ...cardStyle, padding: "14px 16px", display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: 10, background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Mountain size={16} color={T.copper} strokeWidth={1.5} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }}>{t.name}</span>
                    <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>{t.date} — {t.distance}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Activity */}
          {activeTab === "activity" && (
            <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 6 }}>
              {p.activity.map((a, i) => (
                <div key={i} style={{ ...cardStyle, padding: "14px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                    <span style={{ fontFamily: sans, fontSize: 9, color: T.red, background: `${T.red}18`, padding: "3px 8px", borderRadius: 4, letterSpacing: 1 }}>{a.category}</span>
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{formatPostTime(a.time)}</span>
                  </div>
                  <p style={{ fontFamily: serif, fontSize: 14, color: T.white, margin: "0 0 6px" }}>{a.title}</p>
                  <div style={{ display: "flex", gap: 12 }}>
                    {a.likes !== undefined && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Heart size={12} color={T.tertiary} />
                        <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.likes >= 1000 ? (a.likes/1000).toFixed(1)+"K" : a.likes}</span>
                      </div>
                    )}
                    {a.comments !== undefined && (
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <MessageCircle size={12} color={T.tertiary} />
                        <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.comments}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ─── LOGIN SCREEN ─── */
function LoginScreen({ onLogin, onGoToSignup }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!email.trim()) return setError("Enter your email to continue.");
    if (!password) return setError("Enter your password.");
    setError("");
    onLogin();
  };

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 8,
    background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white,
    fontFamily: serif, fontSize: 14, outline: "none", transition: "border 0.2s",
  };
  const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };

  return (
    <div style={{ background: T.charcoal, height: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="th-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>

        {/* Hero / Brand Area */}
        <div style={{ padding: "48px 24px 32px", textAlign: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <Mountain size={28} color={T.red} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: sans, fontSize: 28, color: T.white, margin: "0 0 4px", fontWeight: 700, letterSpacing: 4 }}>TRAILHEAD</h1>
          <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, letterSpacing: 3 }}>BY LONE PEAK OVERLAND</span>
          <p style={{ fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "16px auto 0", maxWidth: 280, lineHeight: 1.6 }}>Your overlanding community. Routes, builds, convoys, and recovery — all in one place.</p>
        </div>

        {/* Login Form */}
        <div style={{ padding: "0 24px 32px", flex: 1 }}>
          {error && (
            <div style={{ background: `${T.red}15`, border: `1px solid ${T.red}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color={T.red} />
              <span style={{ fontFamily: serif, fontSize: 13, color: T.red }}>{error}</span>
            </div>
          )}

          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>EMAIL</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>PASSWORD</label>
            <div style={{ position: "relative" }}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Enter your password" style={{ ...inputStyle, paddingRight: 44 }} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
              <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                {showPassword ? <EyeOff size={16} color={T.tertiary} /> : <Eye size={16} color={T.tertiary} />}
              </button>
            </div>
          </div>

          <div style={{ textAlign: "right", marginBottom: 24 }}>
            <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, cursor: "pointer" }}>Forgot password?</span>
          </div>

          <button onClick={handleSubmit} style={{ width: "100%", padding: "14px 0", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", marginBottom: 16 }}>
            <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: T.white, letterSpacing: 1.5 }}>SIGN IN</span>
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ flex: 1, height: 1, background: T.charcoal }} />
            <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>OR</span>
            <div style={{ flex: 1, height: 1, background: T.charcoal }} />
          </div>

          {/* Social Login */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
            <button style={{ width: "100%", padding: "12px 0", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>Continue with Google</span>
            </button>
            <button style={{ width: "100%", padding: "12px 0", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>Continue with Apple</span>
            </button>
          </div>

          {/* Sign Up CTA */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: serif, fontSize: 13, color: T.tertiary }}>New to the trail? </span>
            <span onClick={onGoToSignup} style={{ fontFamily: sans, fontSize: 13, color: T.red, fontWeight: 600, cursor: "pointer" }}>Create an account</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── CREATE ACCOUNT SCREEN ─── */
function SignupScreen({ onSignup, onGoToLogin, onSetProfilePic }) {
  const [step, setStep] = useState(1); // 1 = account info, 2 = profile pic + rig survey
  const [form, setForm] = useState({ name: "", email: "", handle: "", password: "", confirmPassword: "" });
  const [rig, setRig] = useState({ year: "", make: "", model: "", buildName: "" });
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [signupPic, setSignupPic] = useState(null);
  const signupPicRef = useRef(null);

  const handlePicUpload = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSignupPic(ev.target.result);
      onSetProfilePic && onSetProfilePic(ev.target.result);
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const set = (key, val) => setForm({ ...form, [key]: val });
  const setR = (key, val) => setRig({ ...rig, [key]: val });

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "14px 16px", borderRadius: 8,
    background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white,
    fontFamily: serif, fontSize: 14, outline: "none", transition: "border 0.2s",
  };
  const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };

  const handleStep1 = () => {
    if (!form.name.trim()) return setError("Enter your name.");
    if (!form.email.trim()) return setError("Enter your email.");
    if (!form.handle.trim()) return setError("Choose a username.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords don't match.");
    setError("");
    setStep(2);
  };

  const handleFinish = () => {
    onSignup();
  };

  return (
    <div style={{ background: T.charcoal, height: "100vh", maxWidth: 430, margin: "0 auto", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div className="th-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0, display: "flex", flexDirection: "column" }}>

        {/* Header */}
        <div style={{ padding: "40px 24px 24px", textAlign: "center", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 8 }}>
            <Mountain size={24} color={T.red} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontFamily: sans, fontSize: 22, color: T.white, margin: "0 0 4px", fontWeight: 700, letterSpacing: 3 }}>
            {step === 1 ? "JOIN TRAILHEAD" : "SET UP YOUR PROFILE"}
          </h1>
          <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "8px auto 0", maxWidth: 300, lineHeight: 1.5 }}>
            {step === 1 ? "Create your account and join the overlanding community." : "Add a photo and your vehicle to personalize your experience. You can skip this for now."}
          </p>

          {/* Step indicator */}
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 16 }}>
            <div style={{ width: 32, height: 3, borderRadius: 2, background: T.red }} />
            <div style={{ width: 32, height: 3, borderRadius: 2, background: step >= 2 ? T.red : T.charcoal }} />
          </div>
        </div>

        {/* Step 1: Account Info */}
        {step === 1 && (
          <div style={{ padding: "0 24px 32px", flex: 1 }}>
            {error && (
              <div style={{ background: `${T.red}15`, border: `1px solid ${T.red}30`, borderRadius: 8, padding: "10px 14px", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                <AlertTriangle size={14} color={T.red} />
                <span style={{ fontFamily: serif, fontSize: 13, color: T.red }}>{error}</span>
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>FULL NAME</label>
              <input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="Kyle Morrison" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>EMAIL</label>
              <input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>USERNAME</label>
              <div style={{ position: "relative" }}>
                <span style={{ position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)", fontFamily: serif, fontSize: 14, color: T.tertiary }}>@</span>
                <input value={form.handle} onChange={(e) => set("handle", e.target.value)} placeholder="trailname" style={{ ...inputStyle, paddingLeft: 32 }} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>PASSWORD</label>
              <div style={{ position: "relative" }}>
                <input type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => set("password", e.target.value)} placeholder="At least 6 characters" style={{ ...inputStyle, paddingRight: 44 }} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
                <button onClick={() => setShowPassword(!showPassword)} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                  {showPassword ? <EyeOff size={16} color={T.tertiary} /> : <Eye size={16} color={T.tertiary} />}
                </button>
              </div>
            </div>
            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>CONFIRM PASSWORD</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => set("confirmPassword", e.target.value)} placeholder="Re-enter your password" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>

            <button onClick={handleStep1} style={{ width: "100%", padding: "14px 0", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", marginBottom: 16 }}>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: T.white, letterSpacing: 1.5 }}>CONTINUE</span>
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1, height: 1, background: T.charcoal }} />
              <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1 }}>OR</span>
              <div style={{ flex: 1, height: 1, background: T.charcoal }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 24 }}>
              <button style={{ width: "100%", padding: "12px 0", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>Sign up with Google</span>
              </button>
              <button style={{ width: "100%", padding: "12px 0", borderRadius: 8, background: T.darkCard, border: `1px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="#FFFFFF"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/></svg>
                <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>Sign up with Apple</span>
              </button>
            </div>

            <div style={{ textAlign: "center" }}>
              <span style={{ fontFamily: serif, fontSize: 13, color: T.tertiary }}>Already have an account? </span>
              <span onClick={onGoToLogin} style={{ fontFamily: sans, fontSize: 13, color: T.red, fontWeight: 600, cursor: "pointer" }}>Sign in</span>
            </div>
          </div>
        )}

        {/* Step 2: Profile Pic + Rig Survey */}
        {step === 2 && (
          <div style={{ padding: "0 24px 32px", flex: 1 }}>
            {/* Profile Photo Section */}
            <input ref={signupPicRef} type="file" accept="image/*" onChange={handlePicUpload} style={{ display: "none" }} />
            <div style={{ background: T.darkCard, borderRadius: 12, padding: 20, marginBottom: 20, textAlign: "center" }}>
              <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                {signupPic ? (
                  <img src={signupPic} alt="" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: `3px solid ${T.copper}` }} />
                ) : (
                  <div style={{ width: 80, height: 80, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `3px dashed ${T.copper}40` }}>
                    <Camera size={28} color={T.copper} strokeWidth={1.2} style={{ opacity: 0.5 }} />
                  </div>
                )}
                <button onClick={() => signupPicRef.current && signupPicRef.current.click()} style={{ position: "absolute", bottom: -2, right: -2, width: 28, height: 28, borderRadius: "50%", background: T.copper, border: `2px solid ${T.darkCard}`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Plus size={14} color={T.white} />
                </button>
              </div>
              <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block", marginBottom: 2 }}>Add a Profile Photo</span>
              <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>Help others recognize you on the trail</span>
              {!signupPic && (
                <button onClick={() => signupPicRef.current && signupPicRef.current.click()} style={{ display: "block", margin: "12px auto 0", padding: "8px 20px", borderRadius: 8, background: `${T.copper}20`, border: `1px solid ${T.copper}40`, cursor: "pointer" }}>
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600, letterSpacing: 0.5 }}>UPLOAD PHOTO</span>
                </button>
              )}
              {signupPic && (
                <button onClick={() => signupPicRef.current && signupPicRef.current.click()} style={{ display: "inline-block", margin: "10px auto 0", padding: "6px 14px", borderRadius: 6, background: "transparent", border: `1px solid ${T.charcoal}`, cursor: "pointer" }}>
                  <span style={{ fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 0.5 }}>CHANGE PHOTO</span>
                </button>
              )}
            </div>

            <div style={{ background: T.darkCard, borderRadius: 12, padding: 20, marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: `${T.red}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Wrench size={18} color={T.red} />
                </div>
                <div>
                  <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }}>Your First Build</span>
                  <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>You can add more vehicles later</span>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>BUILD NAME</label>
                <input value={rig.buildName} onChange={(e) => setR("buildName", e.target.value)} placeholder='e.g. "The Highlander"' style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>YEAR</label>
                  <input value={rig.year} onChange={(e) => setR("year", e.target.value)} placeholder="2022" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
                </div>
                <div>
                  <label style={labelStyle}>MAKE</label>
                  <input value={rig.make} onChange={(e) => setR("make", e.target.value)} placeholder="Toyota" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
                </div>
              </div>
              <div>
                <label style={labelStyle}>MODEL</label>
                <input value={rig.model} onChange={(e) => setR("model", e.target.value)} placeholder="Tundra TRD Pro" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
              </div>
            </div>

            {/* Profile visibility */}
            <div style={{ background: T.darkCard, borderRadius: 12, padding: 16, marginBottom: 24, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Globe size={16} color={T.green} />
                <div>
                  <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>Public Profile</span>
                  <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>Others can see your builds and activity</span>
                </div>
              </div>
              <div style={{ width: 40, height: 22, borderRadius: 11, background: T.green, padding: 2, cursor: "pointer", display: "flex", alignItems: "center" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: T.white, marginLeft: 18, transition: "margin 0.2s" }} />
              </div>
            </div>

            <button onClick={handleFinish} style={{ width: "100%", padding: "14px 0", borderRadius: 8, background: T.red, border: "none", cursor: "pointer", marginBottom: 12 }}>
              <span style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: T.white, letterSpacing: 1.5 }}>CREATE ACCOUNT</span>
            </button>
            <button onClick={handleFinish} style={{ width: "100%", padding: "12px 0", borderRadius: 8, background: "transparent", border: "none", cursor: "pointer" }}>
              <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary, letterSpacing: 0.5 }}>Skip for now</span>
            </button>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: "0 24px 24px", textAlign: "center", flexShrink: 0 }}>
          <span style={{ fontFamily: serif, fontSize: 10, color: T.textGray, lineHeight: 1.6 }}>By continuing you agree to Trailhead's Terms of Service and Privacy Policy</span>
        </div>
      </div>
    </div>
  );
}

/* ─── PHOTO UPLOADER COMPONENT ─── */
function PhotoUploader({ photos, onChange, maxPhotos = 10, compact = false }) {
  const fileRef = useRef(null);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    const allowed = files.slice(0, maxPhotos - photos.length);
    if (fileRef.current) fileRef.current.value = "";
    let loaded = 0;
    const results = [];
    allowed.forEach((file, idx) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        results[idx] = { id: Date.now() + Math.random(), url: ev.target.result, name: file.name };
        loaded++;
        if (loaded === allowed.length) {
          onChange([...photos, ...results]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (id) => {
    onChange(photos.filter(p => p.id !== id));
  };

  if (compact) {
    return (
      <>
        <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
        <button onClick={() => fileRef.current && fileRef.current.click()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
          <Image size={20} color={T.tertiary} />
        </button>
        {photos.length > 0 && (
          <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }}>{photos.length}</span>
        )}
      </>
    );
  }

  return (
    <div>
      <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} style={{ display: "none" }} />
      {photos.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 10, overflowX: "auto", paddingBottom: 4 }}>
          {photos.map((p) => (
            <div key={p.id} style={{ position: "relative", flexShrink: 0 }}>
              <img src={p.url} alt={p.name} style={{ width: 72, height: 72, borderRadius: 8, objectFit: "cover", display: "block", border: `1px solid ${T.charcoal}` }} />
              <button onClick={() => removePhoto(p.id)} style={{ position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: "50%", background: T.red, border: `2px solid ${T.darkBg}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                <X size={10} color={T.white} />
              </button>
            </div>
          ))}
        </div>
      )}
      <button onClick={() => { if (photos.length < maxPhotos && fileRef.current) fileRef.current.click(); }} style={{ display: "flex", alignItems: "center", gap: 8, background: T.darkCard, border: `1px dashed ${T.charcoal}`, borderRadius: 8, padding: "12px 16px", cursor: photos.length < maxPhotos ? "pointer" : "default", width: "100%", boxSizing: "border-box", opacity: photos.length < maxPhotos ? 1 : 0.5 }}>
        <Camera size={16} color={T.tertiary} />
        <span style={{ fontFamily: sans, fontSize: 12, color: T.tertiary }}>
          {photos.length > 0 ? `${photos.length} photo${photos.length > 1 ? "s" : ""} added` : "Add photos"}
        </span>
        {photos.length < maxPhotos && <Plus size={14} color={T.tertiary} style={{ marginLeft: "auto" }} />}
      </button>
    </div>
  );
}

/* ─── COMPOSE / CREATE POST SCREEN ─── */
function ComposeScreen({ onClose, onSubmit, onAddRecoveryAlert, onAddNotification, onAddRoute }) {
  const [postType, setPostType] = useState(null); // null = picker, "general" | "route" | "convoy" | "recovery"
  const [general, setGeneral] = useState({ text: "", photos: [], location: "" });
  const [showLocationInput, setShowLocationInput] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoMsg, setGeoMsg] = useState("");
  const [showRouteForm, setShowRouteForm] = useState(false);
  const [route, setRoute] = useState({ name: "", distance: "", time: "", elevation: "", difficulty: "Moderate", description: "", photos: [] });
  const [convoy, setConvoy] = useState({ title: "", location: "", departDate: "", departTime: "", returnDate: "", returnTime: "", slots: "", description: "" });
  const [recovery, setRecovery] = useState({ title: "", vehicle: "", description: "", urgency: "HIGH", location: "", coords: "" });

  const inputStyle = {
    width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 8,
    background: T.darkCard, border: `1px solid ${T.charcoal}`, color: T.white,
    fontFamily: serif, fontSize: 14, outline: "none", transition: "border 0.2s",
  };
  const labelStyle = { fontFamily: sans, fontSize: 10, color: T.tertiary, letterSpacing: 1.5, fontWeight: 600, display: "block", marginBottom: 6 };
  const textareaStyle = { ...inputStyle, minHeight: 80, resize: "vertical", lineHeight: 1.6 };

  const types = [
    { key: "general", label: "Post", desc: "Share photos, updates, or trail stories", icon: Camera, color: T.copper },
    { key: "route", label: "Route", desc: "Upload a route with stats and GPS track", icon: Map, color: T.green },
    { key: "convoy", label: "Convoy / Event", desc: "Organize a group trip with dates and slots", icon: Users, color: T.copper },
    { key: "recovery", label: "Recovery Request", desc: "Request help from nearby overlanders", icon: AlertTriangle, color: T.red },
  ];

  const handleSubmit = () => {
    const id = "user_" + Date.now();
    let newPost = null;
    if (postType === "general") {
      if (!general.text.trim() && general.photos.length === 0) return;
      const hasPhotos = general.photos.length > 0;
      newPost = {
        id, type: hasPhotos ? "PHOTOS" : "POST", user: "KyleLPO", initial: "K", time: Date.now(),
        title: general.text.trim() || "New post",
        body: null,
        ...(hasPhotos ? { photoCount: general.photos.length, photoUrls: general.photos.map(p => p.url) } : {}),
        ...(general.location ? { location: general.location } : {}),
        likes: 0, comments: 0,
      };
    } else if (postType === "route") {
      if (!route.name.trim()) return;
      newPost = {
        id, type: "ROUTES", user: "KyleLPO", initial: "K", time: Date.now(),
        title: route.name, body: route.description || null,
        distance: route.distance || "—", duration: route.time || "—",
        badge: null, verified: 0,
        likes: 0, comments: 0,
      };
    } else if (postType === "convoy") {
      if (!convoy.title.trim()) return;
      const d = convoy.departDate ? new Date(convoy.departDate) : null;
      newPost = {
        id, type: "CONVOYS", user: "KyleLPO", initial: "K", time: Date.now(),
        title: convoy.title, body: convoy.description || null,
        month: d ? d.toLocaleString("en", { month: "short" }).toUpperCase() : "TBD",
        day: d ? String(d.getDate()) : "—",
        departs: convoy.departTime || "TBD", slots: parseInt(convoy.slots) || 0,
        likes: 0, comments: 0,
      };
    } else if (postType === "recovery") {
      if (!recovery.title.trim()) return;
      const hasRecPhotos = recoveryPhotos.length > 0;
      newPost = {
        id, type: "RECOVERY", user: "KyleLPO", initial: "K", time: Date.now(),
        title: recovery.title, body: recovery.description || null,
        location: recovery.location || "Unknown", urgency: recovery.urgency,
        coords: recovery.coords || "—",
        ...(hasRecPhotos ? { photoCount: recoveryPhotos.length, photoUrls: recoveryPhotos.map(p => p.url) } : {}),
        ...(recovery.vehicle ? { vehicle: recovery.vehicle } : {}),
        likes: 0, comments: 0,
      };
      // Trigger recovery alert for all users
      onAddRecoveryAlert && onAddRecoveryAlert({
        id: "rec_" + Date.now(),
        title: recovery.title,
        location: recovery.location || "Unknown",
        coords: recovery.coords || "—",
        urgency: recovery.urgency,
        time: Date.now(),
        vehicle: recovery.vehicle || "",
        detail: recovery.description || "",
        author: "KyleLPO",
      });
      onAddNotification && onAddNotification({
        type: "recovery",
        user: "KyleLPO",
        text: "posted a recovery request",
        target: recovery.title,
        icon: AlertTriangle,
        iconColor: T.red,
      });
    }
    if (newPost) {
      onSubmit && onSubmit(newPost);
      // Send mention notifications for @tagged users in the post
      const postText = newPost.title || "";
      const mentions = extractMentions(postText);
      mentions.forEach(handle => {
        if (handle !== "KyleLPO") {
          onAddNotification && onAddNotification({ type: "mention", user: "KyleLPO", text: "mentioned you in a post", target: newPost.title, icon: AtSign, iconColor: T.copper });
        }
      });
    }
    onClose();
  };

  const [recoveryPhotos, setRecoveryPhotos] = useState([]);
  const [recGeoLoading, setRecGeoLoading] = useState(false);
  const [recGeoMsg, setRecGeoMsg] = useState("");

  // Route form overlay — uses the same RouteDetailsForm as the Routes page
  if (showRouteForm) {
    return (
      <RouteDetailsForm
        isManual
        onBack={() => setShowRouteForm(false)}
        onPublish={(routeData) => {
          const id = "user_" + Date.now();
          const newPost = {
            id, type: "ROUTES", user: "KyleLPO", initial: "K", time: Date.now(),
            title: routeData.name,
            body: routeData.desc || null,
            distance: routeData.distance ? routeData.distance + " MI" : "—",
            duration: routeData.time || "—",
            badge: null, verified: 0,
            likes: 0, comments: 0,
            difficulty: routeData.difficulty || "Moderate",
            elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "—",
            location: routeData.location || "",
            terrains: routeData.terrains || [],
            tags: routeData.tags || [],
            photos: routeData.photos || [],
            pins: routeData.pins || [],
          };
          if (routeData.shareToFeed) {
            onSubmit && onSubmit(newPost);
          }
          onAddRoute && onAddRoute({
            id,
            name: routeData.name,
            desc: routeData.desc || "",
            difficulty: routeData.difficulty || "Moderate",
            distance: routeData.distance ? routeData.distance + " MI" : "—",
            time: routeData.time || "—",
            elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "—",
            location: routeData.location || "",
            terrains: routeData.terrains || [],
            tags: routeData.tags || [],
            pins: routeData.pins || [],
            photos: routeData.photos || [],
            rating: null,
            reviews: 0,
            author: "KyleLPO",
            createdAt: Date.now(),
          });
          setShowRouteForm(false);
          onClose && onClose();
        }}
      />
    );
  }

  // Type picker
  if (!postType) {
    return (
      <div style={{ padding: "0 0 16px" }}>
        <div style={{ padding: "20px 16px 8px" }}>
          <h2 style={{ fontFamily: sans, fontSize: 20, color: T.white, margin: "0 0 4px", fontWeight: 700 }}>Create Post</h2>
          <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: 0 }}>What would you like to share?</p>
        </div>
        <div style={{ padding: "8px 16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {types.map((t) => {
            const Icon = t.icon;
            return (
              <button key={t.key} onClick={() => { if (t.key === "route") { setShowRouteForm(true); } else { setPostType(t.key); } }} style={{ display: "flex", alignItems: "center", gap: 14, background: T.darkCard, borderRadius: 12, padding: "16px", border: "none", cursor: "pointer", textAlign: "left", width: "100%", boxSizing: "border-box", transition: "background 0.15s" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: `${t.color}15`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={20} color={t.color} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <span style={{ fontFamily: sans, fontSize: 15, color: T.white, fontWeight: 600, display: "block", marginBottom: 2 }}>{t.label}</span>
                  <span style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, lineHeight: 1.4 }}>{t.desc}</span>
                </div>
                <ChevronRight size={18} color={T.tertiary} />
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  const currentType = types.find(t => t.key === postType);
  const TypeIcon = currentType.icon;

  return (
    <div style={{ padding: "0 0 16px" }}>
      {/* Header with type badge */}
      <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={() => setPostType(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ChevronLeft size={20} color={T.white} />
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ width: 28, height: 28, borderRadius: 6, background: `${currentType.color}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TypeIcon size={14} color={currentType.color} />
            </div>
            <span style={{ fontFamily: sans, fontSize: 16, color: T.white, fontWeight: 600 }}>New {currentType.label}</span>
          </div>
        </div>
        <button onClick={handleSubmit} style={{ background: T.red, padding: "8px 18px", borderRadius: 6, border: "none", cursor: "pointer" }}>
          <span style={{ fontFamily: sans, fontSize: 12, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>POST</span>
        </button>
      </div>

      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 14 }}>

        {/* ── GENERAL POST ── */}
        {postType === "general" && (
          <>
            <div>
              <label style={labelStyle}>WHAT'S ON YOUR MIND?</label>
              <MentionInput multiline value={general.text} onChange={(val) => setGeneral({ ...general, text: val })} placeholder="Share a trail story, a build update, a question for the community..." style={textareaStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>
            <PhotoUploader photos={general.photos} onChange={(p) => setGeneral({ ...general, photos: p })} />
            {!showLocationInput && !general.location ? (
              <button onClick={() => setShowLocationInput(true)} style={{ width: "100%", background: T.darkCard, borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10, border: "none", cursor: "pointer", textAlign: "left" }}>
                <MapPin size={16} color={T.tertiary} />
                <span style={{ fontFamily: serif, fontSize: 13, color: T.tertiary }}>Add location (optional)</span>
              </button>
            ) : (
              <div style={{ background: T.darkCard, borderRadius: 8, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <MapPin size={16} color={general.location ? T.copper : T.tertiary} />
                  <input
                    autoFocus
                    value={general.location}
                    onChange={(e) => setGeneral({ ...general, location: e.target.value })}
                    placeholder="e.g. Moab, UT or Black Bear Pass"
                    style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, padding: 0 }}
                  />
                  {general.location && (
                    <button onClick={() => { setGeneral({ ...general, location: "" }); setShowLocationInput(false); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                      <X size={14} color={T.tertiary} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => {
                    setGeoMsg("");
                    if (!navigator.geolocation) {
                      setGeoMsg("Geolocation is not supported by this browser.");
                      return;
                    }
                    setGeoLoading(true);
                    try {
                      navigator.geolocation.getCurrentPosition(
                        async (pos) => {
                          const lat = pos.coords.latitude;
                          const lon = pos.coords.longitude;
                          try {
                            const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
                            const data = await res.json();
                            const addr = data.address || {};
                            const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || "";
                            const state = addr.state || "";
                            const country = addr.country_code ? addr.country_code.toUpperCase() : "";
                            const parts = [city, state].filter(Boolean);
                            const label = parts.length > 0 ? (country === "US" ? parts.join(", ") : [...parts, country].join(", ")) : `${lat.toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
                            setGeneral(prev => ({ ...prev, location: label }));
                          } catch {
                            setGeneral(prev => ({ ...prev, location: `${lat.toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}` }));
                          }
                          setGeoLoading(false);
                          setGeoMsg("");
                        },
                        (err) => {
                          setGeoLoading(false);
                          if (err.code === 1) setGeoMsg("Location access denied. Enable permissions in browser settings.");
                          else if (err.code === 2) setGeoMsg("Location unavailable. This may not work in preview — try on the deployed site.");
                          else setGeoMsg("Location request timed out. Try again or type a location manually.");
                        },
                        { enableHighAccuracy: true, timeout: 10000 }
                      );
                    } catch (e) {
                      setGeoLoading(false);
                      setGeoMsg("Location not available in this environment. Type your location manually.");
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: "8px 0 0 26px" }}
                >
                  <Navigation size={12} color={T.copper} />
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.copper, fontWeight: 600, letterSpacing: 0.5 }}>
                    {geoLoading ? "Getting location..." : "Use current location"}
                  </span>
                </button>
                {geoMsg && (
                  <p style={{ fontFamily: serif, fontSize: 11, color: T.red, margin: "6px 0 0 26px", lineHeight: 1.4 }}>{geoMsg}</p>
                )}
              </div>
            )}
          </>
        )}

        {/* Route form is now handled by RouteDetailsForm overlay */}

        {/* ── CONVOY / EVENT ── */}
        {postType === "convoy" && (
          <>
            <div>
              <label style={labelStyle}>TRIP NAME</label>
              <input value={convoy.title} onChange={(e) => setConvoy({ ...convoy, title: e.target.value })} placeholder="e.g. Alpine Summit Chase" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>
            <div>
              <label style={labelStyle}>LOCATION</label>
              <div style={{ position: "relative" }}>
                <MapPin size={14} color={T.tertiary} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input value={convoy.location} onChange={(e) => setConvoy({ ...convoy, location: e.target.value })} placeholder="Gerlach, Nevada" style={{ ...inputStyle, paddingLeft: 36 }} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={labelStyle}>DEPARTURE DATE</label>
                <input type="date" value={convoy.departDate} onChange={(e) => setConvoy({ ...convoy, departDate: e.target.value })} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
              <div>
                <label style={labelStyle}>DEPARTURE TIME</label>
                <input type="time" value={convoy.departTime} onChange={(e) => setConvoy({ ...convoy, departTime: e.target.value })} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={labelStyle}>RETURN DATE</label>
                <input type="date" value={convoy.returnDate} onChange={(e) => setConvoy({ ...convoy, returnDate: e.target.value })} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
              <div>
                <label style={labelStyle}>RETURN TIME</label>
                <input type="time" value={convoy.returnTime} onChange={(e) => setConvoy({ ...convoy, returnTime: e.target.value })} style={{ ...inputStyle, colorScheme: "dark" }} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>MAX RIGS</label>
              <input value={convoy.slots} onChange={(e) => setConvoy({ ...convoy, slots: e.target.value })} placeholder="e.g. 12" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>
            <div>
              <label style={labelStyle}>DETAILS</label>
              <textarea value={convoy.description} onChange={(e) => setConvoy({ ...convoy, description: e.target.value })} placeholder="Describe the trip — terrain difficulty, what to bring, stock-friendly or not..." style={textareaStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>
          </>
        )}

        {/* ── RECOVERY REQUEST ── */}
        {postType === "recovery" && (
          <>
            <div style={{ background: `${T.red}12`, borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 8 }}>
              <AlertTriangle size={14} color={T.red} />
              <span style={{ fontFamily: serif, fontSize: 12, color: T.red, lineHeight: 1.4 }}>This will alert nearby Trailhead members. Use only for genuine recovery needs.</span>
            </div>
            <div>
              <label style={labelStyle}>URGENCY</label>
              <div style={{ display: "flex", gap: 8 }}>
                {["HIGH", "LOW"].map((u) => (
                  <button key={u} onClick={() => setRecovery({ ...recovery, urgency: u })} style={{ flex: 1, padding: "12px 0", borderRadius: 6, cursor: "pointer", fontFamily: sans, fontSize: 12, fontWeight: 600, letterSpacing: 1, border: "none", background: recovery.urgency === u ? (u === "HIGH" ? T.red : T.copper) : T.darkCard, color: recovery.urgency === u ? T.white : T.tertiary, transition: "all 0.15s" }}>{u}</button>
                ))}
              </div>
            </div>
            <div>
              <label style={labelStyle}>WHAT HAPPENED?</label>
              <input value={recovery.title} onChange={(e) => setRecovery({ ...recovery, title: e.target.value })} placeholder="e.g. Stuck in mud, need winch assist" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>
            <div>
              <label style={labelStyle}>VEHICLE</label>
              <input value={recovery.vehicle} onChange={(e) => setRecovery({ ...recovery, vehicle: e.target.value })} placeholder="e.g. 2022 Jeep Gladiator on 37s" style={inputStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>
            <div>
              <label style={labelStyle}>DETAILS</label>
              <textarea value={recovery.description} onChange={(e) => setRecovery({ ...recovery, description: e.target.value })} placeholder="Describe your situation — what you need, injuries, losing daylight, etc." style={textareaStyle} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
            </div>
            <div>
              <label style={labelStyle}>LOCATION</label>
              <div style={{ position: "relative" }}>
                <MapPin size={14} color={T.tertiary} style={{ position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)" }} />
                <input value={recovery.location} onChange={(e) => setRecovery({ ...recovery, location: e.target.value })} placeholder="Black Bear Pass, CO" style={{ ...inputStyle, paddingLeft: 36 }} onFocus={(e) => e.target.style.borderColor = T.copper} onBlur={(e) => e.target.style.borderColor = T.charcoal} />
              </div>
            </div>
            <button onClick={() => {
              setRecGeoMsg("");
              if (!navigator.geolocation) { setRecGeoMsg("Geolocation not supported by this browser."); return; }
              setRecGeoLoading(true);
              try {
                navigator.geolocation.getCurrentPosition(
                  async (pos) => {
                    const lat = pos.coords.latitude;
                    const lon = pos.coords.longitude;
                    const coordStr = `${lat.toFixed(4)}° ${lat >= 0 ? "N" : "S"}, ${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
                    setRecovery(prev => ({ ...prev, coords: coordStr }));
                    try {
                      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`);
                      const data = await res.json();
                      const addr = data.address || {};
                      const city = addr.city || addr.town || addr.village || addr.hamlet || addr.county || "";
                      const state = addr.state || "";
                      const country = addr.country_code ? addr.country_code.toUpperCase() : "";
                      const parts = [city, state].filter(Boolean);
                      const label = parts.length > 0 ? (country === "US" ? parts.join(", ") : [...parts, country].join(", ")) : coordStr;
                      setRecovery(prev => ({ ...prev, location: label }));
                    } catch {
                      setRecovery(prev => ({ ...prev, location: coordStr }));
                    }
                    setRecGeoLoading(false);
                    setRecGeoMsg("");
                  },
                  (err) => {
                    setRecGeoLoading(false);
                    if (err.code === 1) setRecGeoMsg("Location access denied. Enable permissions in browser settings.");
                    else if (err.code === 2) setRecGeoMsg("Location unavailable. This may not work in preview — try on the deployed site.");
                    else setRecGeoMsg("Location request timed out. Try again or type location manually.");
                  },
                  { enableHighAccuracy: true, timeout: 10000 }
                );
              } catch (e) {
                setRecGeoLoading(false);
                setRecGeoMsg("Location not available in this environment. Type your location manually.");
              }
            }} style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: T.darkCard, border: `1px dashed ${T.charcoal}`, borderRadius: 8, padding: "14px", cursor: "pointer", width: "100%", boxSizing: "border-box" }}>
              <Navigation size={16} color={T.copper} />
              <span style={{ fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600 }}>
                {recGeoLoading ? "Getting location..." : "Use Current GPS Location"}
              </span>
            </button>
            {recGeoMsg && (
              <p style={{ fontFamily: serif, fontSize: 11, color: T.red, margin: "6px 0 0", lineHeight: 1.4 }}>{recGeoMsg}</p>
            )}
            <PhotoUploader photos={recoveryPhotos} onChange={setRecoveryPhotos} />
          </>
        )}
      </div>
    </div>
  );
}

/* ─── RECOVERY PAGE (Full screen) ─── */
function RecoveryScreen({ onOpenMap, onOpenDM }) {
  const [filter, setFilter] = useState("ALL");
  const allAlerts = [
    { title: "Winch Support Required", location: "Black Bear Pass, CO", coords: "37.8106° N, 107.6992° W", urgency: "HIGH", time: "2m ago", vehicle: "Jeep Gladiator on 37s", detail: "High-centered on a shelf. Front locker acting up. Need a heavy rig with at least 12k winch to assist.", responses: 3, author: "DesertRat_4x4" },
    { title: "Tow Needed — Broken Axle", location: "Rubicon Trail, CA", coords: "38.9764° N, 120.1572° W", urgency: "HIGH", time: "25m ago", vehicle: "2018 Wrangler JL", detail: "Front axle snapped at the birfield. Cannot move under own power. Closest trailhead is 6 miles out.", responses: 7, author: "StockHero" },
    { title: "Flat Tire Assist", location: "Moab, UT", coords: "38.5733° N, 109.5498° W", urgency: "LOW", time: "1h ago", vehicle: "Toyota 4Runner", detail: "Spare is wrong size. Need 285/70R17 or close. Parked safely off-trail.", responses: 1, author: "DirtRoadDave" },
    { title: "Overheated Radiator — Stranded", location: "Johnson Valley, CA", coords: "34.3525° N, 116.4572° W", urgency: "HIGH", time: "3h ago", vehicle: "2016 Toyota Tacoma", detail: "Radiator hose blew on the lakebed. No cell service. Spotted via InReach.", responses: 5, author: "FoxFanatic" },
    { title: "Lost on Trail — Need GPS Guidance", location: "Uwharrie NF, NC", coords: "35.3894° N, 80.0674° W", urgency: "LOW", time: "5h ago", vehicle: "Ford Bronco", detail: "Took a wrong fork and can't find the main trail. No injuries, plenty of fuel.", responses: 12, author: "LiftKing" },
    { title: "Stuck in Deep Mud", location: "North Fork Crossing, OR", coords: "45.8923° N, 121.3482° W", urgency: "RESOLVED", time: "8h ago", vehicle: "Jeep Gladiator on 37s", detail: "Winch overheating. Vehicle recovered by @Peak_Finder.", responses: 24, author: "BajaBound" },
  ];

  const filters = ["ALL", "HIGH", "LOW", "RESOLVED"];
  const filtered = filter === "ALL" ? allAlerts : allAlerts.filter(a => a.urgency === filter);
  const urgencyColor = (u) => u === "HIGH" ? T.red : u === "RESOLVED" ? T.green : T.copper;

  return (
    <div style={{ padding: "0 0 16px" }}>
      {/* Header */}
      <div style={{ padding: "16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontFamily: sans, fontSize: 20, color: T.white, margin: "0 0 4px", fontWeight: 700 }}>Recovery Board</h2>
          <span style={{ fontFamily: serif, fontSize: 12, color: T.tertiary }}>{allAlerts.filter(a => a.urgency !== "RESOLVED").length} active requests nearby</span>
        </div>
        <button style={{ background: T.red, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
          <AlertTriangle size={14} color={T.white} />
          <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 600, letterSpacing: 0.5 }}>REQUEST HELP</span>
        </button>
      </div>

      {/* Filter */}
      <div className="th-hscroll" style={{ display: "flex", gap: 8, padding: "0 16px 14px", overflowX: "auto" }}>
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)} style={pill(filter === f)}>{f}</button>
        ))}
      </div>

      {/* Alert Cards */}
      <div style={{ padding: "0 16px", display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map((a, i) => (
          <div key={i} style={{ ...cardStyle, overflow: "hidden" }}>
            <div style={{ background: `${urgencyColor(a.urgency)}12`, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.white, background: urgencyColor(a.urgency), padding: "2px 7px", borderRadius: 3, letterSpacing: 1, fontWeight: 600 }}>{a.urgency}</span>
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{formatPostTime(a.time)}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <Users size={12} color={T.tertiary} />
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.responses} responding</span>
              </div>
            </div>
            <div style={{ padding: 16 }}>
              <p style={{ fontFamily: sans, fontSize: 15, color: T.white, margin: "0 0 4px", fontWeight: 600 }}>{a.title}</p>
              <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: "0 0 10px", lineHeight: 1.5 }}>{a.detail}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={12} color={T.tertiary} />
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.location}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Navigation size={12} color={T.tertiary} />
                  <span style={{ fontFamily: serif, fontSize: 11, color: T.tertiary }}>{a.coords}</span>
                </div>
                <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{a.vehicle}</span>
              </div>
              {a.urgency !== "RESOLVED" ? (
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={() => onOpenDM && onOpenDM(a.author)} style={{ background: T.red, color: T.white, fontFamily: sans, fontSize: 11, fontWeight: 600, padding: "9px 18px", borderRadius: 6, border: "none", cursor: "pointer", letterSpacing: 0.5 }}>RESPOND</button>
                  <button onClick={() => onOpenMap && onOpenMap(a.coords, a.location, a.title)} style={{ background: "none", color: T.tertiary, fontFamily: sans, fontSize: 11, padding: "9px 18px", borderRadius: 6, border: `1px solid ${T.charcoal}`, cursor: "pointer", letterSpacing: 0.5 }}>VIEW ON MAP</button>
                </div>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <CheckCircle size={14} color={T.green} />
                  <span style={{ fontFamily: sans, fontSize: 11, color: T.green, fontWeight: 600, letterSpacing: 0.5 }}>RESOLVED</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── DIRECT MESSAGES ─── */
const dmConversations = [
  { id: "dm1", user: "TrailBoss_88", initial: "T", name: "TrailBoss 88", badge: "Explorer", online: true, unread: 2,
    messages: [
      { id: 1, from: "TrailBoss_88", text: "Hey, saw your suspension build post. What size shocks did you end up going with?", time: "2:15 PM" },
      { id: 2, from: "me", text: "Went with Icon 2.5 VS RR — couldn't be happier with the ride quality on and off road.", time: "2:18 PM" },
      { id: 3, from: "TrailBoss_88", text: "Nice! I've been debating between those and the Fox 2.5 Factory. How's the heat fade on long descents?", time: "2:20 PM" },
      { id: 4, from: "TrailBoss_88", text: "Also — are you running the CDCV or standard valving?", time: "2:21 PM" },
    ],
    lastMessage: "Also — are you running the CDCV or standard valving?", lastTime: "2:21 PM",
  },
  { id: "dm2", user: "BajaBound", initial: "B", name: "Baja Bound", badge: "Navigator", online: false, unread: 0,
    messages: [
      { id: 1, from: "me", text: "I'm interested in the Feb Baja convoy. Got room for a Tundra?", time: "Yesterday" },
      { id: 2, from: "BajaBound", text: "Absolutely! We have 4 rigs confirmed so far. What's your setup?", time: "Yesterday" },
      { id: 3, from: "me", text: "2022 Tundra, Icon Stage 3, full armor, rooftop tent, dual battery. Ready to roll.", time: "Yesterday" },
      { id: 4, from: "BajaBound", text: "Perfect rig for it. I'll add you to the convoy group chat once we get closer. We're planning the route next week.", time: "Yesterday" },
    ],
    lastMessage: "Perfect rig for it. I'll add you to the convoy group chat once we get closer.", lastTime: "Yesterday",
  },
  { id: "dm3", user: "SuspensionGuru", initial: "S", name: "Suspension Guru", badge: "Master Builder", online: true, unread: 1,
    messages: [
      { id: 1, from: "SuspensionGuru", text: "Kyle, wanted to reach out about a potential collab. Love what Lone Peak is doing.", time: "Mon" },
      { id: 2, from: "me", text: "Appreciate that! What did you have in mind?", time: "Mon" },
      { id: 3, from: "SuspensionGuru", text: "I'm putting together a suspension comparison video — Icon vs King vs Fox. Would love to feature your Tundra build as the Icon test platform.", time: "Tue" },
    ],
    lastMessage: "I'm putting together a suspension comparison video — Icon vs King vs Fox.", lastTime: "Tue",
  },
  { id: "dm4", user: "GearDump", initial: "G", name: "Gear Dump", badge: "Scout", online: false, unread: 0,
    messages: [
      { id: 1, from: "me", text: "Is the ARB bumper still available?", time: "3d ago" },
      { id: 2, from: "GearDump", text: "Hey! Yeah it is. Are you in the Denver area? Would prefer local pickup.", time: "3d ago" },
      { id: 3, from: "me", text: "I'm in Utah but could arrange shipping. Would you do $700 shipped?", time: "3d ago" },
      { id: 4, from: "GearDump", text: "Let me check shipping costs and get back to you. The bumper is heavy — probably $100+ to ship.", time: "2d ago" },
    ],
    lastMessage: "Let me check shipping costs and get back to you.", lastTime: "2d ago",
  },
];

function DMScreen({ onClose, onViewUser, initialUser, initialMessage, initialSharedPost, conversations, setConversations, onOpenPost }) {
  const [view, setView] = useState(initialUser ? "chat" : "inbox"); // "inbox" | "chat" | "new"
  const [activeConvo, setActiveConvo] = useState(() => {
    if (initialUser) {
      const existing = conversations.find(c => c.user === initialUser);
      if (existing) return { ...existing, unread: 0 };
      return { id: "new_" + initialUser, user: initialUser, initial: initialUser.charAt(0).toUpperCase(), name: initialUser, badge: "", online: false, unread: 0, messages: [], lastMessage: "", lastTime: "now" };
    }
    return null;
  });
  const [msgText, setMsgText] = useState(initialMessage || "");
  const [chatPhotos, setChatPhotos] = useState([]);
  const [pendingSharedPost, setPendingSharedPost] = useState(initialSharedPost || null);
  const [searchQ, setSearchQ] = useState("");
  const [newRecipient, setNewRecipient] = useState("");
  const chatEndRef = useRef(null);
  const chatFileRef = useRef(null);

  // Clear unread when opening via initialUser
  useEffect(() => {
    if (initialUser) {
      setConversations(prev => prev.map(c => c.user === initialUser ? { ...c, unread: 0 } : c));
    }
  }, [initialUser]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: "smooth" });
  }, [activeConvo?.messages?.length]);

  const openConvo = (convo) => {
    const cleared = { ...convo, unread: 0 };
    setActiveConvo(cleared);
    setConversations(prev => prev.map(c => c.id === convo.id ? cleared : c));
    setView("chat");
  };

  const handleChatFiles = (e) => {
    const files = Array.from(e.target.files || []);
    if (chatFileRef.current) chatFileRef.current.value = "";
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setChatPhotos(prev => [...prev, { id: Date.now() + Math.random(), url: ev.target.result, name: file.name }]);
      };
      reader.readAsDataURL(file);
    });
  };

  const sendMessage = () => {
    if ((!msgText.trim() && chatPhotos.length === 0 && !pendingSharedPost) || !activeConvo) return;
    const newMsg = { id: Date.now(), from: "me", text: msgText.trim(), time: Date.now(), photos: chatPhotos.length > 0 ? chatPhotos.map(p => p.url) : undefined, sharedPost: pendingSharedPost || undefined };
    const lastMsg = pendingSharedPost ? ("Shared: " + pendingSharedPost.title) : msgText.trim();
    const updated = { ...activeConvo, messages: [...activeConvo.messages, newMsg], lastMessage: lastMsg, lastTime: "Just now", unread: 0 };
    setActiveConvo(updated);
    setConversations(prev => {
      const exists = prev.find(c => c.id === updated.id);
      if (exists) return prev.map(c => c.id === updated.id ? updated : c);
      return [updated, ...prev];
    });
    setMsgText("");
    setChatPhotos([]);
    setPendingSharedPost(null);
  };

  const badgeColor = (b) => b === "Founder" ? T.red : b === "Master Builder" ? T.copper : b === "Navigator" ? T.green : T.tertiary;
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread, 0);

  const filteredConvos = searchQ.trim()
    ? conversations.filter(c => c.user.toLowerCase().includes(searchQ.toLowerCase()) || c.name.toLowerCase().includes(searchQ.toLowerCase()))
    : conversations;

  // New message recipient search
  const recipientResults = newRecipient.trim().length > 0
    ? globalSearchUsers.filter(u => (u.handle.toLowerCase().includes(newRecipient.toLowerCase()) || u.name.toLowerCase().includes(newRecipient.toLowerCase())) && !conversations.find(c => c.user === u.handle))
    : [];

  // ─── Chat View ───
  if (view === "chat" && activeConvo) {
    return (
      <div style={{ position: "absolute", inset: 0, background: T.darkBg, zIndex: 500, display: "flex", flexDirection: "column" }}>
        {/* Chat header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
          <button onClick={() => { setView("inbox"); setActiveConvo(null); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ChevronLeft size={22} color={T.white} strokeWidth={1.5} />
          </button>
          <div onClick={() => { onViewUser && onViewUser(activeConvo.user); }} style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, cursor: "pointer" }}>
            <div style={{ position: "relative" }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: T.charcoal, border: `2px solid ${T.copper}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: sans, fontSize: 14, fontWeight: 700, color: T.white }}>{activeConvo.initial}</span>
              </div>
              {activeConvo.online && <div style={{ position: "absolute", bottom: 0, right: 0, width: 10, height: 10, borderRadius: "50%", background: T.green, border: `2px solid ${T.charcoal}` }} />}
            </div>
            <div>
              <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: 600, display: "block" }}>@{activeConvo.user}</span>
              <span style={{ fontFamily: sans, fontSize: 10, color: activeConvo.online ? T.green : T.tertiary }}>{activeConvo.online ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 8 }}>
          {activeConvo.messages.length === 0 && (
            <div style={{ textAlign: "center", padding: "40px 16px" }}>
              <Mail size={32} color={T.tertiary} style={{ opacity: 0.3, marginBottom: 12 }} />
              <p style={{ fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 4px" }}>Start a conversation</p>
              <p style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }}>Send a message to @{activeConvo.user}</p>
            </div>
          )}
          {activeConvo.messages.map((msg) => {
            const isMe = msg.from === "me";
            return (
              <div key={msg.id} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "78%", padding: "10px 14px", borderRadius: isMe ? "14px 14px 4px 14px" : "14px 14px 14px 4px", background: isMe ? T.red : T.darkCard, border: isMe ? "none" : `1px solid ${T.charcoal}` }}>
                  {msg.sharedPost && (
                    <div onClick={() => onOpenPost && onOpenPost(msg.sharedPost)} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${isMe ? "rgba(255,255,255,0.15)" : T.charcoal}`, marginBottom: msg.text ? 8 : 0, background: isMe ? "rgba(0,0,0,0.15)" : `${T.charcoal}80`, cursor: "pointer", transition: "opacity 0.15s" }} onMouseEnter={e => e.currentTarget.style.opacity = "0.85"} onMouseLeave={e => e.currentTarget.style.opacity = "1"}>
                      {msg.sharedPost.image && (
                        <img src={msg.sharedPost.image} alt="" style={{ width: "100%", height: 120, objectFit: "cover", display: "block" }} />
                      )}
                      <div style={{ padding: "10px 12px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                          <div style={{ width: 20, height: 20, borderRadius: "50%", background: T.copper, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                            <span style={{ fontFamily: sans, fontSize: 8, fontWeight: 700, color: T.white }}>{msg.sharedPost.initial}</span>
                          </div>
                          <span style={{ fontFamily: sans, fontSize: 10, color: isMe ? "rgba(255,255,255,0.7)" : T.tertiary }}>@{msg.sharedPost.user}</span>
                          <span style={{ fontFamily: sans, fontSize: 9, color: isMe ? "rgba(255,255,255,0.45)" : `${T.tertiary}80`, marginLeft: "auto", textTransform: "uppercase", letterSpacing: 0.5 }}>{msg.sharedPost.type}</span>
                        </div>
                        <p style={{ fontFamily: serif, fontSize: 13, color: T.white, margin: 0, lineHeight: 1.4 }}>{msg.sharedPost.title}</p>
                        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 6 }}>
                          <span style={{ fontFamily: sans, fontSize: 10, color: T.copper, fontWeight: 600 }}>VIEW POST</span>
                          <ChevronRight size={12} color={T.copper} />
                        </div>
                      </div>
                    </div>
                  )}
                  {msg.photos && msg.photos.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginBottom: msg.text ? 8 : 0, flexWrap: "wrap" }}>
                      {msg.photos.map((url, pi) => (
                        <img key={pi} src={url} alt="" style={{ width: msg.photos.length === 1 ? "100%" : 80, height: msg.photos.length === 1 ? "auto" : 80, maxHeight: 200, borderRadius: 8, objectFit: "cover", display: "block" }} />
                      ))}
                    </div>
                  )}
                  {msg.text && <p style={{ fontFamily: serif, fontSize: 14, color: T.white, margin: 0, lineHeight: 1.5 }}>{msg.text}</p>}
                  <span style={{ fontFamily: sans, fontSize: 9, color: isMe ? `${T.white}90` : T.tertiary, display: "block", textAlign: "right", marginTop: 4 }}>{formatPostTime(msg.time)}</span>
                </div>
              </div>
            );
          })}
          <div ref={chatEndRef} />
        </div>

        {/* Shared post preview */}
        {pendingSharedPost && (
          <div style={{ padding: "8px 16px", background: T.charcoal, borderTop: `1px solid ${T.darkCard}`, display: "flex", gap: 10, alignItems: "center" }}>
            {pendingSharedPost.image && (
              <img src={pendingSharedPost.image} alt="" style={{ width: 48, height: 48, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.copper, letterSpacing: 0.5, fontWeight: 600 }}>SHARED POST</span>
                <span style={{ fontFamily: sans, fontSize: 9, color: T.tertiary }}>by @{pendingSharedPost.user}</span>
              </div>
              <p style={{ fontFamily: serif, fontSize: 12, color: T.white, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pendingSharedPost.title}</p>
            </div>
            <button onClick={() => setPendingSharedPost(null)} style={{ background: "none", border: "none", cursor: "pointer", padding: 2, display: "flex", flexShrink: 0 }}>
              <X size={14} color={T.tertiary} />
            </button>
          </div>
        )}

        {/* Photo preview strip */}
        {chatPhotos.length > 0 && (
          <div style={{ padding: "8px 16px 0", background: T.charcoal, display: "flex", gap: 8, overflowX: "auto" }}>
            {chatPhotos.map(p => (
              <div key={p.id} style={{ position: "relative", flexShrink: 0 }}>
                <img src={p.url} alt={p.name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", display: "block", border: `1px solid ${T.charcoal}` }} />
                <button onClick={() => setChatPhotos(prev => prev.filter(x => x.id !== p.id))} style={{ position: "absolute", top: -5, right: -5, width: 18, height: 18, borderRadius: "50%", background: T.red, border: `2px solid ${T.charcoal}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}>
                  <X size={8} color={T.white} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: "10px 16px max(10px, env(safe-area-inset-bottom))", background: T.charcoal, borderTop: (chatPhotos.length > 0 || pendingSharedPost) ? "none" : `1px solid ${T.darkCard}`, display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
          <input ref={chatFileRef} type="file" accept="image/*" multiple onChange={handleChatFiles} style={{ display: "none" }} />
          <button onClick={() => chatFileRef.current && chatFileRef.current.click()} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <Image size={20} color={T.tertiary} />
          </button>
          <div style={{ flex: 1, display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 20, padding: "8px 14px", border: `1px solid ${T.charcoal}` }}>
            <input value={msgText} onChange={e => setMsgText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} placeholder={pendingSharedPost ? "Add a message..." : "Type a message..."} style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, padding: 0 }} />
          </div>
          <button onClick={sendMessage} disabled={!msgText.trim() && chatPhotos.length === 0 && !pendingSharedPost} style={{ background: (msgText.trim() || chatPhotos.length > 0 || pendingSharedPost) ? T.red : T.charcoal, border: "none", cursor: (msgText.trim() || chatPhotos.length > 0 || pendingSharedPost) ? "pointer" : "default", padding: 0, width: 36, height: 36, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", opacity: (msgText.trim() || chatPhotos.length > 0 || pendingSharedPost) ? 1 : 0.4, transition: "all 0.15s" }}>
            <Send size={16} color={T.white} style={{ marginLeft: 2 }} />
          </button>
        </div>
      </div>
    );
  }

  // ─── New Message ───
  if (view === "new") {
    return (
      <div style={{ position: "absolute", inset: 0, background: T.darkBg, zIndex: 500, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
          <button onClick={() => setView("inbox")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ChevronLeft size={22} color={T.white} strokeWidth={1.5} />
          </button>
          <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white, letterSpacing: 1 }}>New Message</span>
        </div>
        <div style={{ padding: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px", marginBottom: 16, border: `1px solid ${T.copper}40` }}>
            <span style={{ fontFamily: sans, fontSize: 12, color: T.copper, fontWeight: 600, marginRight: 8 }}>TO:</span>
            <input value={newRecipient} onChange={e => setNewRecipient(e.target.value)} placeholder="Search for a user..." autoFocus style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, padding: 0 }} />
            {newRecipient && (
              <button onClick={() => setNewRecipient("")} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
                <X size={14} color={T.tertiary} />
              </button>
            )}
          </div>
          {recipientResults.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {recipientResults.map((u, i) => (
                <div key={u.handle} onClick={() => {
                  const newConvo = { id: "new_" + u.handle, user: u.handle, initial: u.initial, name: u.name, badge: u.badge, online: false, unread: 0, messages: [], lastMessage: "", lastTime: "now" };
                  setActiveConvo(newConvo);
                  setView("chat");
                  setNewRecipient("");
                }} style={{ background: T.darkCard, padding: "12px 16px", cursor: "pointer", borderRadius: i === 0 ? "8px 8px 0 0" : i === recipientResults.length - 1 ? "0 0 8px 8px" : 0, borderBottom: i < recipientResults.length - 1 ? `1px solid ${T.charcoal}` : "none", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${badgeColor(u.badge)}` }}>
                    <span style={{ fontFamily: sans, fontSize: 15, fontWeight: 700, color: T.white }}>{u.initial}</span>
                  </div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontFamily: sans, fontSize: 13, color: T.white, fontWeight: 600, display: "block" }}>@{u.handle}</span>
                    <span style={{ fontFamily: sans, fontSize: 11, color: T.tertiary }}>{u.name}</span>
                  </div>
                  <ChevronRight size={14} color={T.tertiary} />
                </div>
              ))}
            </div>
          ) : newRecipient.trim().length > 0 ? (
            <div style={{ textAlign: "center", padding: "24px" }}>
              <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: 0 }}>No users found for "{newRecipient}"</p>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "24px" }}>
              <Users size={24} color={T.tertiary} style={{ opacity: 0.3, marginBottom: 8 }} />
              <p style={{ fontFamily: serif, fontSize: 13, color: T.tertiary, margin: 0 }}>Search for a user to start a conversation</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ─── Inbox View ───
  return (
    <div style={{ position: "absolute", inset: 0, background: T.darkBg, zIndex: 500, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 16px", background: T.charcoal, borderBottom: `1px solid ${T.darkCard}`, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex" }}>
            <ChevronLeft size={22} color={T.white} strokeWidth={1.5} />
          </button>
          <span style={{ fontFamily: sans, fontSize: 16, fontWeight: 700, color: T.white, letterSpacing: 1 }}>Messages</span>
          {totalUnread > 0 && (
            <div style={{ minWidth: 18, height: 18, borderRadius: 9, background: T.red, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px" }}>
              <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }}>{totalUnread}</span>
            </div>
          )}
        </div>
        <button onClick={() => setView("new")} style={{ display: "flex", alignItems: "center", gap: 5, padding: "8px 14px", borderRadius: 8, background: T.red, border: "none", cursor: "pointer" }}>
          <Plus size={14} color={T.white} />
          <span style={{ fontFamily: sans, fontSize: 11, color: T.white, fontWeight: 700, letterSpacing: 0.5 }}>NEW</span>
        </button>
      </div>

      {/* Search conversations */}
      <div style={{ padding: "12px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", background: T.darkCard, borderRadius: 8, padding: "10px 14px" }}>
          <Search size={16} color={T.tertiary} />
          <input value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search conversations..." style={{ flex: 1, background: "none", border: "none", outline: "none", color: T.white, fontFamily: serif, fontSize: 13, marginLeft: 8, padding: 0 }} />
        </div>
      </div>

      {/* Conversation List */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {filteredConvos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 16px" }}>
            <Mail size={32} color={T.tertiary} style={{ opacity: 0.3, marginBottom: 12 }} />
            <p style={{ fontFamily: serif, fontSize: 14, color: T.tertiary, margin: "0 0 4px" }}>No conversations yet</p>
            <p style={{ fontFamily: serif, fontSize: 12, color: T.tertiary, margin: 0 }}>Start a new message to connect with the community</p>
          </div>
        ) : (
          <div style={{ padding: "0 16px" }}>
            {filteredConvos.map((convo, i) => (
              <div key={convo.id} onClick={() => openConvo({ ...convo, unread: 0 })} style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 0", cursor: "pointer", borderBottom: i < filteredConvos.length - 1 ? `1px solid ${T.charcoal}` : "none" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: T.charcoal, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${convo.unread > 0 ? T.copper : T.charcoal}` }}>
                    <span style={{ fontFamily: sans, fontSize: 18, fontWeight: 700, color: T.white }}>{convo.initial}</span>
                  </div>
                  {convo.online && <div style={{ position: "absolute", bottom: 2, right: 2, width: 12, height: 12, borderRadius: "50%", background: T.green, border: `2px solid ${T.darkBg}` }} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontFamily: sans, fontSize: 14, color: T.white, fontWeight: convo.unread > 0 ? 700 : 500 }}>@{convo.user}</span>
                    <span style={{ fontFamily: sans, fontSize: 10, color: convo.unread > 0 ? T.copper : T.tertiary, flexShrink: 0 }}>{convo.lastTime}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <p style={{ fontFamily: serif, fontSize: 12, color: convo.unread > 0 ? T.white : T.tertiary, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, fontWeight: convo.unread > 0 ? 500 : 400 }}>{convo.lastMessage}</p>
                    {convo.unread > 0 && (
                      <div style={{ minWidth: 20, height: 20, borderRadius: 10, background: T.red, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <span style={{ fontFamily: sans, fontSize: 10, fontWeight: 700, color: T.white }}>{convo.unread}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── MAIN APP ─── */
export default function Trailhead() {
  const [authState, setAuthState] = useState("login"); // "login" | "signup" | "app"
  const [screen, setScreen] = useState("feed");
  const [profileStack, setProfileStack] = useState([]);
  const [showRecovery, setShowRecovery] = useState(false);
  const [showCompose, setShowCompose] = useState(false);
  const [mapData, setMapData] = useState(null); // { coords, location, title }
  const [showRecorder, setShowRecorder] = useState(false);
  const [showManualRoute, setShowManualRoute] = useState(false);
  const [pendingThread, setPendingThread] = useState(null); // { threadId, catName, subName }
  const [feedItems, setFeedItems] = useState(defaultFeedItems);
  const [forumUserThreads, setForumUserThreads] = useState({}); // { subName: [thread, ...] }
  const [forumUserReplies, setForumUserReplies] = useState({}); // { threadId: [reply, ...] }
  const [forumLikedItems, setForumLikedItems] = useState({}); // { key: true }
  const [forumLikeCounts, setForumLikeCounts] = useState({}); // { key: count }
  const [forumViewCounts, setForumViewCounts] = useState({}); // { threadId: count }
  const [userRoutes, setUserRoutes] = useState([]); // routes created by user
  const [savedRoutes, setSavedRoutes] = useState([]); // routes saved/bookmarked by user
  const [activeNavRoute, setActiveNavRoute] = useState(null); // route data for in-app navigation
  const [userBuilds, setUserBuilds] = useState([]);
  const [profilePic, setProfilePic] = useState(null);
  const [notifPrefs, setNotifPrefs] = useState({ likes: true, comments: true, replies: true, follows: true, mentions: true, push: false });
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [showDM, setShowDM] = useState(false);
  const [dmInitialUser, setDmInitialUser] = useState(null);
  const [dmInitialMessage, setDmInitialMessage] = useState("");
  const [dmConvos, setDmConvos] = useState(dmConversations);
  const dmUnreadCount = dmConvos.reduce((sum, c) => sum + c.unread, 0);
  const [dmSharedPost, setDmSharedPost] = useState(null); // { title, user, initial, image }

  const [bellNotifs, setBellNotifs] = useState([
    { id: "b1", type: "like", user: "Overland_Expert", text: "liked your post", target: "Stage 3 Suspension Build Complete", time: "2m ago", icon: Heart, iconColor: T.red },
    { id: "b2", type: "reply", user: "TrailBoss", text: "replied to your thread", target: "Best budget lift kit for 3rd Gen Tacoma?", time: "18m ago", icon: MessageCircle, iconColor: T.copper },
    { id: "b3", type: "follow", user: "MountainGoat", text: "started following you", target: null, time: "1h ago", icon: UserPlus, iconColor: T.green },
    { id: "b4", type: "like", user: "Peak_Finder", text: "liked your route", target: "Hell's Revenge Loop", time: "3h ago", icon: Heart, iconColor: T.red },
    { id: "b5", type: "mention", user: "BajaBound", text: "mentioned you in", target: "Planning a Baja convoy — Feb 2027", time: "5h ago", icon: AtSign, iconColor: T.copper },
    { id: "b6", type: "reply", user: "SteelCraft", text: "replied to your comment in", target: "Custom skid plate fabrication", time: "8h ago", icon: MessageCircle, iconColor: T.copper },
    { id: "b7", type: "like", user: "Nomad_Queen", text: "and 4 others liked your post", target: "Black Bear Pass Recovery", time: "1d ago", icon: Heart, iconColor: T.red },
  ]);

  const [recoveryAlerts, setRecoveryAlerts] = useState([
    { id: "r1", title: "Winch Support Required", location: "Black Bear Pass, CO", coords: "37.8106° N, 107.6992° W", urgency: "HIGH", time: "2m ago", vehicle: "Jeep Gladiator on 37s", detail: "High-centered on a shelf. Front locker acting up.", author: "DesertRat_4x4" },
    { id: "r2", title: "Tow Needed — Broken Axle", location: "Rubicon Trail, CA", coords: "38.9764° N, 120.1572° W", urgency: "HIGH", time: "25m ago", vehicle: "2018 Wrangler JL", detail: "Front axle snapped at the birfield. Cannot move under own power.", author: "StockHero" },
    { id: "r3", title: "Flat Tire Assist", location: "Moab, UT", coords: "38.5733° N, 109.5498° W", urgency: "LOW", time: "1h ago", vehicle: "Toyota 4Runner", detail: "Spare is wrong size. Need 285/70R17 or close.", author: "DirtRoadDave" },
  ]);

  const addNotification = (notif) => {
    setBellNotifs(prev => [{ id: "bn_" + Date.now() + "_" + Math.random().toString(36).slice(2, 6), time: Date.now(), ...notif }, ...prev]);
  };

  const addRecoveryAlert = (alert) => {
    setRecoveryAlerts(prev => [alert, ...prev]);
  };

  const [dmKey, setDmKey] = useState(0);
  const openDM = (user, prefillMsg, sharedPost) => { setDmInitialUser(user || null); setDmInitialMessage(prefillMsg || ""); setDmSharedPost(sharedPost || null); setDmKey(k => k + 1); setShowDM(true); };

  const addBuild = (data) => {
    const displayName = data.buildName || `${data.year} ${data.make} ${data.model}`;
    const heroImg = data.mainPhotos && data.mainPhotos.length > 0 ? data.mainPhotos[0].url : null;
    // Add to userBuilds for profile & gallery
    const newBuild = {
      id: Date.now(),
      name: displayName.toUpperCase(),
      owner: "Kyle Morrison",
      handle: "@KyleLPO",
      initial: "K",
      year: parseInt(data.year) || 2024,
      make: data.make,
      model: data.model,
      tags: [data.trim ? data.trim.toUpperCase() : data.make.toUpperCase(), "NEW BUILD"],
      suspension: data.suspension.value || "",
      tires: data.tires.value || "",
      bumpers: data.bumpers.value || "",
      miles: "0",
      elevation: "0 ft",
      routes: 0,
      hasCamper: data.hasCamper,
      camperMake: data.camperMake || "",
      camperModel: data.camperModel || "",
      isMine: true,
      isFollowing: true,
      likes: 0,
      heroImg,
      buildData: data,
    };
    setUserBuilds(prev => [newBuild, ...prev]);
    // Post to feed if share enabled
    if (data.shareToFeed) {
      const feedPost = {
        id: "fb_" + Date.now(),
        type: "BUILDS",
        user: "Kyle Morrison",
        initial: "K",
        time: Date.now(),
        title: displayName.toUpperCase(),
        subtitle: "Added a new build",
        stage: data.suspension.value ? "Suspension: " + data.suspension.value : (data.bumpers.value ? "Armor: " + data.bumpers.value : "New Build"),
        likes: 0,
        comments: 0,
        seedComments: [],
        photoUrls: heroImg ? [heroImg] : undefined,
        buildData: data,
        vehicle: `${data.year} ${data.make} ${data.model}${data.trim ? " " + data.trim : ""}`,
      };
      setFeedItems(prev => [feedPost, ...prev]);
    }
  };

  const updateBuild = (buildId, data) => {
    const displayName = data.buildName || `${data.year} ${data.make} ${data.model}`;
    const heroImg = data.mainPhotos && data.mainPhotos.length > 0 ? data.mainPhotos[0].url : null;
    setUserBuilds(prev => prev.map(b => b.id === buildId ? {
      ...b,
      name: displayName.toUpperCase(),
      year: parseInt(data.year) || b.year,
      make: data.make || b.make,
      model: data.model || b.model,
      tags: [data.trim ? data.trim.toUpperCase() : data.make.toUpperCase(), "UPDATED"],
      heroImg,
      buildData: data,
      hasCamper: data.hasCamper,
      camperMake: data.camperMake || "",
      camperModel: data.camperModel || "",
    } : b));
  };

  const openForumThread = (threadId, catName, subName) => {
    setPendingThread({ threadId, catName, subName });
    setScreen("forum");
  };

  const openProfile = () => setProfileStack(["self"]);
  const openUserProfile = (userId) => setProfileStack(["user", userId]);
  const openMap = (coords, location, title) => setMapData({ coords, location, title });
  const goBack = () => { setProfileStack([]); setShowRecovery(false); setShowCompose(false); };

  const handleNav = (key) => {
    setProfileStack([]);
    setShowRecovery(false);
    setShowCompose(false);
    setScreen(key);
  };

  const isProfile = profileStack.length > 0;
  const isOtherProfile = profileStack[0] === "user";
  const isOverlay = isProfile || showRecovery || showCompose;

  // Auth screens
  if (authState === "login") {
    return <LoginScreen onLogin={() => setAuthState("app")} onGoToSignup={() => setAuthState("signup")} />;
  }
  if (authState === "signup") {
    return <SignupScreen onSignup={() => setAuthState("app")} onGoToLogin={() => setAuthState("login")} onSetProfilePic={setProfilePic} />;
  }

  return (
    <div style={{ background: T.charcoal, height: "100vh", maxWidth: 430, margin: "0 auto", position: "relative", fontFamily: sans, color: T.white, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <TopBar
        onProfile={openProfile}
        onBack={goBack}
        showBack={isOverlay}
        title={showCompose ? "New Post" : showRecovery ? "Recovery" : isProfile ? (isOtherProfile ? "" : "Profile") : undefined}
        onViewUser={openUserProfile}
        onGoToRecovery={() => { setShowRecovery(true); setProfileStack([]); }}
        onOpenMap={openMap}
        onSearch={() => setShowGlobalSearch(true)}
        onOpenDM={(user) => openDM(user)}
        dmUnread={dmUnreadCount}
        bellNotifs={bellNotifs}
        setBellNotifs={setBellNotifs}
        profilePic={profilePic}
        notifPrefs={notifPrefs}
        recoveryAlerts={recoveryAlerts}
        setRecoveryAlerts={setRecoveryAlerts}
      />

      <div className="th-scroll" style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {showCompose ? (
          <ComposeScreen onClose={() => setShowCompose(false)} onSubmit={(newPost) => setFeedItems(prev => [newPost, ...prev])} onAddRecoveryAlert={addRecoveryAlert} onAddNotification={addNotification} onAddRoute={(r) => setUserRoutes(prev => [r, ...prev])} />
        ) : showRecovery ? (
          <RecoveryScreen onOpenMap={openMap} onOpenDM={(user) => openDM(user)} />
        ) : isProfile ? (
          isOtherProfile ? (
            <OtherProfileScreen userId={profileStack[1]} onBack={goBack} onMessage={(user) => openDM(user)} />
          ) : (
            <ProfileScreen onViewUser={openUserProfile} onLogout={() => { setAuthState("login"); setProfileStack([]); }} userBuilds={userBuilds} onAddBuild={addBuild} onUpdateBuild={updateBuild} onDeleteBuild={(id) => { setUserBuilds(prev => prev.filter(b => b.id !== id)); setFeedItems(prev => prev.filter(p => p.buildId !== id && p.id !== id)); }} profilePic={profilePic} onSetProfilePic={setProfilePic} notifPrefs={notifPrefs} onSetNotifPrefs={setNotifPrefs} feedItems={feedItems} onDeletePost={(id) => setFeedItems(prev => prev.filter(p => p.id !== id))} onEditPost={(id, newText) => setFeedItems(prev => prev.map(p => p.id === id ? { ...p, title: newText } : p))} onGoToPost={(id) => { setProfileStack([]); setScreen("feed"); }} />
          )
        ) : (
          <>
            {screen === "feed" && <FeedScreen onViewUser={openUserProfile} onOpenMap={openMap} onOpenThread={(threadId, catName, subName) => openForumThread(threadId, catName, subName)} onOpenDM={(user, msg, sp) => openDM(user, msg, sp)} feedItems={feedItems} onUpdateFeed={(items) => setFeedItems(items)} onAddNotification={addNotification} forumUserReplies={forumUserReplies} forumViewCounts={forumViewCounts} savedRoutes={savedRoutes} onSaveRoute={(route) => setSavedRoutes(prev => prev.some(r => r.id === route.id || r.name === route.name) ? prev : [route, ...prev])} onUnsaveRoute={(routeId) => setSavedRoutes(prev => prev.filter(r => r.id !== routeId && r.name !== routeId))} onStartNav={(route) => setActiveNavRoute(route)} />}
            {screen === "forum" && <ForumScreen pendingThread={pendingThread} onPendingHandled={() => setPendingThread(null)} onAddNotification={addNotification} onOpenDM={(user, msg, sp) => openDM(user, msg, sp)} onAddFeedPost={(post) => setFeedItems(prev => [post, ...prev])} userThreads={forumUserThreads} setUserThreads={setForumUserThreads} userReplies={forumUserReplies} setUserReplies={setForumUserReplies} likedForumItems={forumLikedItems} setLikedForumItems={setForumLikedItems} forumLikeCounts={forumLikeCounts} setForumLikeCounts={setForumLikeCounts} forumViewCounts={forumViewCounts} setForumViewCounts={setForumViewCounts} />}
            {screen === "routes" && <RoutesScreen onRecordRoute={() => setShowRecorder(true)} onManualEntry={() => setShowManualRoute(true)} userRoutes={userRoutes} onUpdateRoute={(routeId, updates) => setUserRoutes(prev => prev.map(r => r.id === routeId ? { ...r, ...updates } : r))} savedRoutes={savedRoutes} onSaveRoute={(route) => setSavedRoutes(prev => prev.some(r => r.id === route.id || r.name === route.name) ? prev : [route, ...prev])} onUnsaveRoute={(routeId) => setSavedRoutes(prev => prev.filter(r => r.id !== routeId && r.name !== routeId))} onOpenDM={(user, msg, sharedPost) => openDM(user, msg, sharedPost)} onAddFeedPost={(post) => setFeedItems(prev => [post, ...prev])} onStartNav={(route) => setActiveNavRoute(route)} />}
            {screen === "builds" && <BuildsScreen onViewUser={openUserProfile} userBuilds={userBuilds} />}
            {screen === "ranks" && <RanksScreen />}
          </>
        )}
      </div>

      {/* FAB */}
      {screen === "feed" && !isOverlay && (
        <button onClick={() => setShowCompose(true)} style={{ position: "absolute", bottom: 68, right: 16, width: 52, height: 52, borderRadius: "50%", background: T.red, border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 20px ${T.red}60`, zIndex: 90 }}>
          <Plus size={24} color={T.white} strokeWidth={2} />
        </button>
      )}

      <BottomNav active={isOverlay ? "" : screen} onNav={handleNav} />

      {/* Map Overlay */}
      {mapData && (
        <MapOverlay
          coords={mapData.coords}
          location={mapData.location}
          title={mapData.title}
          onClose={() => setMapData(null)}
        />
      )}
      {activeNavRoute && (
        <RouteNavigation route={activeNavRoute} onClose={() => setActiveNavRoute(null)} />
      )}
      {showRecorder && (
        <RouteRecorder
          onClose={() => setShowRecorder(false)}
          onSave={(routeData) => {
            const id = "rec_route_" + Date.now();
            const distMi = routeData.distance ? (routeData.distance / 1609.34).toFixed(1) : "—";
            const durStr = routeData.duration ? (typeof routeData.duration === "number" ? (() => { const h = Math.floor(routeData.duration / 3600); const m = Math.floor((routeData.duration % 3600) / 60); return h > 0 ? `${h}H ${m}M` : `${m}M`; })() : routeData.duration) : "—";
            // Build pins from track points (first, last, plus photo pins)
            const recPins = [];
            if (routeData.points && routeData.points.length > 0) {
              recPins.push({ lat: routeData.points[0].lat, lng: routeData.points[0].lng });
              // Add photo pins
              if (routeData.photos) routeData.photos.filter(p => p.lat && p.lng).forEach(p => recPins.push({ lat: p.lat, lng: p.lng, photo: true }));
              if (routeData.points.length > 1) recPins.push({ lat: routeData.points[routeData.points.length - 1].lat, lng: routeData.points[routeData.points.length - 1].lng });
            }
            const allPins = routeData.pins && routeData.pins.length > 0 ? routeData.pins : recPins;
            setUserRoutes(prev => [{
              id,
              name: routeData.name,
              desc: routeData.desc || "",
              difficulty: routeData.difficulty || "Moderate",
              distance: distMi + " MI",
              time: durStr,
              elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "—",
              location: routeData.location || routeData.region || "",
              terrains: routeData.terrains || [],
              tags: routeData.tags || [],
              pins: allPins,
              photos: routeData.photos || [],
              points: routeData.points || [],
              rating: null,
              reviews: 0,
              author: "KyleLPO",
              createdAt: Date.now(),
            }, ...prev]);
            if (routeData.shareToFeed) {
              setFeedItems(prev => [{
                id, type: "ROUTES", user: "KyleLPO", initial: "K", time: Date.now(),
                title: routeData.name, body: routeData.desc || null,
                distance: distMi + " MI", duration: durStr,
                badge: null, verified: 0, likes: 0, comments: 0,
                difficulty: routeData.difficulty || "Moderate",
                elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "—",
                location: routeData.location || routeData.region || "",
                terrains: routeData.terrains || [],
                tags: routeData.tags || [],
                photos: routeData.photos || [],
                pins: allPins,
                points: routeData.points || [],
              }, ...prev]);
            }
            setShowRecorder(false);
          }}
        />
      )}
      {showManualRoute && (
        <RouteDetailsForm
          isManual
          onBack={() => setShowManualRoute(false)}
          onPublish={(routeData) => {
            const id = "user_route_" + Date.now();
            setUserRoutes(prev => [{
              id,
              name: routeData.name,
              desc: routeData.desc || "",
              difficulty: routeData.difficulty || "Moderate",
              distance: routeData.distance ? routeData.distance + " MI" : "—",
              time: routeData.time || "—",
              elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "—",
              location: routeData.location || "",
              terrains: routeData.terrains || [],
              tags: routeData.tags || [],
              pins: routeData.pins || [],
              photos: routeData.photos || [],
              points: routeData.points || [],
              rating: null,
              reviews: 0,
              author: "KyleLPO",
              createdAt: Date.now(),
            }, ...prev]);
            if (routeData.shareToFeed) {
              setFeedItems(prev => [{
                id, type: "ROUTES", user: "KyleLPO", initial: "K", time: Date.now(),
                title: routeData.name, body: routeData.desc || null,
                distance: routeData.distance ? routeData.distance + " MI" : "—",
                duration: routeData.time || "—",
                badge: null, verified: 0, likes: 0, comments: 0,
                difficulty: routeData.difficulty || "Moderate",
                elevation: routeData.elevGain ? "+" + Number(routeData.elevGain).toLocaleString() + " FT" : "—",
                location: routeData.location || "",
                terrains: routeData.terrains || [],
                tags: routeData.tags || [],
                photos: routeData.photos || [],
                pins: routeData.pins || [],
                points: routeData.points || [],
              }, ...prev]);
            }
            setShowManualRoute(false);
          }}
        />
      )}
      {showGlobalSearch && (
        <GlobalSearch
          onClose={() => setShowGlobalSearch(false)}
          onViewUser={(handle) => { setShowGlobalSearch(false); openUserProfile(handle); }}
          onOpenThread={(threadId, catName, subName) => { setShowGlobalSearch(false); openForumThread(threadId, catName, subName); }}
          onNavigate={(s) => { setShowGlobalSearch(false); setScreen(s); }}
          forumUserReplies={forumUserReplies}
          forumViewCounts={forumViewCounts}
        />
      )}
      {showDM && (
        <DMScreen
          key={dmKey}
          onClose={() => { setShowDM(false); setDmInitialUser(null); setDmInitialMessage(""); setDmSharedPost(null); }}
          onViewUser={(handle) => { setShowDM(false); setDmInitialUser(null); setDmInitialMessage(""); setDmSharedPost(null); openUserProfile(handle); }}
          initialUser={dmInitialUser}
          initialMessage={dmInitialMessage}
          initialSharedPost={dmSharedPost}
          conversations={dmConvos}
          setConversations={setDmConvos}
          onOpenPost={(sp) => {
            setShowDM(false); setDmInitialUser(null); setDmInitialMessage(""); setDmSharedPost(null);
            if (sp.type === "FORUM" && sp.threadId) {
              openForumThread(sp.threadId, sp.forumCat, sp.forumSub);
            } else {
              setProfileStack([]); setShowRecovery(false); setShowCompose(false); setScreen("feed");
            }
          }}
        />
      )}
    </div>
  );
}
