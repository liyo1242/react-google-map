//App.js
import React from "react";
import { useState, useEffect } from "react";
import "./App.css";
import * as mapStyles from './mapStyle';
import { throttle } from 'lodash';
import * as googleFunc from './googleFunction'
import { useTheme, ThemeWrapper } from'./theme';

function App() {

    const [loaded, error] = useScript(
        `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_KEY}&libraries=places`
    );
    //place is for display
    const [originPlace, setOriginPlace] = useState("");
    const [destinationPlace, setDestinationPlace] = useState("");
    // place id for Routing
    const [originPlaceId, setOriginPlaceId] = useState("");
    const [destinationPlaceId, setDestinationPlaceId] = useState("");
    // save Marker
    const [originPlaceMarker, setOriginPlaceMarker] = useState(null);
    const [destinationPlaceMarker, setDestinationPlaceMarker] = useState(null);
    // autocomplete Result
    const [predictResult, setPredictResult] = useState([]);
    // which input is focus ?
    const [searchBarState, setSearchBarState] = useState('origin');
    const [mapCenter, setMapCenter] = useState({}); // google chicken // duck
    const [isDraging, setIsDraging] = useState(false);

    const [data, setData] = useState({});
    // google's service
    const [map, setMap] = useState({});
    const [geocoder, setGeocoder] = useState({});
    const [autocomplete, setAutocomplete] = useState({});
    const [directionsService, setDirectionsService] = useState({});
    const [directionsDisplay, setDirectionsDisplay] = useState({});
    // listener
    const [mapListener, setMapListener] = useState(null);
    // chinese keyin
    const [compositionEnd, setCompositionEnd] = useState(true);
    // display thing flag
    const [isEnterMode, setIsEnterMode] = useState(false);
    const [isKeyboardEnterMode, setIsKeyboardEnterMode] = useState(false);
    const [isCallingTaxi, setIsCallingTaxi] = useState(false);
    const [isGPSbroken, setIsGPSbroken] = useState(false);
    const [isRoute, setIsRoute] = useState(false);
    const [isRouteCallTaxi, setIsRouteCallTaxi] = useState(false);
    const [isDriverPage, setIsDriverPage] = useState(false);
    // driver data
    const [driverData, setDriverData] = useState({})
    // screen height
    const [screenHeight, setScreenHeight] = useState();
    // route line
    const [line, setLine] = useState();
    const {lat, lng, Lerror} = googleFunc.usePosition()
    // Debounce for GEOcode
    const [debounceCount, setDebounceCount] = useState(0)

    useEffect(() => {
        if (loaded) {
            setScreenHeight(document.documentElement.clientHeight)
            // handle full screen
            let map = new window.google.maps.Map(document.getElementById("map"), {
                disableDefaultUI: true,
                center: { lat: 25.0339640, lng: 121.5644720 },
                zoom: 17, // Vision size
                clickableIcons: false,
                gestureHandling: 'greedy',
                styles: (localStorage.getItem("dark") === "true" ? mapStyles.darkMode : mapStyles.lightMode)
            });
            console.log(' !!!!! Because Dynamic Map API, Google start to steal some money ( $0.007 ) from you');
            // Service for decode the address and latlng
            let geocoder = new window.google.maps.Geocoder();
            let autocomplete = new window.google.maps.places.AutocompleteService();
            // Service for Drawing the Route
            let directionsService = new window.google.maps.DirectionsService();
            let directionsDisplay = new window.google.maps.DirectionsRenderer({ suppressMarkers: true, polylineOptions: { strokeColor: "white", strokeOpacity: 0}});
            directionsDisplay.setMap(map);
            // setting
            setMap(map);
            setGeocoder(geocoder);
            setAutocomplete(autocomplete)
            setDirectionsService(directionsService)
            setDirectionsDisplay(directionsDisplay)

            _setListener()
            // i feel something strange
            let latlng = { lat: lat, lng: lng };

            if(lat && lng) {
                googleFunc.geocodeLatLng(geocoder, latlng)
                .then(data => {
                    setMapCenter(data);
                });
                map.setCenter(latlng);
                map.setZoom(18);
            }

            function _setListener() {
                map.addListener('drag', () => {
                    setIsGPSbroken(false);
                    setIsEnterMode(true)
                    setIsDraging(true)
                })
                // store the map listener
                setMapListener(map.addListener('dragend', throttle((e) => {
                    setIsDraging(false);
                    console.log('detect map moving~~');
                    let geoOption = { lat: map.getCenter().lat(), lng: map.getCenter().lng() }
                    // can I use Ref to solve this problem ??
                    googleFunc.geocodeLatLng(geocoder, geoOption)
                    .then(data => {
                        setMapCenter(data);
                    });
                }, 2000)))
            }
        }
    }, [loaded]); // triggle by "loaded"

    useEffect(() => {
        console.log(`effect ${Lerror}`);
        console.log(Lerror)
        if(Lerror) {
            googleFunc.geolocation(map, setIsGPSbroken(true));
            switch(Lerror.code) {
                case 1:
                    console.log('PERMISSION_DENIED');
                break;
                case 2:
                    console.log('POSITION_UNAVAILABLE');
                break;
                case 3:
                    console.log('TIMEOUT');
                break;
                default:
                    console.log('unknown error');
                break;
            }
        }
        if(loaded && !Lerror) {
            console.log('Latlng useEffect !!!!');
            let latlng = { lat: lat, lng: lng };
            googleFunc.geocodeLatLng(geocoder, latlng)
            .then(data => {
                setMapCenter(data);
            });
            map.setCenter(latlng);
            map.setZoom(18);
        }
    }, [lat, lng, Lerror])

    useEffect(() => {
        if (mapCenter && loaded) {
            switch (searchBarState) {
                case 'origin':
                    setOriginPlace(mapCenter.formatted_address)
                    setOriginPlaceId(mapCenter.place_id)
                    break;
                case 'destination':
                    setDestinationPlace(mapCenter.formatted_address)
                    setDestinationPlaceId(mapCenter.place_id)
                    break;
                default:
                    alert('what happen ??')
                    break;
            }
        }
    }, [mapCenter])

    useEffect(() => {
        if(isCallingTaxi) {
            // 建立socket連線 取得司機資料
            setTimeout(() => {
                setDriverData({
                    driverImageUrl: 'https://i.imgur.com/hmBM0Q1.jpg',
                    driverName: 'chicken',
                    carLabel: 'AB-0001'
                })
                setIsDriverPage(true);
            }, 5000)
        }
    }, [isCallingTaxi])

    function searchBarHandler(e, who, spkey) {
        console.log('detect searchBar onChange~~');
        setSearchBarState(who);
        switch (who) {
            case 'origin':
                setOriginPlace(e.target.value);
                break;
            case 'destination':
                setDestinationPlace(e.target.value);
                break;
            default:
                alert('what happen ??')
                break;
        }

        if(spkey === undefined) {
            if(!compositionEnd) {
                console.log('avoid API call during the composition')
                return
            }
        }
        setTimeout(() => setDebounceCount(debounceCount + 1), 1200);
    }

    useEffect(() => {
        if(debounceCount === 0) {
            return;
        }
        let value = searchBarState === 'origin' ? originPlace : destinationPlace;
        if (value) {
            googleFunc.autocompletePredict(autocomplete, map, value).then(d => {
                setPredictResult(d);
            })
        } else {
            setPredictResult([]);
        }
        
    }, [debounceCount])

    function compositioningHandle() {
        console.log('ing')
        setCompositionEnd(false);
    }

    function compositionHandle(e, who) {
        console.log('end')
        setCompositionEnd(true);
        searchBarHandler(e, who, 'JOJO')
    }

    function clear(str) {
        if(str === 'origin') {
            setOriginPlace("");
            setOriginPlaceId("")
        } else if (str === 'destination') {
            setDestinationPlace("");
            setDestinationPlaceId("");
        }
    }

    function focusHandler(str) {
        console.log('detect focus behavior~~');
        if (searchBarState !== str) {
            setPredictResult([]);
        }
        setSearchBarState(str);
    }

    function predictHandler(e) {
        console.log('detect click predictBar~~');
        setIsKeyboardEnterMode(false)
        switch (searchBarState) {
            case 'origin':
                setOriginPlace(e.target.innerHTML)
                setOriginPlaceId(e.target.id)
                googleFunc.geocodeAddress(geocoder, e.target.innerHTML).then(data => {
                        let latlng = {lat: data.geometry.location.lat(), lng:data.geometry.location.lng()}
                        map.setCenter(latlng)
                    }
                );
                break;
            case 'destination':
                setDestinationPlace(e.target.innerHTML)
                setDestinationPlaceId(e.target.id)
                googleFunc.geocodeAddress(geocoder, e.target.innerHTML).then(data => {
                        let latlng = {lat: data.geometry.location.lat(), lng:data.geometry.location.lng()}
                        map.setCenter(latlng)
                    }
                );
                break;
            default:
                alert('what happen ??')
                break;
        }
        setPredictResult([]);
    }

    function route() {
        setIsRoute(true);
        window.google.maps.event.removeListener(mapListener);
        if(!(originPlaceId && destinationPlaceId)) {
            // alert('please enter the full data to route');
            if(originPlaceMarker) originPlaceMarker.setMap(null)
            let Olatlng = { lat: map.getCenter().lat(), lng: map.getCenter().lng() }
            let Omarker = googleFunc.placeIcon(1, Olatlng, map, 'O')
            Omarker.setMap(map);
            setOriginPlaceMarker(Omarker);

            // put some info on the origin marker
            let infoBox = new window.google.maps.InfoWindow({
                content: `乘客在 ${originPlace} 等待司機的到來`
            })
            infoBox.open(map, Omarker);

            setIsCallingTaxi(true);

            return false;
        }
        setIsRouteCallTaxi(true);
        // stop the map idle listener

        googleFunc.drawingRoute(directionsService, directionsDisplay, { originPlaceId: originPlaceId, destinationPlaceId: destinationPlaceId })
        .then((d) => {

            // place origin place Marker
            if(originPlaceMarker) originPlaceMarker.setMap(null)
            let Olatlng = {lat: d.routes[0].legs[0].start_location.lat(), lng: d.routes[0].legs[0].start_location.lng()}
            let Omarker = googleFunc.placeIcon(1, Olatlng, map, 'A')
            Omarker.setMap(map);
            setOriginPlaceMarker(Omarker);

            // put some info on the origin marker
            let infoBox = new window.google.maps.InfoWindow({
                content: d.routes[0].legs[0].start_address
            })
            infoBox.open(map, Omarker);

            // place destination place Marker
            if(destinationPlaceMarker) destinationPlaceMarker.setMap(null)
            let Dlatlng = {lat: d.routes[0].legs[0].end_location.lat(), lng: d.routes[0].legs[0].end_location.lng()}
            let Dmarker = googleFunc.placeIcon(1, Dlatlng, map, 'B')
            Dmarker.setMap(map);
            setDestinationPlaceMarker(Dmarker);
            // put some info on the Destination marker
            let infoBox2 = new window.google.maps.InfoWindow({
                content: d.routes[0].legs[0].end_address
            })
            infoBox2.open(map, Dmarker);

            // some animation route ??
            let lineSymbol = {
                path: 'M 0,-1 0,1',
                scale: 4,
                strokeColor: 'black'
            }

            let line = new window.google.maps.Polyline({
                path: window.google.maps.geometry.encoding.decodePath(d.routes[0].overview_polyline),
                strokeColor: 'white',
                scale: 4,
                strokeOpacity: 1,
                icons: [{
                    icon: lineSymbol,
                    offset: '0',
                    repeat: '120px'
                }],
                map: map
            })

            setLine(line);

            googleFunc.animateLine(line);

            // adjust the map view, but required ??
            map.setCenter(d.routes[0].bounds.getCenter())
            window.google.maps.event.removeListener(mapListener);
        })
        return true;
    }

    // Dark Mode
    const themeState = useTheme();

    function toggleMode(isDark) {
        themeState.toggle();
        if(isDark) {
            map.setOptions({styles: mapStyles.lightMode})
        } else {
            map.setOptions({styles: mapStyles.darkMode})
        }
    }

    function returnHandler() {
        setMapListener(map.addListener('dragend', throttle((e) => {
            setIsDraging(false);
            console.log('detect map moving~~');
            let geoOption = { lat: map.getCenter().lat(), lng: map.getCenter().lng() }
            // can I use Ref to solve this problem ??
            googleFunc.geocodeLatLng(geocoder, geoOption)
            .then(data => {
                setMapCenter(data);
            });
        }, 2000)))
        setIsRoute(false);
        directionsDisplay.setDirections({routes: []});
        destinationPlaceMarker.setMap(null);
        originPlaceMarker.setMap(null);
        line.setMap(null);
        googleFunc.unlockMap(map);
    }

    function enterMode () {
        setIsGPSbroken(false);
        setIsEnterMode(true);
        setIsKeyboardEnterMode(true);
    }

    function destinationBtn() {
        setIsEnterMode(true);
        setSearchBarState('destination');
    }

    let CallTaxiTest;

    function cancleTaxi() { // 回到原點 !!!
        if(originPlaceMarker) originPlaceMarker.setMap(null)
        if(destinationPlaceMarker) destinationPlaceMarker.setMap(null)
        if(line) line.setMap(null);
        directionsDisplay.setDirections({routes: []});
        googleFunc.unlockMap(map);
        setOriginPlace("")
        setOriginPlaceId("")
        setDestinationPlace("")
        setDestinationPlaceId("")

        setIsEnterMode(false);
        setIsKeyboardEnterMode(false);
        setIsRouteCallTaxi(false);
        setIsDriverPage(false);
        setIsRoute(false);
        setIsCallingTaxi(false);
        setSearchBarState('origin');
        // for test
        console.log()
        clearTimeout(CallTaxiTest)

        setMapListener(map.addListener('dragend', throttle((e) => {
            setIsDraging(false);
            console.log('detect map moving~~');
            let geoOption = { lat: map.getCenter().lat(), lng: map.getCenter().lng() }
            // can I use Ref to solve this problem ??
            googleFunc.geocodeLatLng(geocoder, geoOption)
            .then(data => {
                setMapCenter(data);
            });
        }, 2000)))
    }


    function routeCallTaxi() {
        setIsCallingTaxi(true);
        // 等待傳送 socket 回傳的司機資料
        CallTaxiTest = setTimeout(() => {
            setIsCallingTaxi(false)
            setIsDriverPage(true);
        }, 5000)
    }

    return (
        <ThemeWrapper>
            <div style={{height: screenHeight + 'px'}} className="page">
                <div className="autocomplete">
                    {isRoute ? null :
                    <div className="autocomplete__searchbar" id="getOn" onClick={()=>setSearchBarState('origin')}>
                        <div className="autocomplete__searchbar__icon"><i style={searchBarState === "origin" ? {color: 'orange'} : {color: 'black'}} className="fa fa-map-marker" aria-hidden="true"/></div>
                        <div className="autocomplete__searchbar__input">
                            <input 
                                type="text" 
                                autoComplete="off" 
                                value={originPlace || ''} 
                                placeholder="上車地點" 
                                onFocus={() => focusHandler('origin')} 
                                onCompositionStart={compositioningHandle} 
                                onCompositionUpdate={compositioningHandle} 
                                onCompositionEnd={e => compositionHandle(e, 'origin')} 
                                onChange={throttle(e => searchBarHandler(e, 'origin'), 2000)}
                                disabled={!(isEnterMode && isKeyboardEnterMode)}
                            />
                            {isKeyboardEnterMode
                            ?   <i className="fa fa-times clear" onClick={() => clear('origin')} aria-hidden="true"/>
                            :   <i className="fa fa-eyedropper" onClick={() => enterMode()} aria-hidden="true"/>        
                            }
                        </div>
                    </div>
                    }

                    {!isRoute && isEnterMode
                    ?   <div className="autocomplete__searchbar" id="getOff" onClick={()=>setSearchBarState('destination')}>
                            <div className="autocomplete__searchbar__icon"><i style={searchBarState === "destination" ? {color: 'orange'} : {color: 'black'}} className="fa fa-map-marker" aria-hidden="true"/></div>
                            <div className="autocomplete__searchbar__input">
                                <input 
                                    type="text" 
                                    autoComplete="off" 
                                    value={destinationPlace || ''} 
                                    placeholder="下車地點" 
                                    onFocus={() => focusHandler('destination')} 
                                    onCompositionStart={compositioningHandle} 
                                    onCompositionUpdate={compositioningHandle} 
                                    onCompositionEnd={e => compositionHandle(e, 'destination')} 
                                    onChange={e => searchBarHandler(e, 'destination')}
                                    disabled={!(isEnterMode && isKeyboardEnterMode)}
                                />
                                {isKeyboardEnterMode
                                ?   <i className="fa fa-times clear" onClick={() => clear('destination')} aria-hidden="true"/>
                                :   <i className="fa fa-eyedropper" onClick={() => enterMode()} aria-hidden="true"/>       
                                }
                            </div>
                        </div>
                    :null
                    }
                    <div className={`predictResult ${isKeyboardEnterMode ? 'active' : ''}`}>
                        <div className="predictResult__item" key='mapMode' style={{color: 'lightblue'}} onClick={() => setIsKeyboardEnterMode(false)}>切換到地圖輸入模式:D</div>
                    {
                        predictResult ? predictResult.map((r,i) => <div id={r.place_id} className="predictResult__item" key={i} onClick={predictHandler}>{r.description}</div>) : null
                    }
                    </div>
                </div>
                {isRoute ? null
                :   <div id="arrow" className={`arrow ${isDraging ? 'arrowMove' : ''}`}>
                        {isGPSbroken ?
                            <div className="arrow-alert" onClick={() => setIsEnterMode(true)}>目前無法定位到您的位置</div>
                        :null
                        }
                        <i className="fa fa-map-marker" aria-hidden="true"/>
                    </div>
                }
                {isRoute || isEnterMode ? null
                :   <div className="menu">
                        <div className="menu-items">
                            <div className="menu-item active" onClick={() => alert('啾啾啾')}><span>立即叫車</span></div>
                            <div className="menu-item" onClick={() => alert('呱呱呱')}><span>立即回家</span></div>
                            <div className="menu-item" onClick={() => alert('咕咕咕')}><span>預約叫車</span></div>
                        </div>
                        <div className="menu-items">
                            <div className="menu-item" onClick={() => destinationBtn()}><span>下車地址(選填)</span></div>
                            <div className="menu-item" onClick={() => alert('再等我一下 快完成了:D')}><span>特殊需求</span></div>
                        </div>
                    </div>
                }
                {!isDriverPage && !isRoute && originPlace ? // 起點有值出現
                    <div className="finish" onClick={() => route()}><span>完成</span></div>
                :null
                }
                {!isDriverPage && !isRouteCallTaxi && isRoute ?
                    <div className="finish" onClick={() => returnHandler()}><span>回上一步</span></div>
                :null
                }
                {!isDriverPage && isRouteCallTaxi ?
                    <div className="finish" onClick={() => routeCallTaxi()}><span>快速叫車</span></div>
                :null
                }
                <div id="map"></div>
                {!isDriverPage && isCallingTaxi
                ?   <div className="waitTaxi">
                        <div className="smoke">
                            <span>幫</span>
                            <span>您</span>
                            <span>挑</span>
                            <span>選</span>
                            <span>好</span>
                            <span>司</span>
                            <span>機</span>
                            <span>中</span>
                        </div>
                        <div className="cancleSmoke" onClick={() => cancleTaxi()}>取消</div>
                    </div>
                :null
                }
                {isDriverPage  ?
                    <div className="driverPage">
                        <img src={driverData.driverImageUrl}/>
                        <div>DriverName : {driverData.driverName}</div>
                        <div>CarLabel : {driverData.carLabel}</div>
                        <div className="finish" onClick={() => cancleTaxi()}>取消叫車</div>
                    </div>
                :null
                }
                <div className={`changeMode ${themeState.dark ? 'light' : "dark"}`} onClick={() => toggleMode(themeState.dark)}><span></span></div>
            </div>
        </ThemeWrapper>
    );
}
export default App;

//useScript custom hooks from the site
let cachedScripts = [];

function useScript(src) {
    // Keeping track of script loaded and error state

    const [state, setState] = useState({
        loaded: false,
        error: false
    });

    useEffect(
        () => {
            // If cachedScripts array already includes src that means another instance ...
            // ... of this hook already loaded this script, so no need to load again.
            if (cachedScripts.includes(src)) {
                setState({
                    loaded: true,
                    error: false
                });
            } else {
                cachedScripts.push(src);
                // Create script
                let script = document.createElement("script");
                // async defer
                script.src = src;
                script.async = true;
                // Script event listener callbacks for load and error
                const onScriptLoad = () => {
                    setState({
                        loaded: true,
                        error: false
                    });
                };

                const onScriptError = () => {
                    // Remove from cachedScripts we can try loading again
                    const index = cachedScripts.indexOf(src);
                    if (index >= 0) cachedScripts.splice(index, 1);
                    script.remove();
                    setState({
                        loaded: true,
                        error: true
                    });
                };
                script.addEventListener("load", onScriptLoad);
                script.addEventListener("error", onScriptError);
                // Add script to document body
                document.body.appendChild(script);
                // Remove event listeners on cleanup
                return () => {
                    script.removeEventListener("load", onScriptLoad);
                    script.removeEventListener("error", onScriptError);
                };
            }
        },
        [src] // Only re-run effect if script src changes
    );
    return [state.loaded, state.error];
}



/***
* Example:
* googleFunc.autocompletePredict(autocomplete, map, "誠品").then(data => console.log(data));
* googleFunc.geocodeLatLng(geocoder, {lat: 121.5644720, lng: 25.132}).then(data => console.log(data));
* googleFunc.geocodeAddress(geocoder, '和泉中央駅（バス）').then(data => console.log(data));;
* googleFunc.drawingRoute(directionsService, directionsDisplay, {originPlaceId: "ChIJywaY1LurQjQRS74hsbes0Xk", destinationPlaceId: "ChIJX10H1gipQjQRabBucTpTekU"})
***/