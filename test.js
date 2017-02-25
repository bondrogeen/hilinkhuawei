var hilink = require('hilinkhuawei');


hilink.listInbox(function (response) {
    console.log(JSON.stringify(response, null, 2));
});


