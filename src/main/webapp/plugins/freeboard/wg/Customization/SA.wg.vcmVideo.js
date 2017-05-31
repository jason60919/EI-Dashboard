(function () {
    /*i18n*/
    if (typeof (i18n) != 'undefined') {
        i18n.addResource('en', 'translation', '<i18n_KEY>', '<i18n_VALUE>');
    }

    freeboard.loadWidgetPlugin({
        type_name: 'vcmVideoWidget',
        display_name: 'VCM Video Widget',
        fill_size: true,
        external_scripts: [
            'plugins/thirdparty/gauged3.min.js'
        ],
        settings: [
            {
                name: 'serverUrl',
                display_name: "Server URL",
                type: 'text',
                default_value: "http://vcm.advantech.pcf-on-azure.net"
            },
            {
                name: 'enterpriseID',
                display_name: "Enterprise ID",
                type: 'option',
                options: [
                    {
                        name: "1",
                        value: 1
                    },
                    {
                        name: "2",
                        value: 2
                    },
                    {
                        name: "3",
                        value: 3
                    },
                    {
                        name: "4",
                        value: 4
                    },
                    {
                        name: "5",
                        value: 5
                    }
                ],
                default_value: 3
            },
            {
                name: 'channel',
                display_name: "Channel",
                type: 'option',
                options: [
                    {
                        name: "1",
                        value: 1
                    },
                    {
                        name: "2",
                        value: 2
                    },
                    {
                        name: "3",
                        value: 3
                    },
                    {
                        name: "4",
                        value: 4
                    },
                    {
                        name: "5",
                        value: 5
                    },
                    {
                        name: "6",
                        value: 6
                    },
                    {
                        name: "7",
                        value: 7
                    },
                    {
                        name: "8",
                        value: 8
                    },
                    {
                        name: "9",
                        value: 9
                    },
                    {
                        name: "10",
                        value: 10
                    },
                    {
                        name: "11",
                        value: 11
                    },
                    {
                        name: "12",
                        value: 12
                    },
                    {
                        name: "13",
                        value: 13
                    },
                    {
                        name: "14",
                        value: 14
                    },
                    {
                        name: "15",
                        value: 15
                    },
                    {
                        name: "16",
                        value: 16
                    }
                ],
                default_value: 1
            },
            {
                name: "height",
                display_name: "height",
                validate: "required,custom[integer],min[1],max[20]",
                type: "number",
                default_value: 4,
                description: ""
            }
        ],
        newInstance: function (settings, newInstanceCallback)
        {
            newInstanceCallback(new vcmVideoWidget(settings));
        }
    });

    var vcmVideoWidget = function (settings)
    {
        var self = this;
        var currentSettings = settings;
        var titleElement = $('<h2 class="section-title"></h2>');
        var currentID = _.uniqueId('wgd_');
        var widgetElement = $('<div id="' + currentID + '" style="text-align: center;"></div>');

        var strServer = "http://vcm.advantech.pcf-on-azure.net";
        var strEnterpriseID = "3";
        var strUserName = "";
        var strPassword = "";
        var strIP = "";
        var strVid = "";
        var strIVSID = "";
        var strAPIPort = "";
        var strDataPort = "";

        var nChannel = 1;
        var strSessionId = "";
        var nType = 0;

        self.getHeight = function ()
        {
            return currentSettings.height;
        };

        self.render = function (containerElement)
        {
            $(containerElement).append(titleElement).append(widgetElement);
            var oDiv = $('<div style="width: 100%; height: 100%;"></div>')
                    .appendTo(containerElement);
            var oVideo = $('<video id="' + currentID + '_videoPlayer" style="width: 100%; height: 100%; background: #000000;margin: 20px auto;display: block" autoplay="autoplay">Your browser does not support the video tag.</video>')
                    .appendTo(oDiv);
            strServer = currentSettings.serverUrl;
            strEnterpriseID = currentSettings.enterpriseID;
            nChannel = currentSettings.channel;
            self.vcmInfo();
        };

        self.getHeight = function ()
        {
            return currentSettings.height;
        };

        self.onSettingsChanged = function (newSettings)
        {
            currentSettings = newSettings;
            titleElement.html((_.isUndefined(currentSettings.title) ? '' : currentSettings.title));
            strServer = currentSettings.serverUrl;
            strEnterpriseID = currentSettings.enterpriseID;
            nChannel = currentSettings.channel;
            self.realTime();
        };

        self.onCalculatedValueChanged = function (settingName, newValue)
        {
        };

        self.onDispose = function ()
        {
        };

        self.vcmInfo = function ()
        {
            $.ajax({
                cache: false,
                url: strServer + "/enumeration?enterpriseid=" + strEnterpriseID,
                type: "get",
                beforeSend: function (xhr) {
                },
                error: function (xhr, exception) {
                },
                success: function (xhr) {
                    var oData = $.parseJSON(xhr)
                    strUserName = oData.vcminfo[0].username;
                    strPassword = oData.vcminfo[0].password;
                    strVid = oData.vcminfo[0].vid;
                    strIP = oData.vcminfo[0].domain;
                    strIVSID = oData.vcminfo[0].ivsid;
                    strAPIPort = oData.vcminfo[0].apiport;
                    strDataPort = oData.vcminfo[0].dataport;
                    self.channelInfo();
                }
            });
        }
        self.channelInfo = function ()
        {
            $.ajax({
                cache: false,
                url: strServer + "/chanenumeration?vid=" + strVid,
                type: "get",
                beforeSend: function (xhr) {
                },
                error: function (xhr, exception) {
                },
                success: function (xhr) {
                    var oData = $.parseJSON(xhr);
                    if (oData.chaninfo.length > (nChannel-1))
                        titleElement.html(oData.chaninfo[(nChannel-1)].channame);
                    else    
                        titleElement.html("");
                    self.onLine();
                }
            });
        }
        self.onLine = function ()
        {
            var data = "<request>\n\t \
                                <username>" + strUserName + "</username>\n\t \
                                <password>" + strPassword + "</password>\n\t \
                            </request>\n";
            $.ajax({
                cache: false,
                url: "https://" + strIP + ":" + strAPIPort + "/AdvStreamingService/Authority/Online",
                type: "put",
                contentType: 'application/xml',
                data: data,
                dataType: 'text',
                beforeSend: function (xhr) {
                },
                error: function (xhr, exception) {
                },
                success: function (xhr) {
                    var data = $.parseXML(xhr);
                    strSessionId = $(data).find('SessionID').text();
                    self.realTime();
                }
            });
        }
        self.realTime = function ()
        {
            var data = "<request>\n\t \
                                    <method>connection</method>\n\t \
                                    <sessionID>" + strSessionId + "</sessionID>\n\t \
                                    <IVSID>" + strIVSID + "</IVSID>\n\t \
                                    <channel>" + nChannel + "</channel>\n\t \
                                </request>\n";
            $.ajax({
                cache: false,
                url: "https://" + strIP + ":" + strAPIPort + "/AdvStreamingService/LiveStream",
                type: "put",
                contentType: 'application/xml',
                data: data,
                dataType: 'text',
                beforeSend: function (xhr) {
                },
                error: function (xhr, exception) {
                },
                success: function (xhr) {
                    var data = $.parseXML(xhr);
                    var url = $(data).find('mpd').text();
                    if (url) {
                        nType = 1;
                        self.playVideo(url);
                    }
                }
            });
        }
        self.playVideo = function (url)
        {
            shaka.polyfill.installAll();
            var video = document.getElementById(currentID + '_videoPlayer');
            player = new shaka.player.Player(video);
            var estimator1 = new shaka.util.EWMABandwidthEstimator();
            var source1 = new shaka.player.DashVideoSource(url, null, estimator1);
            player.load(source1);
        }
    };
}());