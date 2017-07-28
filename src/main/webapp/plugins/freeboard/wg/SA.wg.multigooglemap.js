(function () {

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
                type: 'text'
            },
            {
                name: 'locations',
                display_name: $.i18n.t('plugins_wd.multi_gmap.locations'),
                description: $.i18n.t('plugins_wd.multi_gmap.locations_description'),
                type: 'calculated'
            },
            {
                name: 'zoom',
                display_name: $.i18n.t('plugins_wd.multi_gmap.zoom_level'),
                validate: 'required,custom[integer],min[0],max[22]',
                type: 'number',
                style: 'width:100px',
                default_value: 12,
                description: $.i18n.t('plugins_wd.multi_gmap.zoom_level_description'),
                addClass: 'advancedSetting'
            },
            {
                name: 'center',
                display_name: $.i18n.t('plugins_wd.multi_gmap.center'),
                type: 'text',
                style: 'width:100px',
                default_value: "0,0",
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
                validate: 'required,custom[integer],min[4],max[20]',
                type: 'number',
                style: 'width:100px',
                default_value: 4,
                description: $.i18n.t('global.plugins_wd.blocks_desc'),
                addClass: 'advancedSetting'
            }
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            newInstanceCallback(new MultiGoogleMapWidget(settings));
        }
    });


    var MultiGoogleMapWidget = function (settings)
    {
        var self = this;
        var currentSettings = settings;
        var titleElement = $('<h2 class="section-title"></h2>');
        var currentID = _.uniqueId('wgd_');
        var $mapElement = $('<div id="' + currentID + '" style="text-align: center; width: 100%; height: 100%;"></div>');

        var map = null;//google map instance
        var BLOCK_HEIGHT = 60;
        var markersArray = [];//keep markers
        var locations = [];
        var nMinZoom = 12;

        $mapElement.resize(function () {
            if (map != null)
                google.maps.event.trigger(map, 'resize');
        });

        self.render = function (containerElement) {
            $(containerElement).append(titleElement).append($mapElement);
            titleElement.html((_.isUndefined(currentSettings.title) ? '' : currentSettings.title));
            titleElement.prop('title', titleElement.html());

            //Initial Goole Map
            if (window.google && window.google.maps) {
                self.initializeMap();
            } else {
                $.getScript("https://maps.googleapis.com/maps/api/js?key=AIzaSyB_Ci0QO3N9TqWoR6ZfE46U90XGu-yH_g0&v=3.exp&sensor=false", function () {
                    self.initializeMap();
                });
            }
        };

        self.initializeMap = function () {
            var mapProp = {
                center: new google.maps.LatLng(0, 0),
                zoom: 1,
            };
            map = new google.maps.Map(document.getElementById(currentID), mapProp);
            google.maps.event.addListener(map, 'zoom_changed', function () {
                currentSettings.zoom = map.getZoom();
            });
            google.maps.event.addListener(map, 'dragend', function () {
                var oCenter = map.getCenter();
                currentSettings.center = oCenter.lat().toString() + "," + oCenter.lng().toString();
                currentSettings.autoCenter = false;
            });
            self.setBlocks(currentSettings.blocks);
        };
        self.setBlocks = function (blocks) {
            if (_.isUndefined($mapElement) || _.isUndefined(blocks))
                return;
            var height = BLOCK_HEIGHT * blocks - 30;
            $mapElement.css({
                'height': height + 'px',
                'width': '100%'
            });
            if (!_.isNull(map)) {
                google.maps.event.trigger($mapElement[0], 'resize');
                //updateMarkers();
            }
        }

        self.getHeight = function () {
            return currentSettings.blocks;
        };

        self.onSettingsChanged = function (newSettings) {
            titleElement.html((_.isUndefined(newSettings.title) ? '' : newSettings.title));
            titleElement.prop('title', titleElement.html());
            if (newSettings.locations != currentSettings.locations) {
                self.updateMarkers([]);
            }
            if (newSettings.zoom != currentSettings.zoom) {
                map.setZoom(newSettings.zoom);
            }
            if (newSettings.blocks != currentSettings.blocks) {
                self.setBlocks(newSettings.blocks);
            }
            currentSettings = newSettings;
        };

        self.onCalculatedValueChanged = function (settingName, newValue, agentConnection) {
            if ((settingName == "locations") && $.isArray(newValue)) {
                self.updateMarkers(newValue);
            }

            if ((settingName == "locations") && (newValue.hasOwnProperty('result'))) {
                var locations = [];
                var deviceItem = newValue.result.item;
                if ($.isArray(deviceItem)) {
                    for (var i = 0; i < newValue.result.item.length; i++) {
                        var device = newValue.result.item[i];
                        var marker = self.getMarkers(device);
                        if (marker.length > 0)
                            locations.push(marker);
                    }
                    self.updateMarkers(locations);
                }
            }
        };

        self.onDispose = function () {
        };

        self.updateMarkers = function (aLocations) {
            if (map != null) {
                if (markersArray) {
                    for (i in markersArray) {
                        markersArray[i].setMap(null);
                    }
                    markersArray = [];
                }

                if (aLocations.length == 0) {
                    if (navigator.geolocation) {
                        navigator.geolocation.getCurrentPosition(
                            function (position) {
                                var newLatLon = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
                                map.panTo(newLatLon);
                            },
                            function () {
                            }
                        );
                    }
                } else {
                    var bounds = new google.maps.LatLngBounds();
                    for (var i = 0; i < aLocations.length; i++) {
                        var location = aLocations[i];
                        location[1] = parseFloat(location[1]) + i / 100000;
                        location[2] = parseFloat(location[2]) + i / 100000;
                        var marker = new google.maps.Marker({
                            position: new google.maps.LatLng(location[1], location[2]),
                            map: map,
                            title: location[0]
                        });
                        markersArray.push(marker);
                        bounds.extend(marker.position);
                        var infowindow = new google.maps.InfoWindow();
                        google.maps.event.addListener(marker, 'click', (function (marker, i) {
                            return function () {
                                var markerPos = marker.getPosition();
                                map.setCenter(markerPos);
                                infowindow.setContent(aLocations[i][0]);
                                infowindow.open(map, marker);
                            };
                        })(marker, i));
                    }
                    if (currentSettings.autoCenter)
                    {
                        google.maps.event.trigger(map, 'resize');
                        setTimeout(function () {
                            map.fitBounds(bounds);
                            if (map.getZoom() > nMinZoom)
                                map.setZoom(nMinZoom);
                        }, 100);
                    }
                    else {
                        google.maps.event.trigger(map, 'resize');
                        setTimeout(function () {
                            if (currentSettings.zoom != map.getZoom())
                                map.setZoom(currentSettings.zoom);
                            var oCenter = map.getCenter();
                            if (currentSettings.center != oCenter.lat().toString() + "," + oCenter.lng().toString()) {
                                if (typeof currentSettings.center == "undefined") currentSettings.center = "0,0";
                                var strCenter = currentSettings.center;
                                var aCenter = strCenter.split(",");
                                var oCenter = new google.maps.LatLng(parseFloat(aCenter[0]), parseFloat(aCenter[1]));
                                map.panTo(oCenter);
                            }
                        }, 100);
                    }
                }
            }
            else {
                setTimeout(function () {
                    self.updateMarkers(aLocations);
                }, 1000);
            }
        }

        self.getMarkers = function (device)
        {
            var marker = [];
            var strLal = "";
            if (device.hasOwnProperty('parent_lal'))
                if (device.parent_lal != null)
                    strLal = device.parent_lal;

            if (strLal == "")
                if (device.hasOwnProperty('lal'))
                    if (device.lal != null)
                        strLal = device.lal;
            if (strLal != "") {
                var latlng = strLal.split(';');
                var marker = [device.name.toString(), latlng[0], latlng[1]];
            }
            return marker;
        }
    };
}());