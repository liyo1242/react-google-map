import { useState, useEffect } from 'react';

// For animate Route line
export function animateLine(line) {
    let count = 0;
    window.setInterval(() => {
        count = (count + 1) % 60;
        let icons = line.get('icons');
        icons[0].offset = (count/2) + '%';
        line.set('icons', icons);
    }, 30) // speed
}

// For google map function
// @ return GEO position
// sometime the location will bad
export function geolocation(mapObject, setLoading) {
    setLoading(true);
    return new Promise((resolve, reject) => {
        let watcher = navigator.geolocation.watchPosition(
            position => {
                console.log(`High Accuracy: lat: ${position.coords.latitude} lng: ${position.coords.longitude}`);
                mapObject.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude })
                mapObject.setZoom(18);
                resolve(position)
            },
            error => {
                    console.log('watchPosition error.code' + error.code);
                    navigator.geolocation.getCurrentPosition( position => {
                    console.log(`low Accuracy: lat: ${position.coords.latitude} lng: ${position.coords.longitude}`);
                    mapObject.setCenter({ lat: position.coords.latitude, lng: position.coords.longitude })
                    mapObject.setZoom(18);
                    resolve(position)
                },
                error => {
                    console.log('watchPosition error.code' + error.code);
                })
            },
            {
                enableHighAccuracy: true,
                maximumAge: 10000,
                timeout: 3000 // 3s limit to get HighAccuracy location
            }
        )

        setTimeout(() => {
            console.log('stop to get user location');
            navigator.geolocation.clearWatch(watcher)
        }, 3100)
    }).catch(error => error)
}

// GPS: refactoring code use hook
export const usePosition = () => {
    const [position, setPosition] = useState({})
    const [Lerror, setLError] = useState(null)

    const onChange = ({coords}) => {
        console.log(`High Accuracy: lat: ${coords.latitude} lng: ${coords.longitude}`);
        setPosition({
            lat: coords.latitude,
            lng: coords.longitude
        })
    }
    const onError = error => {
        console.log('您沒有開啟GPS權限喔')
        setLError(error)
    }
    useEffect(() => {
        console.log('in geolocation effect')
        const geo = navigator.geolocation;
        if(!geo) {
            console.log('無法取得正確位置')
            setLError('Geolocation is broken')
            return
        }

        let geo_options = {
            enableHighAccuracy: true,
            maximumAge: 30000,
            timeout: 4000
        }

        let watcher = geo.watchPosition(onChange, onError, geo_options);
        let reListener = () => {
            console.log('remove listener')
            geo.clearWatch(watcher)
        }
        setTimeout(reListener, 4100);

        return () => reListener();
    }, [])

    return {...position, Lerror}
}

// @ return marker Object
export function placeIcon(iconType, position, mapObject, label) {
    // a lot of iconType ===
    let markerobj = new window.google.maps.Marker({
        map: mapObject,
        // icon: iconType,
        label: label,
        animation: window.google.maps.Animation.DROP,
        position: position
    })

    return markerobj;
}

export function geocodeAddress(geocoder, address) {
    console.log(' !!!!! Because Geocoding API, Google steal some money ( $0.005 ) from you');
    return new Promise((resolve, reject) => {
        geocoder.geocode({ 'address': address }, (results, status) => {
            if (status === "OK") {
                resolve(results[0]);
            } else {
                reject(alert(`Geocoder not working because status ${status} , please Google to solve problem`))
            }
        })
    })
}

export function geocodeLatLng(geocoder, LatLng) {
    console.log(' !!!!! Because Geocoding API, Google steal some money ( $0.005 ) from you');
    return new Promise((resolve, reject) => {
        geocoder.geocode({ 'location': LatLng }, (results, status) => {
            if (status === "OK") {
                results[0] ? resolve(results[0]) : reject(window.alert('sorry , no result , go home and play with your daddy'))
            } else {
                reject(window.alert(`Geocoder not working because status ${status} , please Google to solve problem`))
            }
        })
    })
}
// not sure map bound will effect or not ??
export function autocompletePredict(autocompleteService, mapObject, text) {
    let bounds = mapObject.getBounds()
    console.log(' !!!!! Because Places API, Google steal some money ( $0.00283 ) from you');
    return new Promise((resolve, reject) => {
        autocompleteService.getPlacePredictions({
            bounds: bounds,
            // componentRestrictions: "",
            input: text,
            type: 'establishment'
        }, data => resolve(data))
    }).catch(err => console.log(err))
}

// places contain start and end
export function drawingRoute(service, displayService, { originPlaceId, destinationPlaceId }) {
    console.log(' !!!!! Because Direction API, Google steal some money ( $0.005 ) from you');
    return new Promise((resolve, reject) => {
        service.route({
            origin: { 'placeId': originPlaceId },
            destination: { 'placeId': destinationPlaceId },
            travelMode: 'DRIVING' // ok!! :D just default
        }, (res, status) => {
            if (status === "OK") {
                displayService.setDirections(res);
                resolve(res);
            } else {
                reject('go home and play with your daddy')
            }
        })
    })
}

export function lockMap(map) {
    map.set('draggable', false);
}

export function unlockMap(map) {
    //  maybe need a resize
    map.set('draggable', true);
}