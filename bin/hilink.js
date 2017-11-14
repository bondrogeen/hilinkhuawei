var http = require('http');
var builder = require('xmlbuilder');
var dateFormat = require('dateformat');
var parseString = require('xml2js').parseString;

var hilink = function(){
    var self = this;

// port
    self.port = 80;

//ip def.
    self.ip = '192.168.8.1';

//ip def.
    self.trafficInfo = 'auto';

    self.token = '0000';

    self.model = "3372s"

    self.setModel = function( model ){
        self.model = model;
    };

    self.setTrafficInfo = function( TrafficInfo ){
        self.trafficInfo = TrafficInfo;
    };

//изменения ip
    self.setIp = function( ip ){
        self.ip = ip;
    }

    function getToken( callback) {

        var options = {
            hostname: self.ip,
            port: self.port,
            path: '/api/webserver/token',
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength("")
            }
        };
        var req = http.request(options, (res) => {
            console.log(`STATUS: ${res.statusCode}`);
            console.log(`HEADERS: ${res.headers["set-cookie"]}`);
            res.setEncoding('utf8');
            var buffer = "";
            res.on('data', (chunk) => {
                buffer = buffer + chunk;
            });
            res.on('end', () => {
                parseString(buffer, function (err, result) {
                    var token = result.response.token[0]
                    self.token = token;
                    callback (token);
                });
                console.log(buffer)
            })
        });
        req.on('error', (e) => {
            console.log("error")
            console.log('problem with request: ' + e.message);
        });
        req.write("");
        req.end();
    }

    function cookie(callback) {
        var val = {};
        var options = {
            hostname: self.ip,
            port: self.port,
            path: '/html/index.html',
            method: 'GET',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength("")
            }
        };
        var req = http.request(options, (res) => {
            if(res.statusCode ===200 && res.headers["set-cookie"][0]){
                var coo = res.headers["set-cookie"][0].split(';')[0];
                //console.log(res.headers);
                val.cookie=coo;
                //callback (coo)
                //console.log(coo);
            }
            res.setEncoding('utf8');
            var buffer = "";
            res.on('data', (chunk) => {
                buffer = buffer + chunk;
            });
            res.on('end', () => {

                rr = buffer.split("<meta name=\"csrf_token\" content=\"");
                val.one = rr[1].substring(0,32)
                val.two = rr[2].substring(0,32)
                callback(val)
                //console.log(buffer)
            })

        });
        req.on('error', (e) => {
            callback ("error")
            console.log(`problem with request: ${e.message}`);
        });
        req.write("");
        req.end();
    }


// Получаем token

    self.request = function( path, xml, callback ){      // post запросы модему

        if(self.model === "3372h"){

            cookie(function( date ){
                self.token = "11111";
                //console.log(date);
                var postRequest = {
                    host: self.ip,
                    path: path,
                    port: self.port,
                    method: "POST",
                    headers: {
                        'Content-Type' : 'application/x-www-form-urlencoded',
                        'Cookie': date.cookie,
                        'Content-Type': 'text/xml',
                        'Content-Length': Buffer.byteLength(xml),
                        '__RequestVerificationToken':date.one
                    }
                };

                var buffer = "";

                var req = http.request( postRequest, function( res )    {
                    var buffer = "";
                    res.on( "data", function( data ) {
                        buffer = buffer + data;
                    });
                    res.on( "end", function( data ) {
                        //console.log(buffer)
                        parseString( buffer, function (err, result) {
                            callback( result );
                        });
                    });
                });

                req.write( xml );
                req.end();
            });




        }else if(self.model === "3372s" ){

            getToken(function( token ){
                self.token = token;
                var postRequest = {
                    host: self.ip,
                    path: path,
                    port: self.port,
                    method: "POST",
                    headers: {
                        'Content-Type' : 'application/x-www-form-urlencoded',
                        'Cookie': "cookie",
                        'Content-Type': 'text/xml',
                        'Content-Length': Buffer.byteLength(xml),
                        '__RequestVerificationToken':self.token
                    }
                };

                var buffer = "";

                var req = http.request( postRequest, function( res )    {
                    var buffer = "";
                    res.on( "data", function( data ) {
                        buffer = buffer + data;
                    });
                    res.on( "end", function( data ) {
                        parseString( buffer, function (err, result) {
                            callback( result );
                        });
                    });
                });

                req.write( xml );
                req.end();
            } );

        }


    }

    self.send = function( number, text, callback ){
        var xml = builder.create({
            request: {

                Index: {
                    '#text': '1'
                },
                Phones: {
                    Phone: {
                        '#text': number
                    }
                },
                Sca: {
                    '#text': ''
                },
                Content: {
                    '#text': text
                },
                Length: {
                    '#text': text.length
                },
                Reserved: {
                    '#text': '1'
                },
                Date: {
                    '#text': dateFormat(new Date(), 'yyyy-MM-dd hh:mm:ss')
                }
            }
        }).end({ pretty: true});

        self.request( '/api/sms/send-sms', xml, function( response ){
            callback( response );
        });

    };

    self.setRead = function( index, callback ){
        var xml = builder.create({
            request: {
                Index: {
                    '#text': index
                }

            }
        }).end({ pretty: true});

        self.request( '/api/sms/set-read', xml, function( response ){
            callback( response );
        });
    };

    self.readAll = function(callback) {
        self.list( 1, function(results) {
            var response = {};
            var key = 0;
            var index=[];
            for (i = 0; i < results.response.Count[0]; i++) {
                if(results.response.Messages[0].Message[i].Smstat[0]==0){
                    self.setRead(results.response.Messages[0].Message[i].Index[0], function (res) {
                    });
                    index[key] = results.response.Messages[0].Message[i].Index[0];
                    response.response = index
                    key=key+1;
                    response.Count = key
                };
            }

            if (index.length == 0){
                response = {"response":"no_new_sms"};
            }
            callback(response);
        });
    };

    self.list = function(type, callback){
        var xml = builder.create({
            request: {

                PageIndex: {
                    '#text': '1'
                },
                ReadCount: {
                    '#text': '50'
                },
                BoxType: {
                    '#text': type
                },
                SortType: {
                    '#text': '2'
                },
                Ascending: {
                    '#text': '0'
                },
                UnreadPreferred: {
                    '#text': '0'
                }

            }
        }).end({ pretty: true});

        self.request( '/api/sms/sms-list', xml, function( response ){
            callback( response );
        });
    }


    self.page = function(page, callback){
        var xml = builder.create({
            request: {

                PageIndex: {
                    '#text': page
                },
                ReadCount: {
                    '#text': '50'
                },
                BoxType: {
                    '#text': '1'
                },
                SortType: {
                    '#text': '2'
                },
                Ascending: {
                    '#text': '0'
                },
                UnreadPreferred: {
                    '#text': '1'
                }

            }
        }).end({ pretty: true});

        self.request( '/api/sms/sms-list', xml, function( response ){
            callback( response );
        });
    }

    function listfilter(response){
        Count = response.response.Count[0];
        response.response = response.response.Messages[0].Message
        for (var i = 0; i < Count; i++) {
            for (var key in response.response[i]) {
                x = response.response[i][key][0];
                response.response[i][key] = x;
            }
        }
        response.Count = Count;
        //console.log(response);
        return response;
    };

    self.listNew = function(callback){
        self.page( 1, function(response) {
            console.log(response)
            response = listfilter(response);
            var k = 0;
            var Messages=[];
            for (var i = 0; i < response.Count; i++) {
                if(response.response[i].Smstat == 0){
                    Messages[k] = response.response[i];
                    k = k + 1;
                }
            }
            response.response = Messages
            response.Count = k
            if (Messages.length == 0){
                response = {"response":"no_new_sms"};
            }
            callback(response);
        });
    }

    self.listInbox = function(callback){
        self.list( 1,function( response ){
            callback(listfilter(response));
        });
    }

    self.listOutbox = function(callback){
        self.list( 2,function( response ){

            callback(listfilter(response));
        });
    }

    self.delete = function( index, callback ){
        var xml = builder.create({
            request: {
                Index: {
                    '#text': index
                }

            }
        }).end({ pretty: true});

        self.request( '/api/sms/delete-sms', xml, function( response ){
            callback( response );
        });
    }



    self.deleteAll = function(type){
        self.list( type, function(results){
            if( results["response"]["Count"][0] > 0 ){
                results["response"]["Messages"][0]["Message"].forEach(function(message){
                    self.delete( message.Index[0], function( response ){
                        console.log( response );
                    });
                });
            }
            else{
                console.log( results["response"]["Count"][0] );
            }
        });
    }

    self.clearInbox = function(){ // чистить входящих смс
        self.deleteAll( 1 );
    }

    self.clearOutbox = function(){   // чистить исходящих смс
        self.deleteAll( 2 );
    }

    self.sendAndDelete = function(number, text, callback){
        self.send(number, text, function(sendResponse){
            if( sendResponse.response === 'OK' ){
                self.listOutbox( function( listResponse ){
                    self.delete( listResponse["response"]["Messages"][0]["Message"][0].Index[0], function( deleteResponse ){
                        callback( sendResponse, deleteResponse );
                    });
                });
            }
            else{
                console.log(sendResponse);
            }
        });
    }

// get запросы модему
    self.info = function(val, callback) {

        if(self.model === "3372h"){

            cookie(function( data ){
                var options = {
                    hostname: self.ip,
                    port: 80,
                    path: val,
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Content-Length': Buffer.byteLength(""),
                        'Cookie': data.cookie
                    }
                };
                var req = http.request(options, (res) => {
                    console.log(`STATUS: ${res.statusCode}`);
                    res.setEncoding('utf8');
                    var buffer = "";
                    res.on('data', (chunk) => {
                        buffer = buffer + chunk;
                    });
                    res.on('end', () => {
                        parseString( buffer, function (err, result) {
                            callback( result );
                        });
                        //console.log(buffer)
                    })
                });
                req.on('error', (e) => {
                    console.log("error")
                    console.log(`problem with request: ${e.message}`);
                });

                req.write("");
                req.end();

            })



        }else if(self.model === "3372s" ){

            http.get('http://'+self.ip+val, (res) => {
                //console.log(`Got response: ${res.statusCode}`);
                var buffer = "";
                res.on('data', function (data) {
                    buffer = buffer + data;
                }).on('end', function(data) {
                    parseString( buffer, function (err, result) {
                        callback( result );
                    });
                });
                res.resume();
            }).on('error', (e) => {
                console.log(`Got error: ${e.message}`);
            });

        }

    }


    self.jsonNet = {
        "0":"NOSERVICE",
        "1":"GSM",
        "2":"GPRS",
        "3":"EDGE",
        "21":"IS95A",
        "22":"IS95B",
        "23":"CDMA1x",
        "24":"EVDO_REV_0",
        "25":"EVDO_REV_A",
        "26":"EVDO_REV_A",
        "27":"HYBRID_CDMA1x",
        "28":"HYBRID_EVDO_REV_0",
        "29":"HYBRID_EVDO_REV_A",
        "30":"HYBRID_EVDO_REV_A",
        "31":"EHRPD_Rel_0",
        "32":"EHRPD_Rel_A",
        "33":"EHRPD_Rel_B",
        "34":"HYBRID_EHRPD_Rel_0",
        "35":"HYBRID_EHRPD_Rel_A",
        "36":"HYBRID_EHRPD_Rel_B",
        "41":"WCDMA",
        "42":"HSDPA",
        "43":"HSUPA",
        "44":"HSPA",
        "45":"HSPA_PLUS",
        "46":"DC_HSPA_PLUS",
        "61":"TD_SCDMA",
        "62":"TD_HSDPA",
        "63":"TD_HSUPA",
        "64":"TD_HSPA",
        "65":"TD_HSPA_PLUS",
        "81":"802.16E",
        "101":"LTE"
    };
    self.jsonNetStatsu =   {
        "900":"CONNECTING",
        "901":"CONNECTED",
        "902":"DISCONNECTING",
        "904":"DISCONNECTED"
    };


// информация общая о модеме

    self.status = function(callback){
        self.info ('/api/monitoring/status',function( response ){
            self.jsonNet[response.response.CurrentNetworkType[0]] = self.jsonNet[response.response.CurrentNetworkType[0]] || response.response.CurrentNetworkType[0]
            response.response.CurrentNetworkType[0] = self.jsonNet[response.response.CurrentNetworkType[0]]
            self.jsonNetStatsu[response.response.ConnectionStatus[0]] = self.jsonNetStatsu[response.response.ConnectionStatus[0]] || response.response.ConnectionStatus[0]
            response.response.ConnectionStatus[0] = self.jsonNetStatsu[response.response.ConnectionStatus[0]]
            self.jsonNet[response.response.CurrentNetworkTypeEx[0]] = self.jsonNet[response.response.CurrentNetworkTypeEx[0]] || response.response.CurrentNetworkTypeEx[0]
            response.response.CurrentNetworkTypeEx[0] = self.jsonNet[response.response.CurrentNetworkTypeEx[0]]
            callback(filter (response));
        });

    }

// информация о уведомлениях  сети
    self.notifications = function(callback){
        self.info( '/api/monitoring/check-notifications',function( response ){
            callback(filter (response));
        });
    }

// информация о операторе сети
    self.statusNet = function(callback){
        self.info( '/api/net/current-plmn',function( response ){
            callback(filter (response));
        });
    }

// информация кол. сообщений
    self.smsCount = function(callback){
        self.info( '/api/sms/sms-count',function( response ){
            callback(filter (response));
        });
    }

// информация о сигнале сети
    self.signal = function(callback){
        self.info( '/api/device/signal',function( response ){
            callback(filter (response));
        });
    }

// информация о ip сети
    self.settingsNet = function(callback){
        self.info( '/api/dhcp/settings',function( response ){
            callback(filter (response));
        });
    }

// информация о модеме
    self.basicInfo = function(callback){
        self.info( '/api/device/basic_information',function( response ){
            callback(filter (response));
        });
    }


// статистика

    function formatFloat(src, pos) {
        return Math.round(src * Math.pow(10, pos)) / Math.pow(10, pos);
    };


    function filter(response){
        for (var key in response.response) {
            if (response.response[key][0]!=""){
                x = response.response[key][0];
                response.response[key] = x;
            }else{
                delete response.response[key];
            }
        }
        return response;
    };



    function getTrafficInfo(bit) {

        var g_monitoring_dumeter_kb = 1024;
        var g_monitoring_dumeter_mb = 1024 * 1024;
        var g_monitoring_dumeter_gb = 1024 * 1024 * 1024;
        var g_monitoring_dumeter_tb = 1024 * 1024 * 1024 * 1024;
        var final_number = 0;
        var final_str = '';
        if (g_monitoring_dumeter_kb > bit) {
            final_number = formatFloat(parseFloat(bit), 2);
            final_str = final_number + ' B';
        } else if (g_monitoring_dumeter_kb <= bit && g_monitoring_dumeter_mb > bit) {
            final_number = formatFloat(parseFloat(bit) / g_monitoring_dumeter_kb, 2);
            final_str = final_number + ' KB';
        } else if (g_monitoring_dumeter_mb <= bit && g_monitoring_dumeter_gb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_mb), 2);
            final_str = final_number + ' MB';
        } else if (g_monitoring_dumeter_gb <= bit && g_monitoring_dumeter_tb > bit) {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_gb), 2);
            final_str = final_number + ' GB';
        } else {
            final_number = formatFloat((parseFloat(bit) / g_monitoring_dumeter_tb), 2);
            final_str = final_number + ' TB';
        }
        return final_str;
    };


    function getCurrentTime(time) {
        var final_time = '';
        var times = parseInt(time, 10);
        var hours = parseInt((times / 3600), 10);
        if (hours > 9) {
            final_time += hours + ':';
        } else if (hours >= 0) {
            final_time += '0' + hours + ':';
        }
        times = times - hours * 3600;

        var minutes = parseInt(times / 60, 10);
        if (minutes > 9) {
            final_time += minutes + ':';
        } else if (minutes > 0) {
            final_time += '0' + minutes + ':';
        } else if (minutes == 0) {
            final_time += '00' + ':';
        }
        times = times - minutes * 60;

        //handle second display
        if (times > 9) {
            final_time += times;
        } else if (times > 0) {
            final_time += '0' + times;
        } else if (times == 0) {
            final_time += '00';
        }

        return final_time;
    };

// Статистика трафика за месяц

    self.trafficMonth = function(callback){
        self.info( '/api/monitoring/month_statistics',function( response ){

            if (self.trafficInfo== 'auto') {
                response.response.MonthDuration[0] = getCurrentTime(response.response.MonthDuration[0]);
                response.response.CurrentMonthDownload[0] = getTrafficInfo(response.response.CurrentMonthDownload[0]);
                response.response.CurrentMonthUpload[0] = getTrafficInfo(response.response.CurrentMonthUpload[0]);
                callback(filter (response));
            }else{
                callback(filter (response));
            }
        });
    }

// Статистика трафика модема
    self.traffic = function(callback){
        self.info( '/api/monitoring/traffic-statistics',function( response ){

            if (self.trafficInfo== 'auto') {
                response.response.CurrentConnectTime[0] = getCurrentTime(response.response.CurrentConnectTime[0]);
                response.response.TotalConnectTime[0] = getCurrentTime(response.response.TotalConnectTime[0]);
                response.response.CurrentUpload[0] = getTrafficInfo(response.response.CurrentUpload[0]);
                response.response.CurrentDownload[0] = getTrafficInfo(response.response.CurrentDownload[0]);
                response.response.TotalUpload[0] = getTrafficInfo(response.response.TotalUpload[0]);
                response.response.TotalDownload[0] = getTrafficInfo(response.response.TotalDownload[0]);
                response.response.CurrentDownloadRate[0] = getTrafficInfo(response.response.CurrentDownloadRate);
                response.response.CurrentUploadRate[0] = getTrafficInfo(response.response.CurrentUploadRate[0]);
                callback(filter (response));
            }else{
                callback(filter (response));
            }
        });
    }




    self.control  = function(value,callback){

        // перезугрузка модема
        if (value == 'reboot'){
            var xml = builder.create({
                request: {
                    Control: {
                        '#text': 1
                    },
                }
            }).end({ pretty: true});

            self.request( '/api/device/control', xml, function( response ){
                callback( response );
            });

            // вкл. и откл. от мобильной сети.
        }else if (value=='conect'){
            var xml = builder.create({
                request: {
                    Action: {
                        '#text': 1
                    },
                }
            }).end({ pretty: true});

            self.request( '/api/dialup/dial', xml, function( response ){
                callback( response );
            });

        }else if (value=='desconect'){
            var xml = builder.create({
                request: {
                    Action: {
                        '#text': 0
                    },
                }
            }).end({ pretty: true});

            self.request( '/api/dialup/dial', xml, function( response ){
                callback( response );
            });
        }else {
            callback( response = {"response":"ERROR"});
        }




    }

// запрос USSD

    self.ussd = function( number, callback ){
        var xml = builder.create({
            request: {

                content: {
                    '#text': number
                },
                codeType: {
                    '#text' : 'CodeType'
                }

            }
        }).end({ pretty: true});

        self.request( '/api/ussd/send', xml, function( response ){
            console.log(response)
            var wait_time = 0;
            if (response.response == 'OK') {
                function func() {
                    self.info('/api/ussd/get', function (response) {
                        console.log(response)
                        if(response.error){
                            if(wait_time>30){
                                callback(filter (response));
                            }else{
                                setTimeout(func, 1000);
                                wait_time = wait_time + 1;
                                //console.log(wait_time)
                            }

                        }else{
                            callback(filter (response));
                        }

                    });
                }

                setTimeout(func, 1000);
            }else{
                callback(filter (response));
            }

        });

    }



}

module.exports =  new hilink();
