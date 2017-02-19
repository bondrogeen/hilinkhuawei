Клиент для Huawei модемов с прошивками HiLink

* Установка

$ npm install hilinkhuawei


* Совместимость
E3372 (МТС 827F/829F, МегаФон M150-2, Билайн E3372/E3370, TELE2 E3372р-153
	
* Include

	var hilink = require('hilinkhuawei');
	
* Изменить IP адрес (default 192.168.8.1)

	hilink.setIp('192.168.8.x')

* Отправка SMS ( number, text, callback )

	hilink.send( '12345678', 'Hello world', function( response ){
		console.log( response );
	});
	
* Ответ: *

	{ response: 'OK' }
	
* Отправка без сохранения  SMS ( number, text, callback )

	hilink.sendAndDelete( '12345678', 'Hello world', function( sendResponse, deleteResponse ){
		console.log( sendResponse );
		console.log( deleteResponse );
	});
	
* Ответ: *

	{ response: 'OK' }
	{ response: 'OK' }

* Отключиться от сети (callback)

    	hilink.desconnect(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{  response: 'OK'  }

* Подключиться к сети (callback)

    	hilink.connect(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{  response: 'OK'  }

* Перезагрузка модема (callback)

    	hilink.reboot(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{  response: 'OK'  }




* Список исходящих сообщений (callback)

	hilink.listOutbox(function( response ){
 		console.log( JSON.stringify( response, null, 2 ) );
	});
	
* Ответ: *

    {
      'response': {
        'Count': [
          '1'
        ],
        'Messages': [
          {
            'Message': [
              {
                'Smstat': [
                  '3'
                ],
                'Index': [
                  '20000'
                ],
                'Phone': [
                  '12345678'
                ],
                'Content': [
                  'Hello world'
                ],
                'Date': [
                  '2017-04-03 09:01:54'
                ],
                'Sca': [
                  ''
                ],
                'SaveType': [
                  '3'
                ],
                'Priority': [
                  '4'
                ],
                'SmsType': [
                  '1'
                ]
              }
            ]
          }
        ]
      }
    }
    
* Список входящих сообщений (callback)

	hilink.listInbox(function( response ){
 		console.log( JSON.stringify( response, null, 2 ) );
	});
	
* Ответ: *

    {
      'response': {
        'Count': [
          '1'
        ],
        'Messages': [
          {
            'Message': [
              {
                'Smstat': [
                  '0'
                ],
                'Index': [
                  '40001'
                ],
                'Phone': [
                  '+71234567898'
                ],
                'Content': [
                  'Hello  bondrogeen'
                ],
                'Date': [
                  '2014-03-03 17:49:16'
                ],
                'Sca': [
                  ''
                ],
                'SaveType': [
                  '4'
                ],
                'Priority': [
                  '0'
                ],
                'SmsType': [
                  '1'
                ]
              }
            ]
          }
        ]
      }
    }
    
* Очистка входящих сообщений

	hilink.clearInbox();
	
* Очистка исходящих сообщений

	hilink.clearOutbox();

* Статус (callback)

	hilink.status(function( response ){
        console.log( JSON.stringify( response, null, 2 ) );
    });

* Ответ: *

	{
      'response': {
        'ConnectionStatus': [
          '901'
        ],
        'WifiConnectionStatus': [
          ''
        ],
        'SignalStrength': [
          ''
        ],
        'SignalIcon': [
          '3'
        ],
        'CurrentNetworkType': [
          '101'
        ],
        'CurrentServiceDomain': [
          '3'
        ],
        'RoamingStatus': [
          '0'
        ],
        'BatteryStatus': [
          ''
        ],
        'BatteryLevel': [
          ''
        ],
        'BatteryPercent': [
          ''
        ],
        'simlockStatus': [
          '0'
        ],
        'WanIPAddress': [
          '10.10.10.10'
        ],
        'WanIPv6Address': [
          ''
        ],
        'PrimaryDns': [
          '217.74.244.5'
        ],
        'SecondaryDns': [
          '217.74.244.4'
        ],
        'PrimaryIPv6Dns': [
          ''
        ],
        'SecondaryIPv6Dns': [
          ''
        ],
        'CurrentWifiUser': [
          ''
        ],
        'TotalWifiUser': [
          ''
        ],
        'currenttotalwifiuser': [
          '0'
        ],
        'ServiceStatus': [
          '2'
        ],
        'SimStatus': [
          '1'
        ],
        'WifiStatus': [
          ''
        ],
        'CurrentNetworkTypeEx': [
          '101'
        ],
        'maxsignal': [
          '5'
        ],
        'wifiindooronly': [
          '-1'
        ],
        'wififrequence': [
          '0'
        ],
        'msisdn': [
          ''
        ],
        'classify': [
          'hilink'
        ],
        'flymode': [
          '0'
        ]
      }
    }


* Уведомление (callback)

    	hilink.notifications(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{
  'response': {
    'UnreadMessage': [
      '0'
    ],
    'SmsStorageFull': [
      '0'
    ],
    'OnlineUpdateStatus': [
      '10'
    ]
  }
}

* Статус сети (callback)

    	hilink.statusNet(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{
  'response': {
    'State': [
      '0'
    ],
    'FullName': [
      'MTS-RUS'
    ],
    'ShortName': [
      'MTS'
    ],
    'Numeric': [
      '25001'
    ],
    'Rat': [
      '7'
    ]
  }
}

* Состояние о кол. смс (callback)

    	hilink.smsCount(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{
  'response': {
    'LocalUnread': [
      '0'
    ],
    'LocalInbox': [
      '1'
    ],
    'LocalOutbox': [
      '2'
    ],
    'LocalDraft': [
      '0'
    ],
    'LocalDeleted': [
      '0'
    ],
    'SimUnread': [
      '0'
    ],
    'SimInbox': [
      '1'
    ],
    'SimOutbox': [
      '0'
    ],
    'SimDraft': [
      '0'
    ],
    'LocalMax': [
      '500'
    ],
    'SimMax': [
      '5'
    ],
    'SimUsed': [
      '1'
    ],
    'NewMsg': [
      '0'
    ]
  }
}

* Уровень сигнала (callback)

    	hilink.signal(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{
  'response': {
    'pci': [
      '460'
    ],
    'sc': [
      ''
    ],
    'cell_id': [
      '141706539'
    ],
    'rsrq': [
      '-7dB'
    ],
    'rsrp': [
      '-96dBm'
    ],
    'rssi': [
      '-83dBm'
    ],
    'sinr': [
      '9dB'
    ],
    'rscp': [
      ''
    ],
    'ecio': [
      ''
    ],
    'mode': [
      '7'
    ]
  }
}

* Адреса  (callback)

    	hilink.settingsNet(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{
  'response': {
    'DhcpIPAddress': [
      '192.168.8.1'
    ],
    'DhcpLanNetmask': [
      '255.255.255.0'
    ],
    'DhcpStatus': [
      '1'
    ],
    'DhcpStartIPAddress': [
      '192.168.8.100'
    ],
    'DhcpEndIPAddress': [
      '192.168.8.200'
    ],
    'DhcpLeaseTime': [
      '86400'
    ],
    'DnsStatus': [
      '1'
    ],
    'PrimaryDns': [
      '192.168.8.1'
    ],
    'SecondaryDns': [
      '192.168.8.1'
    ]
  }
}

* Тип сети (callback)

    	hilink.Net(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{
  'response': {
    'productfamily': [
      'LTE'
    ],
    'classify': [
      'hilink'
    ],
    'multimode': [
      '0'
    ]
  }
}

* Статистика подключения (callback)

    	hilink.traffic(function( response ){
            console.log( JSON.stringify( response, null, 2 ) );
        });

* Ответ: *

{
  'response': {
    'CurrentConnectTime': [
      '3644'
    ],
    'CurrentUpload': [
      '3743812'
    ],
    'CurrentDownload': [
      '192565694'
    ],
    'CurrentDownloadRate': [
      '1828953'
    ],
    'CurrentUploadRate': [
      '18653'
    ],
    'TotalUpload': [
      '16200230379'
    ],
    'TotalDownload': [
      '386548284594'
    ],
    'TotalConnectTime': [
      '8895223'
    ],
    'showtraffic': [
      '1'
    ]
  }
}

