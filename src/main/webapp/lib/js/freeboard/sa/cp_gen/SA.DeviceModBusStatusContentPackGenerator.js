/*
 *  content pack generator template
 *  @ken.tsai@advantech.com.tw
 *  @date 2015/11/04
 */
if (typeof (ContentPackGenerator) !== 'undefined') {
    ContentPackGenerator.register('deviceModbusStatus', 'DeviceModbusStatusContentPackGenerator');
}

var DeviceModbusStatusContentPackGenerator = (function (log4jq) {

    var self = {};
    self.name = 'SA.DeviceModbusStatusContentPackGenerator.js';

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
          
        Device2ContentPackGenerator.create(
                data,
                'Modbus_Handler',
                ['Hardware Monitor', 'WISE Cloud ADF DEMO', 'SenData', 'GPIO', 'Input Registers' , 'Coils'],
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