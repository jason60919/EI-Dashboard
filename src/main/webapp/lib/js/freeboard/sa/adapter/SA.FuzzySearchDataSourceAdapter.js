/*
 *  Fuzzy Search datasource adapter
 *  @date 2015/10/20
 */
if (typeof (DataSourceAdapter) !== 'undefined') {
    DataSourceAdapter.register('FuzzySearch', 'FuzzySearchDataSourceAdapter');
}

var FuzzySearchDataSourceAdapter = (function (log4jq) {

    var dsAdapter = {};
    dsAdapter.name = 'SA.FuzzySearchDataSourceAdapter.js';

    var logger = log4jq.getLogger({
        loggerName: dsAdapter.name
    });

    function getMarkerFormSUSI(device) {
        logger.info('getMarkerFormSUSI');
        var marker = [];
        var strLal = "";
        if (device.hasOwnProperty('parent_lal'))
            if (device.parent_lal != null) strLal = device.parent_lal;
                    
        if (strLal == "")            
            if (device.hasOwnProperty('lal'))
                if (device.lal != null) strLal = device.lal;
        if (strLal != "") 
        {
            var latlng = strLal.split(';');
            var marker = [device.name.toString(), latlng[0], latlng[1]];
            logger.debug('create marker as below: ');
            logger.debug(marker);
        }
        else {
            logger.error('CANNOT find lal attr on device: ' + device.name);
        }
        return marker;
    }

    dsAdapter.multiGoogleMap = function (sourceData) {
        logger.info('multiGoogleMap');
        logger.debug(sourceData);
        var locations = [];

        try {
            if (sourceData.hasOwnProperty('result')) {

                var deviceItem = sourceData.result.item;
                if (!$.isArray(deviceItem)) {
                    logger.debug('detetc susi access result: ONLY one ');
                    var marker = getMarkerFormSUSI(deviceItem);
                    if (marker.length > 0) {
                        locations.push(marker);
                    }

                } else {
                    var countOfDeviceItem = deviceItem.length;
                    logger.debug('detect susi access result: ' + countOfDeviceItem);
                    for (var i = 0; i < countOfDeviceItem; i++) {
                        var device = deviceItem[i];
                        logger.debug(device);
                        var marker = getMarkerFormSUSI(device);
                        if (marker.length > 0) {
                            locations.push(marker);
                        }
                    }
                }
            }

        } catch (ex) {
            logger.error('Invalid data format: ' + ex);
        }

        return locations;

    };

    window[dsAdapter.name] = dsAdapter;
    return dsAdapter;
})(log4jq);
