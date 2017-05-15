(function () {
    var Display_EnableSensorCalc = true;
    var SUSI_DS_CONFIG = {
        SrvStatus: "webresources/ServerMgmt/getWebSrvStatus",
        SUSIControl: "HWMonitorMgmt/getHWData",
        getDeviceData: {
            url: "webresources/DeviceCtl/getDeviceData",
            method: "POST"
        },
        getDevGroupAndAcunt: {
            url: "webresources/DeviceGroupMgmt/getGroupAndAccount",
            method: "GET"
        },
        FuzzySearch: {
            url: "common/v1/devices",
            method: "GET"
        },
        Plugins: {
            url: "common/v1/devices/{did}/plugins",
            method: "GET"
        },
        Sensors: {
            url: "common/v1/devices/{did}/sensors",
            method: "GET"
        },
        getSensorID: {
            url: "webresources/DeviceCtl/getSensorID",
            method: "POST"
        },
        getMaxHistData: {
            url: "webresources/DeviceCtl/getMaxHistData",
            method: "POST"
        },
        getMinHistData: {
            url: "webresources/DeviceCtl/getMinHistData",
            method: "POST"
        },
        getAvgHistData: {
            url: "webresources/DeviceCtl/getAvgHistData",
            method: "POST"
        },
        logIn: {
            url: "webresources/AccountMgmt/login",
            method: "POST"
        }
    };
    //Type Clock
    var clockDatasource = function (settings, updateCallback) {
        var self = this;
        var currentSettings = settings;
        var timer;

        function stopTimer() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        }

        function updateTimer() {
            stopTimer();
            timer = setInterval(self.updateNow, currentSettings.refresh * 1000);
        }

        this.updateNow = function () {
            var date = new Date();

            var data = {
                numeric_value: date.getTime(),
                full_string_value: date.toLocaleString(),
                date_string_value: date.toLocaleDateString(),
                time_string_value: date.toLocaleTimeString(),
                date_object: date
            };

            updateCallback(data);
        }

        this.onDispose = function () {
            stopTimer();
        }

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            updateTimer();
        }

        updateTimer();
    };
    freeboard.loadDatasourcePlugin({
        "type_name": "clock",
        "display_name": $.i18n.t('plugins_ds.clock.display_name'),
        "description": $.i18n.t('plugins_ds.clock.description'),
        "settings": [
            {
                "name": "refresh",
                "display_name": $.i18n.t('plugins_ds.clock.refresh'),
                validate: 'required,custom[integer],min[1],max[3600]',
                "type": "number",
                "suffix": $.i18n.t('plugins_ds.clock.refresh_suffix'),
                "default_value": 1
            }
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new clockDatasource(settings, updateCallback));
        }
    });

    //Type JSON   
    var jsonDatasource = function (settings, updateCallback) {
        var self = this;
        var updateTimer = null;
        var currentSettings = settings;
        var errorStage = 0; // 0 = try standard request
        // 1 = try JSONP
        // 2 = try thingproxy.freeboard.io
        var lockErrorStage = false;
        function updateRefresh(refreshTime) {
            if (updateTimer) {
                clearInterval(updateTimer);
            }

            updateTimer = setInterval(function () {
                self.updateNow();
            }, refreshTime);
        }

        updateRefresh(currentSettings.refresh * 1000);
        this.updateNow = function () {
            if ((errorStage > 1 && !currentSettings.use_thingproxy) || errorStage > 2) // We've tried everything, let's quit
            {
                return; // TODO: Report an error
            }

            var requestURL = currentSettings.url;
            if (errorStage == 2 && currentSettings.use_thingproxy) {
                requestURL = (location.protocol == "https:"
                        ? "https:" : "http:") + "//thingproxy.freeboard.io/fetch/" + encodeURI(currentSettings.url);
            }

            var body = currentSettings.body;
            // Can the body be converted to JSON?
            body = body.replace(/&quot;/g, '\"');
//            console.log(body);
//            if (body) {
//                try {
//                    body = JSON.parse(body);
//                }
//                catch (e) {
//                }
//            }

            $.ajax({
                url: requestURL,
                dataType: (errorStage == 1) ? "JSONP" : "JSON",
                type: currentSettings.method || "GET",
                data: body,
                beforeSend: function (xhr) {
                    try {
                        _.each(currentSettings.headers, function (header) {
                            var name = header.name;
                            var value = header.value;
                            if (!_.isUndefined(name) && !_.isUndefined(value)) {
                                xhr.setRequestHeader(name, value);
                            }
                        });
                    }
                    catch (e) {
                    }
                },
                success: function (data) {
                    lockErrorStage = true;
                    updateCallback(data);
                },
                error: function (xhr, status, error) {
                    if (!lockErrorStage) {
                        // TODO: Figure out a way to intercept CORS errors only. The error message for CORS errors seems to be a standard 404.
                        errorStage++;
                        self.updateNow();
                    }
                }
            });
        }

        this.onDispose = function () {
            clearInterval(updateTimer);
            updateTimer = null;
        }

        this.onSettingsChanged = function (newSettings) {
            lockErrorStage = false;
            errorStage = 0;
            currentSettings = newSettings;
            updateRefresh(currentSettings.refresh * 1000);
            self.updateNow();
        }
    };
    freeboard.loadDatasourcePlugin({
        type_name: "JSON",
        display_name: $.i18n.t('plugins_ds.json.display_name'),
        description: $.i18n.t('plugins_ds.json.description'),
        settings: [
            {
                name: "url",
                display_name: $.i18n.t('plugins_ds.json.url'),
                type: "text"
            },
            {
                name: "use_thingproxy",
                display_name: $.i18n.t('plugins_ds.json.use_thingproxy'),
                description: $.i18n.t('plugins_ds.json.use_thingproxy_desc'),
                type: "boolean",
                default_value: true
            },
            {
                name: "refresh",
                display_name: $.i18n.t('plugins_ds.json.refresh'),
                validate: 'required,custom[integer],min[1],max[3600]',
                type: "number",
                suffix: $.i18n.t('plugins_ds.json.refresh_suffix'),
                default_value: 5
            },
            {
                name: "method",
                display_name: $.i18n.t('plugins_ds.json.method'),
                type: "option",
                options: [
                    {
                        name: "GET",
                        value: "GET"
                    },
                    {
                        name: "POST",
                        value: "POST"
                    },
                    {
                        name: "PUT",
                        value: "PUT"
                    },
                    {
                        name: "DELETE",
                        value: "DELETE"
                    }
                ]
            },
            {
                name: "body",
                display_name: $.i18n.t('plugins_ds.json.body'),
                type: "text",
                description: $.i18n.t('plugins_ds.json.body_desc')
            },
            {
                name: "headers",
                display_name: $.i18n.t('plugins_ds.json.headers'),
                type: "array",
                settings: [
                    {
                        name: "name",
                        display_name: $.i18n.t('plugins_ds.json.headers_name'),
                        type: "text"
                    },
                    {
                        name: "value",
                        display_name: $.i18n.t('plugins_ds.json.headers_value'),
                        type: "text"
                    }
                ]
            }
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new jsonDatasource(settings, updateCallback));
        }
    });

    //Type Weather Map API
    var yahooWeatherDatasource = function (settings, updateCallback) {
        var self = this;
        var updateTimer = null;
        var currentSettings = settings;

        // condition code
        var conditionMap = [
            $.i18n.t('plugins_ds.yahooweather.cond_0'), // 0   tornado
            $.i18n.t('plugins_ds.yahooweather.cond_1'), // 1   tropical storm
            $.i18n.t('plugins_ds.yahooweather.cond_2'), // 2   hurricane
            $.i18n.t('plugins_ds.yahooweather.cond_3'), // 3   severe thunderstorms
            $.i18n.t('plugins_ds.yahooweather.cond_4'), // 4   thunderstorms
            $.i18n.t('plugins_ds.yahooweather.cond_5'), // 5   mixed rain and snow
            $.i18n.t('plugins_ds.yahooweather.cond_6'), // 6   mixed rain and sleet
            $.i18n.t('plugins_ds.yahooweather.cond_7'), // 7   mixed snow and sleet
            $.i18n.t('plugins_ds.yahooweather.cond_8'), // 8   freezing drizzle
            $.i18n.t('plugins_ds.yahooweather.cond_9'), // 9   drizzle
            $.i18n.t('plugins_ds.yahooweather.cond_10'), // 10  freezing rain
            $.i18n.t('plugins_ds.yahooweather.cond_11'), // 11  showers
            $.i18n.t('plugins_ds.yahooweather.cond_12'), // 12  showers
            $.i18n.t('plugins_ds.yahooweather.cond_13'), // 13  snow flurries
            $.i18n.t('plugins_ds.yahooweather.cond_14'), // 14  light snow showers
            $.i18n.t('plugins_ds.yahooweather.cond_15'), // 15  blowing snow
            $.i18n.t('plugins_ds.yahooweather.cond_16'), // 16  snow
            $.i18n.t('plugins_ds.yahooweather.cond_17'), // 17  hail
            $.i18n.t('plugins_ds.yahooweather.cond_18'), // 18  sleet
            $.i18n.t('plugins_ds.yahooweather.cond_19'), // 19  dust
            $.i18n.t('plugins_ds.yahooweather.cond_20'), // 20  foggy
            $.i18n.t('plugins_ds.yahooweather.cond_21'), // 21  haze
            $.i18n.t('plugins_ds.yahooweather.cond_22'), // 22  smoky
            $.i18n.t('plugins_ds.yahooweather.cond_23'), // 23  blustery
            $.i18n.t('plugins_ds.yahooweather.cond_24'), // 24  windy
            $.i18n.t('plugins_ds.yahooweather.cond_25'), // 25  cold
            $.i18n.t('plugins_ds.yahooweather.cond_26'), // 26  cloudy
            $.i18n.t('plugins_ds.yahooweather.cond_27'), // 27  mostly cloudy (night)
            $.i18n.t('plugins_ds.yahooweather.cond_28'), // 28  mostly cloudy (day)
            $.i18n.t('plugins_ds.yahooweather.cond_29'), // 29  partly cloudy (night)
            $.i18n.t('plugins_ds.yahooweather.cond_30'), // 30  partly cloudy (day)
            $.i18n.t('plugins_ds.yahooweather.cond_31'), // 31  clear (night)
            $.i18n.t('plugins_ds.yahooweather.cond_32'), // 32  sunny
            $.i18n.t('plugins_ds.yahooweather.cond_33'), // 33  fair (night)
            $.i18n.t('plugins_ds.yahooweather.cond_34'), // 34  fair (day)
            $.i18n.t('plugins_ds.yahooweather.cond_35'), // 35  mixed rain and hail
            $.i18n.t('plugins_ds.yahooweather.cond_36'), // 36  hot
            $.i18n.t('plugins_ds.yahooweather.cond_37'), // 37  isolated thunderstorms
            $.i18n.t('plugins_ds.yahooweather.cond_38'), // 38  scattered thunderstorms
            $.i18n.t('plugins_ds.yahooweather.cond_39'), // 39  scattered thunderstorms
            $.i18n.t('plugins_ds.yahooweather.cond_40'), // 40  scattered showers
            $.i18n.t('plugins_ds.yahooweather.cond_41'), // 41  heavy snow
            $.i18n.t('plugins_ds.yahooweather.cond_42'), // 42  scattered snow showers
            $.i18n.t('plugins_ds.yahooweather.cond_43'), // 43  heavy snow
            $.i18n.t('plugins_ds.yahooweather.cond_44'), // 44  partly cloudy
            $.i18n.t('plugins_ds.yahooweather.cond_45'), // 45  thundershowers
            $.i18n.t('plugins_ds.yahooweather.cond_46'), // 46  snow showers
            $.i18n.t('plugins_ds.yahooweather.cond_47')     // 47  isolated thundershowers
        ];

        function updateRefresh(refreshTime) {
            if (updateTimer) {
                clearInterval(updateTimer);
            }

            updateTimer = setInterval(function () {
                self.updateNow();
            }, refreshTime);
        }

        this.updateNow = function () {
            var units = (currentSettings.units === 'metric') ? 'c' : 'f';
            var query = 'select * from weather.forecast where woeid in (select woeid from geo.places(1) where text="' + currentSettings.location + '") and u="' + units + '"';
            var uri = 'https://query.yahooapis.com/v1/public/yql?format=json&q=' +
                    encodeURIComponent(query);
//                    +
//                    '&env=' +
//                    encodeURIComponent('store://datatables.org/alltableswithkeys');

            $.ajax({
                url: uri,
                dataType: 'JSONP'
            })
                    .done(function (data) {
                        if (!_.isObject(data))
                            return;
                        if (_.has(data, 'error')) {
                            console.error('Yahoo Weather API error: ' + data.error.description);
                            return;
                        }
                        if (!_.has(data, 'query') && _.has(data, 'query.results'))
                            return;
                        data = data.query.results.channel;
                        var easy = {
                            place_name: _.isUndefined(data.location.city) ? '' : data.location.city,
                            latitude: Number(data.item.lat),
                            longitude: Number(data.item.long),
                            sunrise: data.astronomy.sunrise,
                            sunset: data.astronomy.sunset,
                            conditions: conditionMap[data.item.condition.code],
                            current_temp: Number(data.item.condition.temp),
                            high_temp: Number(data.item.forecast[0].high),
                            low_temp: Number(data.item.forecast[0].low),
                            pressure: Number(data.atmosphere.pressure),
                            humidity: Number(data.atmosphere.humidity),
                            wind_speed: Number(data.wind.speed),
                            wind_direction: Number(data.wind.direction)
                        };
                        updateCallback(_.merge(data, easy));
                    })
                    .fail(function (xhr, status) {
                        console.error('Yahoo Weather API error: ' + status);
                    });
        };

        this.onDispose = function () {
            clearInterval(updateTimer);
            updateTimer = null;
        };

        this.onSettingsChanged = function (newSettings) {
            currentSettings = newSettings;
            self.updateNow();
            updateRefresh(currentSettings.refresh * 1000);
        };

        updateRefresh(currentSettings.refresh * 1000);
    };
    freeboard.loadDatasourcePlugin({
        type_name: 'yahooweather',
        display_name: $.i18n.t('plugins_ds.yahooweather.display_name'),
        description: $.i18n.t('plugins_ds.yahooweather.description'),
        settings: [
            {
                name: 'location',
                display_name: $.i18n.t('plugins_ds.yahooweather.location'),
                validate: 'required,maxSize[100]',
                type: 'text',
                description: $.i18n.t('plugins_ds.yahooweather.location_desc')
            },
            {
                name: 'units',
                display_name: $.i18n.t('plugins_ds.yahooweather.units'),
                style: 'width:200px',
                type: 'option',
                default_value: 'metric',
                options: [
                    {
                        name: $.i18n.t('plugins_ds.yahooweather.units_metric'),
                        value: 'metric'
                    },
                    {
                        name: $.i18n.t('plugins_ds.yahooweather.units_imperial'),
                        value: 'imperial'
                    }
                ]
            },
            {
                name: 'refresh',
                display_name: $.i18n.t('plugins_ds.yahooweather.refresh'),
                validate: 'required,custom[integer],min[1],max[3600]',
                style: 'width:100px',
                type: 'number',
                suffix: $.i18n.t('plugins_ds.yahooweather.refresh_suffix'),
                default_value: 1
            }
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new yahooWeatherDatasource(settings, updateCallback));
        }
    });

    //Type NRWebSocket
    var NRWebSocket = function (settings, updateCallback) {
        var self = this;
        var updateTimer = null;

        function updateRefresh(refreshTime) {
            if (updateTimer) {
                clearInterval(updateTimer);
            }

            updateTimer = setInterval(function () {
                self.updateNow();
            }, refreshTime);
        }
        ;

        this.updateNow = function () {
            var strHost = settings.wsUrl;
            var lastWord = strHost.substr(strHost.length - 1, strHost.length);
            if (lastWord != '/') {

                var URL = strHost + '/';

            } else {

                var URL = strHost;

            }

            //var strHost = 'ws://172.22.12.51:9876/';

            try {
                var m_WebSocket = new WebSocket(URL);

                m_WebSocket.onmessage = function (msg) {
                    //console.log('get from NodeRed below : ');
                    //console.log(msg);
                    updateCallback(JSON.parse(msg.data));
                };

                m_WebSocket.onclose = function (evt) {
                    //console.log('WebSocket close');
                    //console.log(evt);
                };

                m_WebSocket.onopen = function (evt) {
                    //console.log('WebSocket opened');
                    //console.log(evt);
                };

                m_WebSocket.onerror = function (evt) {
                    //console.log('WebSocket onerror');
                    //console.log(evt);
                    updateRefresh(5000);
                };
            }
            catch (e) {
                //console.log(e);
            }
        };
        this.onDispose = function () {
            clearInterval(updateTimer);
            updateTimer = null;
        }
    };
    freeboard.loadDatasourcePlugin({
        type_name: "NRwebsocket",
        display_name: $.i18n.t('plugins_ds.NRwebsocket.display_name'),
        description: $.i18n.t('plugins_ds.NRwebsocket.description'),
        settings: [
            {
                name: "wsUrl",
                display_name: $.i18n.t('plugins_ds.NRwebsocket.wsUrl'),
                type: "text",
                required: true,
                validate: 'required',
                default_value: "ws://127.0.0.1:9876/",
                description: $.i18n.t('plugins_ds.NRwebsocket.wsUrl_desc')
            }
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new NRWebSocket(settings, updateCallback));
        }
    });



    //Type GetOntimeData
    var RealTimeData = function (accept, settings, updateCallback) {
        var requestURL = 'webresources/DeviceCtl/startRegularReport';
        var handler = settings.handler;
        var agentId;
        var intervalTime = 10;
        var timeOut = 600;
        var self = this;
        var updateTimer = null;
        var currentSettings = settings;
        var errorStage = 0; // 0 = try standard request
        // 1 = try JSONP
        // 2 = try thingproxy.freeboard.io
        var lockErrorStage = false;

        self.name = '';
        currentSettings.requestFlag = false;

        function updateRefresh(refreshTime) {
            if (updateTimer) {
                clearInterval(updateTimer);
            }

            updateTimer = setInterval(function () {
                self.updateNow();
            }, refreshTime);
        }

        updateRefresh(currentSettings.refresh * 1000);

        this.onDispose = function () {
            clearInterval(updateTimer);
            updateTimer = null;
        };

        this.onSettingsChanged = function (newSettings) {
            lockErrorStage = false;
            errorStage = 0;
            currentSettings = newSettings;
            updateRefresh(currentSettings.refresh * 1000);
            self.updateNow();
        };

        this.updateNow = function (datasourceName) {
            if (typeof datasourceName !== 'undefined') {
                self.name = datasourceName;
            }

            if (currentSettings.requestFlag === true) {
                console.log("Datasource isn't sent. Name: " + self.name);
                return;
            }
            var strURL = currentSettings.serverUrl + "common/v1/data/" + currentSettings.did + "/latestdata?agentId=" + currentSettings.agentId + "&plugin=" + currentSettings.plugin + "&sensorId=" + currentSettings.source;
            var ajaxOpts = {
                cache: false,
                url: strURL,
                type: "get",
                contentType: 'application/json',
                dataType: 'json',
                beforeSend: function (xhr) {
                },
                error: function (xhr, exception) {
                },
                success: function (xhr) {
                    updateCallback(xhr);
                }
            };
            ConnectionPool.add(currentSettings.aid, ajaxOpts);
        };
    };
    freeboard.loadDatasourcePlugin({
        type_name: "realtimedata",
        display_name: $.i18n.t('plugins_ds.realtimedata.display_name'),
        description: $.i18n.t('plugins_ds.realtimedata.description'),
        settings: [
            {
                name: "refresh",
                display_name: $.i18n.t('plugins_ds.realtimedata.refresh'),
                validate: 'required,custom[integer],min[1],max[3600]',
                type: "number",
                suffix: $.i18n.t('plugins_ds.realtimedata.refresh_suffix'),
                default_value: 5
            },
            {
                name: "serverUrl",
                display_name: "Server URL",
                type: "text",
                required: true,
                validate: 'required',
                default_value: "http://zwebapp-zsafe-attemperator.advantech.pcf-on-azure.net/",
                //default_value: "http://localhost:8081/",
                description: ""
            },
            {
                name: "device",
                display_name: $.i18n.t('plugins_ds.realtimedata.device'),
                type: "option",
                initial: false,
                dynamiclist: true,
                getlistfn: SUSI_DS_CONFIG.FuzzySearch,
                accept: "application/json",
                options: [
                ]
            },
            {
                name: "plugin",
                display_name: "plugin",
                type: "option",
                initial: false,
                dynamiclist: true,
                getlistfn: SUSI_DS_CONFIG.Plugins,
                accept: "application/json",
                options: [
                ]
            },
            {
                name: "source",
                display_name: $.i18n.t('plugins_ds.realtimedata.source'),
                type: "option",
                required: true,
                initial: false,
                dynamiclist: true,
                getlistfn: SUSI_DS_CONFIG.Sensors,
                accept: "application/json",
                options: [
                ]
            }
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new RealTimeData("application/json", settings, updateCallback));
        }
    });

    //Type getHistData
    var getHistData = function (accept, settings, updateCallback) {
        var requestURL = 'webresources/DeviceCtl/getHistData';
        var self = this;
        var updateTimer = null;
        var currentSettings = settings;
        var errorStage = 0; // 0 = try standard request
        // 1 = try JSONP
        // 2 = try thingproxy.freeboard.io
        var lockErrorStage = false;

        var agentId;

        self.name = '';
        currentSettings.requestFlag = false;

        function updateRefresh(refreshTime) {
            if (currentSettings.senhub != 'NULL') {
                agentId = currentSettings.senhub;
            } else {
                agentId = currentSettings.device;
            }
            if (updateTimer) {
                clearInterval(updateTimer);
            }
            updateTimer = setInterval(function () {
                var currentdate = new Date();
                var datetime = currentdate.getUTCFullYear() + "-"
                        + (currentdate.getUTCMonth() + 1) + "-"
                        + currentdate.getUTCDate() + " "
                        + currentdate.getUTCHours() + ":"
                        + currentdate.getUTCMinutes() + ":"
                        + currentdate.getUTCSeconds() + ":000";
//                var body = '{"request": {"endTs": "' + datetime + '","amount": "' + currentSettings.amount + '","item": {"agentId": "' + agentId + '","handler": "' + currentSettings.handler + '","sensorId": ["' + currentSettings.source + '"]}}}';
                self.updateNow();
            }, refreshTime);
        }

        updateRefresh(currentSettings.refresh * 1000);
        this.updateNow = function (datasourceName) {
            if (typeof datasourceName !== 'undefined') {
                self.name = datasourceName;
            }

            if (currentSettings.requestFlag === true) {
                console.log("Datasource isn't sent. Name: " + self.name);
                return;
            }
            var dNow = new Date();
            var strendTs = dNow.getUTCFullYear() + "-" + (dNow.getUTCMonth() + 1) + "-" + dNow.getUTCDate() + " " + dNow.getUTCHours() + ":" + dNow.getUTCMinutes() + ":" + dNow.getUTCSeconds() + ":000";
            var dPre = new Date();
            dPre = new Date(dPre.setDate(dPre.getDate() - 1));
            var strbeginTs = dPre.getUTCFullYear() + "-" + (dPre.getUTCMonth() + 1) + "-" + dPre.getUTCDate() + " " + dPre.getUTCHours() + ":" + dPre.getUTCMinutes() + ":" + dPre.getUTCSeconds() + ":000";
            var strURL = currentSettings.serverUrl + "common/v1/data/" + currentSettings.did + "/histdata?agentId=" + currentSettings.agentId + "&plugin=" + currentSettings.plugin + "&sensorId=" + currentSettings.source  + "&beginTs=" + strbeginTs + "&endTs=" + strendTs + "&amount=60&order=desc";
            var ajaxOpts = {
                cache: false,
                url: strURL,
                type: "get",
                contentType: 'application/json',
                dataType: 'json',
                beforeSend: function (xhr) {
                },
                error: function (xhr, exception) {
                },
                success: function (xhr) {
                    updateCallback(xhr);
                }
            };
            ConnectionPool.add(currentSettings.aid, ajaxOpts);
        };

        this.onDispose = function () {
            clearInterval(updateTimer);
            updateTimer = null;
        };

        this.onSettingsChanged = function (newSettings) {
            lockErrorStage = false;
            errorStage = 0;
            currentSettings = newSettings;
            updateRefresh(currentSettings.refresh * 1000);
            self.updateNow();
        };
    };
    freeboard.loadDatasourcePlugin({
        type_name: "getHistData",
        display_name: $.i18n.t('plugins_ds.getHistData.display_name'),
        description: $.i18n.t('plugins_ds.getHistData.description'),
        settings: [
            {
                name: "refresh",
                display_name: $.i18n.t('plugins_ds.realtimedata.refresh'),
                validate: 'required,custom[integer],min[1],max[3600]',
                type: "number",
                suffix: $.i18n.t('plugins_ds.realtimedata.refresh_suffix'),
                default_value: 5
            },
            {
                name: "serverUrl",
                display_name: "Server URL",
                type: "text",
                required: true,
                validate: 'required',
                default_value: "http://zwebapp-zsafe-attemperator.advantech.pcf-on-azure.net/",
                //default_value: "http://localhost:8081/",
                description: ""
            },
            {
                name: "device",
                display_name: $.i18n.t('plugins_ds.realtimedata.device'),
                type: "option",
                initial: false,
                dynamiclist: true,
                getlistfn: SUSI_DS_CONFIG.FuzzySearch,
                accept: "application/json",
                options: [
                ]
            },
            {
                name: "plugin",
                display_name: "plugin",
                type: "option",
                initial: false,
                dynamiclist: true,
                getlistfn: SUSI_DS_CONFIG.Plugins,
                accept: "application/json",
                options: [
                ]
            },
            {
                name: "source",
                display_name: $.i18n.t('plugins_ds.realtimedata.source'),
                type: "option",
                required: true,
                initial: false,
                dynamiclist: true,
                getlistfn: SUSI_DS_CONFIG.Sensors,
                accept: "application/json",
                options: [
                ]
            }
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new getHistData("application/json", settings, updateCallback));
        }
    });

    //Type getEcrAmount
    var getEcrAmount = function (accept, settings, updateCallback) {
        var self = this;
        var updateTimer = null;
        var currentSettings = settings;
        var errorStage = 0; // 0 = try standard request
        // 1 = try JSONP
        // 2 = try thingproxy.freeboard.io
        var lockErrorStage = false;

        self.name = '';
        currentSettings.requestFlag = false;

        function updateRefresh(refreshTime) {
            if (updateTimer) {
                clearInterval(updateTimer);
            }
            updateTimer = setInterval(function () {
                var currentdate = new Date();
                var datetime = currentdate.getUTCFullYear() + "-"
                    + (currentdate.getUTCMonth() + 1) + "-"
                    + currentdate.getUTCDate() + " "
                    + currentdate.getUTCHours() + ":"
                    + currentdate.getUTCMinutes() + ":"
                    + currentdate.getUTCSeconds() + ":000";
//                var body = '{"request": {"endTs": "' + datetime + '","amount": "' + currentSettings.amount + '","item": {"agentId": "' + agentId + '","handler": "' + currentSettings.handler + '","sensorId": ["' + currentSettings.source + '"]}}}';
                self.updateNow();
            }, refreshTime);
        }

        updateRefresh(currentSettings.refresh * 1000);
        this.updateNow = function (datasourceName) {
            var strURL = currentSettings.serverUrl + "webresources/SQLMgmt/qryData";
            var ajaxOpts = {
                cache: false,
                url: strURL,
                type: "post",
                data: JSON.stringify(
                    {
                        "request": {
                            "conditions": {
                                "item": {
                                    "@operator": ">",
                                    "@tableField": "foodcourt_master.txn_time",
                                    "@value": "2017-05-15 0:0:0"
                                }
                            },
                            "conditions_op": {
                                "@value": "AND"
                            },
                            "limit": {
                                "@value": "10000"
                            },
                            "offset": {
                                "@value": "0"
                            },
                            "orderBy": {
                                "item": {
                                    "@tableField": "foodcourt_master.txn_time",
                                    "@value": "DESC"
                                }
                            },
                            "selectFields": {
                                "item": [
                                    {
                                        "@tableField": "foodcourt_master.ecr_no"
                                    },
                                    {
                                        "@tableField": "foodcourt_master.txn_no"
                                    },
                                    {
                                        "@tableField": "foodcourt_master.TXN_TotSaleAmt"
                                    },
                                    {
                                        "@tableField": "foodcourt_master.TXN_TotPayAmt"
                                    },
                                    {
                                        "@tableField": "foodcourt_master.txn_time"
                                    }
                                ]
                            }
                        }
                    }
                ),
                contentType: 'application/json',
                dataType: 'json',
                beforeSend: function (xhr) {
                },
                error: function (xhr, exception) {
                },
                success: function (xhr) {
                    //Modify Format

                    var oData = {};
                    oData.itemList = [];
                    for (var i=0; i<xhr.result.item.length; i++)
                    {
                        if ((currentSettings.ecr_no == "") || (currentSettings.ecr_no == xhr.result.item[i].ecr_no)) {
                            var oItem = {};
                            oItem.sensorId = xhr.result.item[i].ecr_no;
                            oItem.v = xhr.result.item[i].txn_totpayamt;
                            oItem.ts = xhr.result.item[i].txn_time;
                            oData.itemList.push(oItem);
                        }
                    }
                    updateCallback(oData);
                }
            };
            ConnectionPool.add(currentSettings.aid, ajaxOpts);
        };

        this.onDispose = function () {
            clearInterval(updateTimer);
            updateTimer = null;
        };

        this.onSettingsChanged = function (newSettings) {
            lockErrorStage = false;
            errorStage = 0;
            currentSettings = newSettings;
            updateRefresh(currentSettings.refresh * 1000);
            self.updateNow();
        };
    };
    freeboard.loadDatasourcePlugin({
        type_name: "getEcrAmount",
        display_name: "WISE-PAAS : Get ECR Amount",
        description: "Get Amount of Ecr",
        settings: [
            {
                name: "refresh",
                display_name: $.i18n.t('plugins_ds.realtimedata.refresh'),
                validate: 'required,custom[integer],min[1],max[3600]',
                type: "number",
                suffix: $.i18n.t('plugins_ds.realtimedata.refresh_suffix'),
                default_value: 5
            },
            {
                name: "serverUrl",
                display_name: "Server URL",
                type: "text",
                required: true,
                validate: 'required',
                default_value: "http://foodcourt.advantech.pcf-on-azure.net/",
                //default_value: "http://localhost:8081/",
                description: ""
            },
            {
                name: "ecr_no",
                display_name: "ecr_no",
                type: "text",
                required: false,
                validate: 'required',
                default_value: "",
                //default_value: "http://localhost:8081/",
                description: ""
            }
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new getEcrAmount("application/json", settings, updateCallback));
        }
    });

    //Type getEcrTotal
    var getEcrTotal = function (accept, settings, updateCallback) {
        var self = this;
        var updateTimer = null;
        var currentSettings = settings;
        var errorStage = 0; // 0 = try standard request
        // 1 = try JSONP
        // 2 = try thingproxy.freeboard.io
        var lockErrorStage = false;

        self.name = '';
        currentSettings.requestFlag = false;

        function updateRefresh(refreshTime) {
            if (updateTimer) {
                clearInterval(updateTimer);
            }
            updateTimer = setInterval(function () {
                var currentdate = new Date();
                var datetime = currentdate.getUTCFullYear() + "-"
                    + (currentdate.getUTCMonth() + 1) + "-"
                    + currentdate.getUTCDate() + " "
                    + currentdate.getUTCHours() + ":"
                    + currentdate.getUTCMinutes() + ":"
                    + currentdate.getUTCSeconds() + ":000";
//                var body = '{"request": {"endTs": "' + datetime + '","amount": "' + currentSettings.amount + '","item": {"agentId": "' + agentId + '","handler": "' + currentSettings.handler + '","sensorId": ["' + currentSettings.source + '"]}}}';
                self.updateNow();
            }, refreshTime);
        }

        updateRefresh(currentSettings.refresh * 1000);
        this.updateNow = function (datasourceName) {
            var oDate = new Date();
            var strDate = oDate.getUTCFullYear() + "-" + (oDate.getUTCMonth() + 1) + "-" + oDate.getUTCDate() + " 0:0:0";
            var strURL = currentSettings.serverUrl + "webresources/SQLMgmt/qryData";
            var ajaxOpts = {
                cache: false,
                url: strURL,
                type: "post",
                data: JSON.stringify(
                    {
                        "request": {
                            "conditions": {
                                "item": {
                                    "@operator": ">",
                                    "@tableField": "foodcourt_master.txn_time",
                                    "@value": strDate
                                }
                            },
                            "conditions_op": {
                                "@value": "AND"
                            },
                            "limit": {
                                "@value": "10000"
                            },
                            "offset": {
                                "@value": "0"
                            },
                            "orderBy": {
                                "item": {
                                    "@tableField": "foodcourt_master.ecr_no",
                                    "@value": "ASC"
                                }
                            },
                            "selectFields": {
                                "item": [
                                    {
                                        "@tableField": "foodcourt_master.ecr_no"
                                    },
                                    {
                                        "@tableField": "foodcourt_master.txn_no"
                                    },
                                    {
                                        "@tableField": "foodcourt_master.TXN_TotSaleAmt"
                                    },
                                    {
                                        "@tableField": "foodcourt_master.TXN_TotPayAmt"
                                    },
                                    {
                                        "@tableField": "foodcourt_master.txn_time"
                                    }
                                ]
                            }
                        }
                    }
                ),
                contentType: 'application/json',
                dataType: 'json',
                beforeSend: function (xhr) {
                },
                error: function (xhr, exception) {
                },
                success: function (xhr) {
                    //Modify Format

                    var oData = {};
                    oData.itemList = [];
                    for (var i=0; i<xhr.result.item.length; i++)
                    {
                        var bFound = false;
                        for (var j=0 ; j<oData.itemList.length; j++) {
                            if (xhr.result.item[i].ecr_no == oData.itemList[j].sensorId)
                            {
                                bFound = true;
                                oData.itemList[j].v = oData.itemList[j].v + xhr.result.item[i].txn_totpayamt;
                                break;
                            }
                        }
                        if (!bFound)
                        {
                            var oItem = {};
                            oItem.sensorId = xhr.result.item[i].ecr_no;
                            oItem.v = xhr.result.item[i].txn_totpayamt;
                            oItem.ts = "ECR " + xhr.result.item[i].ecr_no;
                            oData.itemList.push(oItem);
                            i = i + 1;
                        }
                    }
                    updateCallback(oData);
                }
            };
            ConnectionPool.add(currentSettings.aid, ajaxOpts);
        };

        this.onDispose = function () {
            clearInterval(updateTimer);
            updateTimer = null;
        };

        this.onSettingsChanged = function (newSettings) {
            lockErrorStage = false;
            errorStage = 0;
            currentSettings = newSettings;
            updateRefresh(currentSettings.refresh * 1000);
            self.updateNow();
        };
    };
    freeboard.loadDatasourcePlugin({
        type_name: "getEcrTotal",
        display_name: "WISE-PAAS : Get ECR Total",
        description: "Get Amount of Total",
        settings: [
            {
                name: "refresh",
                display_name: $.i18n.t('plugins_ds.realtimedata.refresh'),
                validate: 'required,custom[integer],min[1],max[3600]',
                type: "number",
                suffix: $.i18n.t('plugins_ds.realtimedata.refresh_suffix'),
                default_value: 5
            },
            {
                name: "serverUrl",
                display_name: "Server URL",
                type: "text",
                required: true,
                validate: 'required',
                default_value: "http://foodcourt.advantech.pcf-on-azure.net/",
                //default_value: "http://localhost:8081/",
                description: ""
            }
        ],
        newInstance: function (settings, newInstanceCallback, updateCallback) {
            newInstanceCallback(new getEcrTotal("application/json", settings, updateCallback));
        }
    });
}());
