import 'asset/css/maptalks.css';
const maptalks = require('asset/js/maptalks.js');
const THREE = require('three');
const { 
    BaseObject,
    ExtrudeUtil,
    GeoJSONUtil,
    GeoUtil,
    IdentifyUtil,
    LineMaterial,
    LineUtil,
    MergeGeometryUtil,
    MergedMixin,
    ThreeLayer,
    ThreeRenderer,
    geometryExtrude
} = require('asset/js/maptalks.three.js');

const autoComplete=require('asset/js/autoComplete.js');
import 'asset/css/main.css';

const startLat = 1.22557;
const startLng = 103.67592;

const endLat = 1.4267;
const endLng = 104.02542;

const defaultZoom=16;
const minZoom=16;
const maxZoom=16;

var latCounter = startLat;
var lngCounter = startLng;
var zoomCounter = minZoom;

const southWest=[startLat, startLng];
const northEast=[endLat, endLng];

var geocoders;
var features;

const defaultPitch=75;
const defaultBearing=0;
const mapCenter=[ 
    parseFloat((southWest[1]+northEast[1])/2), 
    parseFloat((southWest[0]+northEast[0])/2) 
];
const mapExtent = {
  top: southWest[0],
  left: southWest[1],
  bottom: northEast[0],
  right: northEast[1]
};

var map;
var resetMap=document.getElementById('resetMap');
var layer;
var threeLayer;

var loading_gif=document.getElementById('loading_gif');

const getColor = (featureProps) => {
    let buildingColor="";

    let MULTISTOREY_CARPARK=featureProps["MULTISTOREY_CARPARK"];
    let MARKET_HAWKER=featureProps["MARKET_HAWKER"];

    let RESIDENTIAL=featureProps["RESIDENTIAL"];
    let COMMERCIAL=featureProps["COMMERCIAL"];
    let MISCELLANEOUS=featureProps["MISCELLANEOUS"];
    let PRECINCT_PAVILION=featureProps["PRECINCT_PAVILION"];

    if(MULTISTOREY_CARPARK=="Y") {
        buildingColor=0X94999D;
    } else if(MARKET_HAWKER=="Y") {
        buildingColor=0XE58386;
    } else if(RESIDENTIAL=="Y" && MISCELLANEOUS=="Y") {
        buildingColor=0XEC9A35;
    } else if(COMMERCIAL=="Y" && MISCELLANEOUS=="Y") {
        buildingColor=0X9CFEFC;
    } else if(MISCELLANEOUS=="Y") {
        buildingColor=0XCC0224;
    } else if(RESIDENTIAL=="Y" && COMMERCIAL=="Y") {
        buildingColor=0X34AEE4;
    } else if(RESIDENTIAL=="Y" && COMMERCIAL=="N") {
        buildingColor=0XF2BA84;
    } else if(RESIDENTIAL=="N" && COMMERCIAL=="Y") {
        buildingColor=0X235294;
    } else if(PRECINCT_PAVILION=="Y") {
        buildingColor=0XACB20C;
    } else if(PRECINCT_PAVILION=="Y") {
        buildingColor=0XACB20C;
    } else {
        buildingColor=0X04A13C;
    }
    return buildingColor;
};
const jsonObjToHTMLTable = (featureProps) => {
    let POSTAL=featureProps["POSTAL"];
    let STREET=featureProps["STREET"];
    let YEAR_COMPLETED=featureProps["YEAR_COMPLETED"];

    let MULTISTOREY_CARPARK=featureProps["MULTISTOREY_CARPARK"];
    let MARKET_HAWKER=featureProps["MARKET_HAWKER"];
    let RESIDENTIAL=featureProps["RESIDENTIAL"];
    let COMMERCIAL=featureProps["COMMERCIAL"];
    let MISCELLANEOUS=featureProps["MISCELLANEOUS"];
    let PRECINCT_PAVILION=featureProps["PRECINCT_PAVILION"];

    let FLOORS=featureProps["MAX_HT_STOREY"];

    let htmlStr="";
    htmlStr+="<div>";
    htmlStr+="<table width='100%'>"

    htmlStr+="<tr><td><b>📌</b></td><td><small><b>S("+POSTAL+")</b></small></td></tr>";
    htmlStr+="<tr><td><b>🛣</b></td><td><small>Along <b>"+STREET+"</b></small></td></tr>";
    htmlStr+="<tr><td><b>🧱</b></td><td><small>Year <b>"+YEAR_COMPLETED+"&nbsp;⌛</b></small></td></tr>";
    htmlStr+="<tr><td><b>⛫</b></td><td><small><b>"+FLOORS+"</b> Storeys</small></td></tr>";
    htmlStr+="<tr><td><small><b>Symbology</b></small></td><td style='color:#"+getColor(featureProps).toString(16)+"'>◼</td></tr>";

    if(RESIDENTIAL=="Y") {
        htmlStr+="<tr><td><b>🏠</b></td><td><small>Residential</small></td></tr>";
    }
    if(COMMERCIAL=="Y") {
        htmlStr+="<tr><td><b>🏬</b></td><td><small>Commercial</small></td></tr>";
    }
    if(MARKET_HAWKER=="Y") {
        htmlStr+="<tr><td><b>🍽</b></td><td><small>Hawker Centre/Market</small></td></tr>";
    }
    if(MULTISTOREY_CARPARK=="Y") {
        htmlStr+="<tr><td><b>🚏🚗</b></td><td><small>Multi-Storey Carpark</small></td></tr>";
    }
    if(PRECINCT_PAVILION=="Y") {
        htmlStr+="<tr><td><b>🏖</b></td><td><small>Precint Pavilon</small></td></tr>";
    }
    if(MISCELLANEOUS=="Y") {
        htmlStr+="<tr><td><b>💕</b></td><td><small>Miscellaneous✶</small></td></tr>";
        htmlStr+="<tr><td colspan='2'><hr></td></tr>";
        htmlStr+="<tr><td colspan='2'><small>✶E.g. admin office, childcare centre, education centre, Residents' Committees centre</small></td></tr>";
    }
    htmlStr+="</table>";
    htmlStr+="</div>";

    return htmlStr;
};

var response;
async function init() {
    response=await fetch('api/data/json/geocoders');
    geocoders=await response.json();

    response=await fetch('api/data/json/hdb_building_polygons');
    var hdb_building_polygons=await response.json();
    features=hdb_building_polygons.features;

    map = new maptalks.Map('map',{
        center : mapCenter,
        zoom: defaultZoom,
        maxZoom: maxZoom,
        minZoom: minZoom,
        zoomControl: {
          'position'  : 'top-left',
          'slider'    : true,
          'zoomLevel' : false
        },
        scaleControl: {
          'position'  : 'bottom-right'
        },
        overviewControl : false,
        pitch: defaultPitch,
        bearing: defaultBearing,
        centerCross : false,
        doubleClickZoom : true,
        dragPitch : true,
        dragRotate : true,
        dragRotatePitch : true,
        fullExtent: mapExtent,
        baseLayer: new maptalks.TileLayer('base', {
          urlTemplate: window.location.origin+'/api/basemap/light_all/{z}/{x}/{y}.png',
          attribution: '<div class=\'custom-attribution\'><p>Rendered with <a href=\'http://maptalks.org\' target=\'_blank\'>maptalks</a> | © <a href=\'http://www.openstreetmap.org/copyright\' target=\'_blank\'>OpenStreetMap</a> contributors, © <a href=\'https://carto.com/attributions\' target=\'_blank\'>CARTO</a></p></div>'
        })
    });
  
    layer=new maptalks.VectorLayer('vector');
    threeLayer = new ThreeLayer('t', {
        forceRenderOnMoving : true,
        forceRenderOnRotating : true
    });
    threeLayer.addTo(map);
    layer.addTo(map);

    resetMap.onclick=function() {
        map.animateTo({
            center: mapCenter,
            zoom: defaultZoom,
            pitch: defaultPitch,
            bearing: defaultBearing
        }, {
            duration: 2000
        });
    };

    threeLayer.prepareToDraw = function (gl, scene, camera) {
        var me = this;
        var light = new THREE.DirectionalLight(0xffffff);
        light.position.set(0.0, -10.0, 10.0).normalize();
        scene.add(light);
        
        features.forEach(function (g) {
            var propertiesObj=g.properties;
            var color = getColor(propertiesObj);

            var totalHeight=5.0;

            let levels=propertiesObj.MAX_HT_STOREY;
            if(levels>1) {
                for(let l=0;l<(levels-1);l++) {
                    totalHeight+=3.6;
                }
            }
            var lat=propertiesObj['LATITUDE'];
            var lng=propertiesObj['LONGITUDE'];

            var marker = new maptalks.Marker([lng, lat], {
                cursor : "pointer",
                draggable : false,
                'single': true,
                'symbol': {
                    'markerFile'   : 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
                    'markerWidth'  : 36,
                    'markerHeight' : 36,
                    'markerOpacity': 0
                }
            }).addTo(layer);
            let markerTitle='<small>'+'📍&nbsp;'+propertiesObj.BLK_NO+' '+propertiesObj.BUILDING+'</small>';
            let tooltipContent=jsonObjToHTMLTable(propertiesObj);
            marker.setInfoWindow({
                'draggable': false,
                'single': true,
                'title': markerTitle,
                'content':'<div>'+tooltipContent+'</div>'
            });

            var material = new THREE.MeshPhongMaterial({
                color: color,
                opacity : 0.85
            });

            var mesh = me.toExtrudeMesh(maptalks.GeoJSON.toGeometry(g), 
                totalHeight,material,totalHeight
            );
            if (Array.isArray(mesh)) {
              scene.add.apply(scene, mesh);
            } else {
              scene.add(mesh);
            }
        });
    };

    autoComplete({
      selector: '#geocoder',
      minChars: 2,
      source: function(term, suggest){
        term = term.toLowerCase();
        var choices = Object.keys(geocoders);
        var suggestions = [];
        for (var i=0;i<choices.length;i++) {
            if (~choices[i].toLowerCase().indexOf(term)) {
              suggestions.push(choices[i]);
            }
        }
        suggest(suggestions);
      },
      onSelect: function(e, term, item) {
        let coordinatesStr=geocoders[term];
        let latlng=coordinatesStr.split(',');
        latlng=[parseFloat(latlng[1]),parseFloat(latlng[0])];
        map.animateTo({
            center: latlng,
            zoom: maxZoom,
            pitch: defaultPitch,
            bearing: defaultBearing
        }, {
            duration: 2000
        });
      }
    });
}

var t=null;
function panMapReady() {
    t=setInterval(() => {
         map.animateTo({
            center: [lngCounter,latCounter],
            zoom: zoomCounter,
            pitch: defaultPitch,
            bearing: defaultBearing
        }, {
            duration: 2000
        });

        latCounter+=0.01;
        
        if(latCounter>endLat) {
            lngCounter+=0.05;
            latCounter=startLat;
            if(lngCounter>endLng) {
                zoomCounter++;
                lngCounter=startLng;
                if(zoomCounter>maxZoom) {
                    clearInterval(t);
                    alert('DONE!');
                }
            }
        }
        console.log([lngCounter, latCounter]);
    }, 10000);
}
init();
loading_gif.style.display='none';
panMapReady();