// ┌────────────────────────────────────────────────┐ \\
// │ F R E E B O A R D                                                                              │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Copyright © 2013 Jim Heising (https://github.com/jheising)                                     │ \\
// │ Copyright © 2013 Bug Labs, Inc. (http://buglabs.net)                                           │ \\
// │ Copyright © 2015 Daisuke Tanaka (https://github.com/tanaka0323)                                │ \\
// ├────────────────────────────────────────────────┤ \\
// │ Licensed under the MIT license.                                                                │ \\
// └────────────────────────────────────────────────┘ \\

(function () {
    'use strict';
    var logger = log4jq.getLogger({
        loggerName: 'plugin.wg.gmap.js'
    });
    logger.info('plugin.wg.gmap.js loaded');

    freeboard.addStyle('.gm-style-cc a', 'text-shadow:none;');
    var singleGMId = 0;

    var googleMapWidget = function (settings) {

        logger.info('googleMapWidget loaded');

        var self = this;
        var BLOCK_HEIGHT = 60;

        var currentSettings = settings;
        var map = null,
                marker = null,
                poly = null;
//        var mapElement = $('<div></div>');
        var mapElement = $('<div id="single_gm_' + singleGMId + '" style="margin-top: 10px;"></div>');
        singleGMId++;
        var currentPosition = {};
        self.widgetType = 'googleMap';

        function updatePosition() {
            
            mapElement.parent().find(".section-title").html(currentSettings.title);
            if (!_.isNull(map) && !_.isNull(marker) && currentPosition.lat && currentPosition.lon) {
                var newLatLon = new google.maps.LatLng(currentPosition.lat, currentPosition.lon);
                marker.setPosition(newLatLon);
                if (currentSettings.drawpath)
                    poly.getPath().push(newLatLon);
                setTimeout(function () {
                    map.panTo(newLatLon);
                }, 100);
            }
            else
            {
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
            }
        }

        function setBlocks(blocks) {
            if (_.isUndefined(mapElement) || _.isUndefined(blocks))
                return;
            var height = BLOCK_HEIGHT * blocks - 30;
            mapElement.css({
                'height': height + 'px',
                'width': '100%'
            });
            if (!_.isNull(map)) {
                google.maps.event.trigger(mapElement[0], 'resize');
                updatePosition();
            }
        }

        function createWidget() {
            if (_.isUndefined(mapElement))
                return;

            function initializeMap() {
                var mapOptions = {
                    zoom: 12,
                    //center: new google.maps.LatLng(37.235, -115.811111),
                    //center: new google.maps.LatLng(25.0635316, 121.4820946),
                    center: new google.maps.LatLng(12.0635316, 111.4820946),
                    disableDefaultUI: true,
                    draggable: false
                };

                map = new google.maps.Map(mapElement[0], mapOptions);

                var polyOptions = {
                    strokeColor: '#0091D1',
                    strokeOpacity: 1.0,
                    strokeWeight: 3
                };

                poly = new google.maps.Polyline(polyOptions);
                poly.setMap(map);

                google.maps.event.addDomListener(mapElement[0], 'mouseenter', function (e) {
                    e.cancelBubble = true;
                    if (!map.hover) {
                        map.hover = true;
                        map.setOptions({zoomControl: true});
                    }
                });

                google.maps.event.addDomListener(mapElement[0], 'mouseleave', function (e) {
                    if (map.hover) {
                        map.setOptions({zoomControl: false});
                        map.hover = false;
                    }
                });

                marker = new google.maps.Marker({map: map});
                updatePosition();
            }

            if (window.google && window.google.maps) {
                initializeMap();
            } else {
                window.gmap_initialize = initializeMap;
                head.js('https://maps.googleapis.com/maps/api/js?v=3&callback=gmap_initialize');
            }
        }

        this.render = function (element) {
            $(element).append('<h2 class="section-title"></h2>');
            $(element).append(mapElement);
            setBlocks(currentSettings.blocks);
            createWidget();
        };

        this.onSettingsChanged = function (newSettings) {
            if (_.isNull(map)) {
                currentSettings = newSettings;
                return;
            }

            var updateCalculate = false;
            if (currentSettings.blocks != newSettings.blocks)
                setBlocks(newSettings.blocks);
            if (!newSettings.drawpath)
                poly.getPath().clear();

            if (currentSettings.lat != newSettings.lat || currentSettings.lon != newSettings.lon)
                updateCalculate = true;
            currentSettings = newSettings;
            mapElement.parent().find(".section-title").html(currentSettings.title);
            mapElement.parent().find(".section-title").prop('title', currentSettings.title);
            return updateCalculate;
        };

        this.onCalculatedValueChanged = function (settingName, newValue, agentConnection) {
            
            //Add icon to specify agent connect or not
            if ((agentConnection === false && !mapElement.parent().find(".section-title").hasClass('agentDisconnect')) || (agentConnection === true && mapElement.parent().find(".section-title").hasClass('agentDisconnect'))) {
                mapElement.parent().find(".section-title").toggleClass('agentDisconnect');
                mapElement.parent().find(".section-title").removeAttr('title');
            }

            if (settingName === 'lat')
                currentPosition.lat = newValue;
            else if (settingName === 'lon')
                currentPosition.lon = newValue;
            if ((typeof currentPosition.lat != "undefined") && (typeof currentPosition.lon != "undefined"))
            {
                updatePosition();
            }
        };

        this.onDispose = function () {
            // for memoryleak
            map = marker = poly = null;
        };

        this.onSizeChanged = function () {
            if (!_.isNull(map)) {
                google.maps.event.trigger(mapElement[0], 'resize');
                updatePosition();
            }
        };

        this.getHeight = function () {
            return currentSettings.blocks;
        };

        this.onSettingsChanged(settings);
    };

    freeboard.loadWidgetPlugin({
        type_name: 'googleMap',
        display_name: $.i18n.t('plugins_wd.gmap.display_name'),
        description: $.i18n.t('plugins_wd.gmap.description'),
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
                name: 'blocks',
                display_name: $.i18n.t('global.plugins_wd.blocks'),
//                        $.i18n.t('plugins_wd.gmap.blocks'),
                validate: 'required,custom[integer],min[4],max[20]',
                type: 'number',
                style: 'width:100px',
                default_value: 4,
                description:$.i18n.t('global.plugins_wd.blocks_desc')
//                        $.i18n.t('plugins_wd.gmap.blocks_desc')
            },
            {
                name: 'lat',
                display_name: $.i18n.t('plugins_wd.gmap.lat'),
                validate: 'optional,maxSize[2000]',
                type: 'calculated',
                description:$.i18n.t('global.limit_value_characters', 2000)
//                        $.i18n.t('plugins_wd.gmap.lat_desc')
            },
            {
                name: 'lon',
                display_name: $.i18n.t('plugins_wd.gmap.lon'),
                validate: 'optional,maxSize[2000]',
                type: 'calculated',
                description: $.i18n.t('global.limit_value_characters', 2000)
//                        $.i18n.t('plugins_wd.gmap.lon_desc')
            },
            {
                name: 'drawpath',
                display_name: $.i18n.t('plugins_wd.gmap.drawpath'),
                type: 'boolean',
                default_value: false
            }
        ],
        newInstance: function (settings, newInstanceCallback) {
            newInstanceCallback(new googleMapWidget(settings));
        }
    });
}());
