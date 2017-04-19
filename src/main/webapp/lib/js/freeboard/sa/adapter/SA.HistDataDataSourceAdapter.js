/*
 *  Get His Data API datasource adapter
 *  @ken.tsai@advantech.com.tw
 *  @date 2015/10/20
 */

if (typeof (DataSourceAdapter) !== 'undefined') {
    DataSourceAdapter.register('getHistData', 'HistDataDataSourceAdapter');
}

var HistDataDataSourceAdapter = (function (log4jq, easydate) {

    var dsAdapter = {};

    dsAdapter.name = 'SA.HistDataDataSourceAdapter.js';

    var logger = log4jq.getLogger({
        loggerName: dsAdapter.name
    });

    /*
     {
     "header": [
     "Drink",
     "Taste",
     "Rating"
     ],
     "data": [
     {
     "Drink" : "Beer",
     "Taste" : "Awesome"
     },
     {
     "Drink" : "Vodka",
     "Taste" : "Bland",
     "Rating" : "8"
     }           
     ]
     }*/

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
        /*
         sourceData = {
         "result" : {
         "itemList" : [ {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 06:55:25:033"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 06:55:29:691"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 06:55:34:690"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 06:55:39:695"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 06:55:44:717"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 06:55:49:697"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 06:55:54:699"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 06:55:59:698"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 06:56:04:707"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 07:00:49:820"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 07:08:46:033"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 07:20:15:545"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 07:27:39:811"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-02 07:27:44:633"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-07 01:23:47:326"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 37,
         "ts" : "2015-10-07 01:23:52:335"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.599998,
         "ts" : "2015-10-07 08:43:28:698"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 08:45:28:743"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:37:44:520"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:37:49:500"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:37:53:526"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:37:58:552"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:03:576"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:09:604"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:14:601"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:19:637"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:23:650"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:28:701"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:33:730"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:39:995"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:45:048"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:49:371"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:54:385"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:38:59:430"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:04:456"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:09:498"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:14:510"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:19:523"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:24:556"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:29:571"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:34:599"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:39:631"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:44:664"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:48:669"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:54:700"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:39:59:737"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:40:04:759"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:40:08:782"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:40:13:779"
         }, {
         "sensorId" : "/FORA/Temperature",
         "val" : 36.700001,
         "ts" : "2015-10-07 09:40:18:830"
         } ],
         "totalsize" : 50
         }
         };
         */

        var itemList = sourceData.result.itemList;
        if (!$.isArray(itemList)) {
            itemList = [itemList];//conv2 array
        }
        var count = itemList.length;
        for (var i = 0; i < count; i++) {
            var tmpData = itemList[i];
            logger.debug(tmpData);
            var time = tmpData.ts;
            time = easydate.getDateTimeZone(time, false).replace(/\//g, '-');
//            table.data.push({
//                'Date': moment(time).format('YYYY-MM-DD'),
//                'Time': moment(time).format('HH:mm:ss'),
//                'Value': tmpData.val
//            
//            });
            var eachTR = {
            };
            eachTR[dateHeader] = moment(time).format('YYYY-MM-DD');
            eachTR[timeHeader] = moment(time).format('HH:mm:ss');
            eachTR[valueHeader] = parseFloat(parseFloat(tmpData.val).toFixed(5));
//            console.log(eachTR);
            table.data.push(eachTR);
        }
//        console.log(table);
        return table;
    };

    dsAdapter.c3js = function (sourceData) {
        
        logger.info('c3js');
        try{
//             sourceData = {
//            "result": {
//                "itemList": [{
//                        "sensorId": "/netMonInfoList/區域連線/recvDateByte",
//                        "val": 52867,
//                        "ts": "2015-09-09 07:51:26:184"
////"ts": "2015-09-09 07:51:26"
//                    }, {
//                        "sensorId": "/netMonInfoList/區域連線/recvDateByte",
//                        "val": 59565,
//                        "ts": "2015-09-09 07:51:34:201"
////"ts": "2015-09-09 07:51:34"
//                    }
//                    , {
//                        "sensorId": "/netMonInfoList/區域連線/recvDateByte1",
//                        "val": 60497,
//                        "ts": "2015-09-09 07:51:36:195"
//                    }
//                ]
//            }
//        };

//          sourceData = {
//            "result": {
//                "itemList": [{
//                        "sensorId": "/netMonInfoList/區域連線/recvDateByte",
//                        "val": 52867,
//                        "ts": "2015-09-09 07:51:26"
////"ts": "2015-09-09 07:51:26"
//                    }]
//            }};

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
            var arr = tmpData.ts.split(/[- :]/);
            var newDate = new Date(arr[0], arr[1] - 1, arr[2], arr[3], arr[4], arr[5]);
//            console.log(tmpData);
            //x-axis
//            
//            var time = easydate.getDateTimeZone(tmpData.ts, false).replace(/\//g, '-');
//            logger.debug('date with TZ: ' + time);
//            var convDate = Date.parse(time.replace(/-/g, '/'));
//            console.log('===>time: ' +  time + ', convDate:' + convDate);

            timeSeries.push(newDate);

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
                currDataColumn.push(tmpData.val);

            } else {

                //cannot find
                logger.debug('start to add new data series: ' + tmpData.sensorId);
                //create new data series
                var newDataSeries = [];
                newDataSeries.push(tmpData.sensorId);
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

//            alert(JSON.stringify(targetData));
        return targetData;
        }catch(err){
//            alert(err);
            logger.error(err);
            return sourceData;
        }

//        
    };

    window[dsAdapter.name] = dsAdapter;
//    console.log(dsAdapter);
    return dsAdapter;

})(log4jq, easydate);