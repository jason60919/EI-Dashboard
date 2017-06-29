/*
 * Template widget 
 * Integration with SA Fans
 * @date 2015/09/22
 * @requried 
 * js/libs/log4javascript/log4javascript.min.js
 * js/sa/utils/log4jq.js
 */
(function () {

    var logger = log4jq.getLogger({
        loggerName: 'SA.wg.multigooglemap.js'
    });
    logger.info('SA.wg.multigooglemap.js loaded');

    /*
     * i18n 
     */
    if (typeof (i18n) != 'undefined') {
        //i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'multiGoogleMap',
        display_name: $.i18n.t('plugins_wd.multi_gmap.display_name'),
        description: $.i18n.t('plugins_wd.multi_gmap.description'),
        fill_size: true,
        settings: [
            {
                name: 'title',
                validate: 'optional,maxSize[100]',
                display_name: $.i18n.t('global.title'),
//                        $.i18n.t('plugins_wd.progressbar.title'),
                type: 'text'
            },
            {
                name: 'locations',
                display_name: $.i18n.t('plugins_wd.multi_gmap.locations'),
                description: $.i18n.t('plugins_wd.multi_gmap.locations_description'),
                type: 'calculated'
//                ,default_value: '[["Advantech",25.0589972,121.3835085]]'
            },
            {
                name: 'zoom',
                display_name: $.i18n.t('plugins_wd.multi_gmap.zoom_level'),
                validate: 'required,custom[integer],min[0],max[21]',
                type: 'number',
                style: 'width:100px',
                default_value: 12,
                description: $.i18n.t('plugins_wd.multi_gmap.zoom_level_description'),
                addClass: 'advancedSetting'
            },
            {
                name: 'autoCenter',
                display_name: $.i18n.t('plugins_wd.multi_gmap.auto_center'),
                validate: 'required,min[1],max[20]',
                type: 'boolean',
                default_value: true,
                description: $.i18n.t('plugins_wd.multi_gmap.auto_center_description'),
                addClass: 'advancedSetting'
            },
            {
                name: 'blocks',
                display_name: $.i18n.t('global.plugins_wd.blocks'),
//                        $.i18n.t('plugins_wd.gmap.blocks'),
                validate: 'required,custom[integer],min[4],max[20]',
                type: 'number',
                style: 'width:100px',
                default_value: 4,
                description: $.i18n.t('global.plugins_wd.blocks_desc'),
                addClass: 'advancedSetting'
//                        $.i18n.t('plugins_wd.gmap.blocks_desc')
            }
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            logger.info('freeboard.loadWidgetPlugin: MultiGoogleMapWidget newInstance');
            bFitBounds = false;
            newInstanceCallback(new MultiGoogleMapWidget(settings));
        }
    });


    var multiGMId = 0;
    var bFitBounds = false;
    var MultiGoogleMapWidget = function (settings)
    {
        logger.info('MultiGoogleMapWidget init');

        var BLOCK_HEIGHT = 60;
        var CENTER_LAT = 25.0635316;
        var CENTER_LNG = 121.4820946;

        var currentSettings = settings;
        var locations = [];
        /*
         [
         ['Bondi Beach', -33.890542, 151.274856, 4],
         ['Coogee Beach', -33.923036, 151.259052, 5],
         ['Cronulla Beach', -34.028249, 151.157507, 3],
         ['Manly Beach', -33.80010128657071, 151.28747820854187, 2],
         ['Maroubra Beach', -33.950198, 151.259302, 1]
         ];
         */

        var markersArray = [];//keep markers

        var map = null;//google map instance
        var $mapElement = $('<div id="multi_gm_' + multiGMId + '" style="margin-top: 10px;"></div>');
        multiGMId++;

        var self = this;
        var currentSettings = settings;
        self.widgetType = 'multiGoogleMap';

        function setBlocks(blocks) {
            logger.info('setBlocks: ' + blocks);
            if (_.isUndefined($mapElement) || _.isUndefined(blocks))
                return;
            var height = BLOCK_HEIGHT * blocks - 30;
            logger.debug('map new height: ' + height);
            $mapElement.css({
                'height': height + 'px',
                'width': '100%'
            });
            if (!_.isNull(map)) {
                logger.debug('map resize');
                google.maps.event.trigger($mapElement[0], 'resize');
                updateMarkers();
            }
        }

        function createGoogleMap() {
            logger.info('createGoogleMap');
            if (_.isUndefined($mapElement))
                return;

            function initializeMap() {
                logger.info('initializeMap opts as below:');
                logger.info('zoom:' + currentSettings.zoom);

                var mapOptions = {
                    zoom: parseInt(currentSettings.zoom),
                    center: new google.maps.LatLng(CENTER_LAT, CENTER_LNG),
                    disableDefaultUI: true,
                    draggable: false,
                    zoomControl: true,
                    scrollwheel: true,
                    mapTypeId: google.maps.MapTypeId.ROADMAP
                };
                var bounds = new google.maps.LatLngBounds();

                logger.debug('init map');
                map = new google.maps.Map($mapElement[0], mapOptions);

                google.maps.event.addListener(map, 'zoom_changed', function () {
                    var zoomLevel = map.getZoom();
                    logger.debug('zoom_changed to level: ' + zoomLevel);

                    var fakeNewSetting = currentSettings;
                    fakeNewSetting.zoom = zoomLevel;
                    self.onSettingsChanged(fakeNewSetting);
                    //    if (zoomLevel >= minFTZoomLevel) {
                    //        FTlayer.setMap(map);
                    //    } else {
                    //        FTlayer.setMap(null);
                    //    }
                });
//                google.maps.event.addDomListener($mapElement[0], 'mouseenter', function (e) {
//                    logger.debug('mouseenter: ');
//                    e.cancelBubble = true;
//                    if (!map.hover) {
//                        map.hover = true;
//                        map.setOptions({zoomControl: true});
//                    }
//                });

//
//                google.maps.event.addDomListener($mapElement[0], 'mouseleave', function (e) {
//                    logger.debug('mouseleave: ');
//                    if (map.hover) {
//                        map.setOptions({zoomControl: false});
//                        map.hover = false;
//                    }
//                });

                //create markers
                updateMarkers();
            }

            if (window.google && window.google.maps) {
                initializeMap();
            } else {
                //load google map api
                window.gmap_initialize = initializeMap;
                //head.js('https://maps.googleapis.com/maps/api/js?v=3&callback=gmap_initialize');
                $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB_Ci0QO3N9TqWoR6ZfE46U90XGu-yH_g0&v=3.exp&sensor=false&callback=gmap_initialize", function () {
                    //initializeMap();
                });
            }
        }

        // Removes the overlays from the map, but keeps them in the array
        function clearOverlays() {
            logger.info('clearOverlays: ');
            if (markersArray) {
                for (i in markersArray) {
                    markersArray[i].setMap(null);
                }
                markersArray = [];
            }
        }

        function updateZoom(nZoom) {
            if (map != null) {
                map.setZoom(parseInt(nZoom));
            } else {
                logger.error('map instance doesnot initinal form updateZoom');
            }
        }
        function updateMarkers() {
            logger.info('updateMarkers: ');
            $mapElement.parent().find(".section-title").html(currentSettings.title);
            var bounds ;
            if (map != null) {
                clearOverlays();

                //to center
                bounds = new google.maps.LatLngBounds();
                var infowindow = new google.maps.InfoWindow();
                var marker, i;
//                locations = currentSettings.locations;
                var countOfLocations = locations.length;
                if (countOfLocations == 0) {
                    logger.warn('countOfLocations: ' + countOfLocations);

                    if (navigator.geolocation) {
                        // Get current position
                        navigator.geolocation.getCurrentPosition(
                            function (position) {
                                // Success!
                                var newLatLon = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                                map.panTo(newLatLon);
                            },
                            function () {
                                // Failed!
                            }
                        );
                    }


                } else {
                    logger.debug('add markers');
                    for (i = 0; i < countOfLocations; i++) {
                        var location = locations[i];
                        logger.debug('marker index: ' + i);
                        logger.debug('marker index 1: ' + location[1]);
                        logger.debug('marker index 2: ' + location[2]);
                        location[1] = parseFloat(location[1]) + i/100000;
                        location[2] = parseFloat(location[2]) + i/100000;
                        marker = new google.maps.Marker({
                            position: new google.maps.LatLng(location[1], location[2]),
                            map: map,
                            title: location[0]
                        });

                        markersArray.push(marker);

                        //extend the bounds to include each marker's position
                        bounds.extend(marker.position);

                        google.maps.event.addListener(marker, 'click', (function (marker, i) {
                            return function () {
                                logger.debug('click marker');
//                                {H: 25.037647332991305, L: 121.37443147418207}
                                var markerPos = marker.getPosition();

                                //set center with curr pos
//                                map.setZoom(8);
//                                map.setZoom(currentSettings.zoom);
                                map.setCenter(markerPos);

                                //open infowinow

//                                logger.debug(marker);
                                var nameOfMarker = locations[i][0];
                                logger.debug('click marker as below: ' + nameOfMarker);
                                infowindow.setContent(nameOfMarker);
                                infowindow.open(map, marker);
                            };
                        })(marker, i));
                    }

                    if (countOfLocations > 0)
                    {
                        if (!bFitBounds)
                        {
                            if(currentSettings.autoCenter){
                                logger.debug('map fitBounds');
                                map.fitBounds(bounds);
                                bFitBounds = true;
                            }
                        }
                    }
                    google.maps.event.trigger(map, 'resize');
                }
            } else {
                logger.error('map instance doesnot initinal form updatePosition');
            }

        }

        self.render = function (containerElement)
        {
            logger.info('render');
            //parent elem of widget
            //<div class="widget fillsize" data-bind="widget: true, css:{fillsize:fillSize}">
            //</div>
            var $containerElement = $(containerElement);
            $($containerElement).append('<h2 class="section-title"></h2>');
            $containerElement.append($mapElement);

            //init map widget
            setBlocks(currentSettings.blocks);
            createGoogleMap();
        };


        self.getHeight = function () {
            logger.info('getHeight');
            return currentSettings.blocks;
        };

        self.onPaneWidgetChanged = function(e){
            logger.info('onPaneWidgetChanged');
            google.maps.event.trigger(map, 'resize');
        };
        self.onSettingsChanged = function (newSettings)
        {
            bFitBounds = false;
            logger.info('onSettingsChanged');

            if (_.isNull(map)) {
                currentSettings = newSettings;
                return;
            }

            if (currentSettings.blocks != newSettings.blocks) {
                logger.debug('block change');
                setBlocks(newSettings.blocks);
            }
            if (currentSettings.zoom != newSettings.zoom) {
                logger.debug('zoom change');
                updateZoom(newSettings.zoom);
            }
            currentSettings = newSettings;
            $mapElement.parent().find(".section-title").html(currentSettings.title);
            google.maps.event.trigger(map, 'resize');
        };

        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection)
        {
            logger.info('onCalculatedValueChanged: ' + settingName);

            //Add icon to specify agent connect or not
            if ((agentConnection === false && !$mapElement.parent().find(".section-title").hasClass('agentDisconnect')) || (agentConnection === true && $mapElement.parent().find(".section-title").hasClass('agentDisconnect'))) {
                $mapElement.parent().find(".section-title").toggleClass('agentDisconnect');
                $mapElement.parent().find(".section-title").removeAttr('title');
            }

            if (settingName === 'locations') {
                locations = newValue;
                updateMarkers();
            }
        };

        self.onDispose = function ()
        {
            logger.info('onDispose');
        };

        self.onSettingsChanged(currentSettings);
    };


}());