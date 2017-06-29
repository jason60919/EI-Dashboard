/*
 *  Data Analytics datasource adapter 
 *  @date 2015/10/27
 */
if (typeof (DataSourceAdapter) !== 'undefined') {
    DataSourceAdapter.register('dataAnalyze', 'DataAnalyticsDataSourceAdapter');
}

var DataAnalyticsDataSourceAdapter = (function (log4jq, easydate) {

    var dsAdapter = {};
    dsAdapter.name = 'SA.DataAnalyticsDataSourceAdapter.js';

    var logger = log4jq.getLogger({
        loggerName: dsAdapter.name
    });

    /*
     * Sample widget function
     * dsAdapter.<WIDGET_TYPE_NAME> = function (sourceData) {};
     */
    dsAdapter.c3js = function (sourceData) {
        logger.info('c3js');
        logger.debug(sourceData);
//        {"result":{"unit":"5_MINUTE","itemList":[{"val":"0","unitVal":"2015-10-27 08:55:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:00:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:05:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:10:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:15:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:20:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:25:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:30:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:35:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:40:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:45:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-27 09:50:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"}]}}
        var timeSeries = ['x'];
        var targetData = {
                data: {
                x: 'x',
                xFormat: '%Y-%m-%d %I:%M:%S:%L', // how the date is parsed
                        columns: [
                   
                        ]
                },
                axis: {
                        x: {
                                type: 'timeseries',
                                tick: {
                        culling: {
                            max: 4 // the number of tick texts will be adjusted to less than this value
                        },
                        fit: true,
                        //                format: '%Y-%m-%d'
                        //format: '%Y-%m-%d %H:%M:%S'
//                                         format: '%Y-%m-%d %I:%M:%S'
//                        format: '%Y-%m-%d %I:%M:%S:%L'
                        format: '%Y-%m-%d %H:%M:%S:%L'
                                }
                        }
                }
        };

        logger.debug(sourceData);

        var itemList = sourceData.result.itemList;
        if (!$.isArray(itemList)) {
            itemList = [itemList];//conv2 array
        }
        var count = itemList.length;

        var sensorIdCheckedArr = [];//用來記錄已放進去過的sensorId
        for (var i = 0; i < count; i++) {

            var tmpData = itemList[i];
            logger.debug(tmpData);

            //x-axis
//            
            var time = easydate.getDateTimeZone(tmpData.unitVal, false).replace(/\//g, '-');
            logger.debug('date with TZ: ' + time);
            //timeSeries.push(Date.parse(time));

            var strDateTile = tmpData.unitVal;
            var aDate = strDateTile.split(/[^0-9]/);
            var dRet = new Date(aDate[0],aDate[1]-1,aDate[2],aDate[3],aDate[4],aDate[5]);
            timeSeries.push(Date.parse(dRet));

//            timeSeries.push(Date.parse(tmpData.ts));

            //add data
//        var isCheckIndex = sensorIdCheckedArr.indexOf(tmpData.sensorId);
            var isCheckIndex = $.inArray(tmpData.sensorId, sensorIdCheckedArr);
//            logger.debug('isCheckIndex: ' + isCheckIndex);
            if (isCheckIndex > -1) {
                //find it
                var currDataColumn = targetData.data.columns[isCheckIndex];
//                 logger.debug(currDataColumn);
                if (currDataColumn.length == 1) {
                    //first add label and data
                    currDataColumn.push(tmpData.sensorId);
                }
                if ((g_agentID != "") && (tmpData.sensorId == "/Input Registers/Temperature"))
                    currDataColumn.push(tmpData.val -100);
                else
                    currDataColumn.push(tmpData.val);

            } else {

                //cannot find
                logger.debug('start to add new data series: ' + tmpData.sensorId);
                //create new data series
                var newDataSeries = [];
                newDataSeries.push(tmpData.sensorId);
                if ((g_agentID != "") && (tmpData.sensorId == "/Input Registers/Temperature"))
                    newDataSeries.push(tmpData.val -100);
                else
                    newDataSeries.push(tmpData.val);

                //add new data series to columns
                targetData.data.columns.push(newDataSeries);
                //push record
                sensorIdCheckedArr.push(tmpData.sensorId);
            }
        }
        //add timeseries
//        logger.debug(timeSeries);
//        timeSeries = ["x", "2015-09-09 15:51:26", "2015-09-09 15:51:34"];
        targetData.data.columns.push(timeSeries);
//        console.log(targetData.data.columns);
//        console.log(targetData.data.columns[0]);
//        console.log(targetData.data.columns[1]);
//        console.log(targetData.data.columns[2]);
        return targetData;
    };

    dsAdapter.jqPlot = function (sourceData) {
        logger.info('jqPlot');
        logger.debug(sourceData);

        //{"result":{"unit":"5_MINUTE","itemList":[{"val":"0","unitVal":"2015-10-28 06:05:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:10:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:15:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:20:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:25:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:30:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:35:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:40:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:45:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:50:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"},{"val":"0","unitVal":"2015-10-28 06:55:00","sensorId":"/hddInfoList/Disk0-Windows 7-0 SSD/hddHealthPercent"}]}}
        var ticksUnit = sourceData.result.unit;
        switch (ticksUnit) {
            case '5_MINUTE':
//                ticksUnit = 'hour';
                ticksUnit = 'minute';
                break;
            case 'HOUR':
//                ticksUnit = 'day';
                ticksUnit = 'hour';
                break;
            case 'DAY':
//                ticksUnit = 'month';
                ticksUnit = 'day';
                break;
            case 'MONTH':
//                ticksUnit = 'year';
                ticksUnit = 'month';
                break;
            case 'YEAR':
                ticksUnit = 'year';
                
                break;
        }
        var convDataSet = [];
        //sample data
        //{
        //  unit: MONTH,
        //  itemList: [object Object],[object Object]
        //}

        var dataSet = sourceData.result.itemList;
        logger.debug('dataset as below:');
        logger.debug(dataSet);

        if ($.isArray(dataSet)) {
            //multiple result
            logger.debug('data size: ' + dataSet.length);
            var indexOfResultData = 0;
            for (indexOfResultData; indexOfResultData < dataSet.length; indexOfResultData++) {
                var sensorData = dataSet[indexOfResultData];
                logger.debug('current sensor as below: ');
                logger.debug(sensorData);

                //進行前端的timezone轉換處理
                var dateWithTimeZone = '';
                logger.debug('unitVal: ' + sensorData.unitVal);
                dateWithTimeZone = easydate.getDateTimeZone(sensorData.unitVal, false);
                logger.debug('dateWithTimeZone: ' + dateWithTimeZone);

                //var xDate = new Date(sensorData.unitVal);
                //var conv2jqFormat = [easydate.date2Str(xDate), sensorData.val];
                //unitVal -> date format
                //進行前端的timezone轉換處理
                var dateWithTimeZone = '';
                
                if (ticksUnit != 'year') {
                    logger.debug('Not Year tick');
                    dateWithTimeZone = easydate.getDateTimeZone(sensorData.unitVal, false);
                } else {
                    logger.debug('Year tick');
                    dateWithTimeZone = sensorData.unitVal + '-01-01';
                }
                 logger.debug('dateWithTimeZone after ticksUnit: ' + dateWithTimeZone);
                var newDate = easydate.str2DateWithDatePeriod(
                        dateWithTimeZone,
                        ticksUnit);

                var conv2jqFormat = [newDate, sensorData.val];
                logger.debug('cov jqformat as below:');
                logger.debug(conv2jqFormat);
                convDataSet.push(conv2jqFormat);
            }

        } else {
            //single result
            var sensorData = dataSet.itemList;

            var dateWithTimeZone = '';

            if (ticksUnit != 'year') {
                dateWithTimeZone = easydate.getDateTimeZone(sensorData.unitVal, false);
            } else {
                dateWithTimeZone = sensorData.unitVal + '-01-01';
            }

            var newDate = easydate.str2DateWithDatePeriod(
                    dateWithTimeZone,
                    ticksUnit);

            var conv2jqFormat = [newDate, sensorData.val];
            logger.debug('cov jqformat as below:');
            logger.debug(conv2jqFormat);
            convDataSet.push(conv2jqFormat);
        }
        return convDataSet;
    };

    dsAdapter.table = function (sourceData) {

        logger.info('table');

        var dateHeader = $.i18n.t('global.date');
        var timeHeader = $.i18n.t('global.time');
        var valueHeader = $.i18n.t('global.value');
        var table = {
//            header: ['Date', 'Time', 'Value'],
            header: [dateHeader, timeHeader, valueHeader],
            data: []
        };

        var itemList = sourceData.result.itemList;
        if (!$.isArray(itemList)) {
            itemList = [itemList];//conv2 array
        }
        var count = itemList.length;
        for (var i = 0; i < count; i++) {
            var tmpData = itemList[i];
            logger.debug(tmpData);
            var time = tmpData.unitVal;
            time = easydate.getDateTimeZone(time, false);
//            table.data.push({
////                'Date': moment(time).format('YYYY-MM-DD'),
////                'Time': moment(time).format('HH:mm:ss'),
////                'Value': tmpData.val
//               
//            });

            var eachTR = {
            };
            eachTR[dateHeader] = moment(time).format('YYYY-MM-DD');
            eachTR[timeHeader] = moment(time).format('HH:mm:ss');
            eachTR[valueHeader] = parseFloat(tmpData.val).toFixed(5);
            table.data.push(eachTR);
        }
//        console.log(table);
        return table;
    };


    window[dsAdapter.name] = dsAdapter;

    return dsAdapter;
})(log4jq, easydate);
