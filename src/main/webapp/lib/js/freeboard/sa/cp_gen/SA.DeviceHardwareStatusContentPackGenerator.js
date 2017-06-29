/*
 *  content pack generator template
 *  @date 2015/11/04
 */
if (typeof (ContentPackGenerator) !== 'undefined') {
    ContentPackGenerator.register('deviceHardwareStatus', 'DeviceHardwareStatusContentPackGenerator');
}

var DeviceHardwareStatusContentPackGenerator = (function (log4jq) {

    var self = {};
    self.name = 'SA.DeviceHardwareStatusContentPackGenerator.js';

    var logger = log4jq.getLogger({
        loggerName: self.name
    });

    /*
     * Sample create function
     * dsGenerator.create = function (pack_type,data) {};
    */
    self.create = function (data,callback) {
        logger.info('create');
     
        logger.debug(data);
          
        //SUSIControl
        Device2ContentPackGenerator.create(
                data,
                'SUSIControl',
                ['Hardware Monitor', 'WISE Cloud ADF DEMO', 'SenData', 'GPIO', 'Input Registers'],
                function (config) {
                    if (typeof (callback === 'function')) {
                        callback(config);
                    }
                });
    };
    
    window[self.name] = self;

    return self;
})(log4jq);

function testDeviceHardwareStatusContentPackGenerator(device) {
   
    var config = Device2ContentPackGenerator.create(device,   
                    'SUSIControl',
//                ['Hardware Monitor','GPIO'],
                 ['Hardware Monitor']);
}