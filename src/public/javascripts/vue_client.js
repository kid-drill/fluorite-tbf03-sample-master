/**
 * [vue_client.js]
    encoding=utf-8
 */



var _setVueComponentGrid = function( staticVue ){
    // register the grid component
    staticVue.component('vue-my-element-grid', {
        template: '#grid-template',
        props: {
            // filterKey: String,
            data: Array,
            columns: Array
        },
        /* // コンスタラクタで初期化するprops、と見なせばよい。
        data: function () {
            var sortOrders = {}
            this.columns.forEach(function (key) {
                sortOrders[key] = 1
            })
            return {
                sortKey: '',
                sortOrders: sortOrders
            }
        },
        */
        computed: {
            /*
            filteredData: function () {
                var sortKey = this.sortKey
                var filterKey = this.filterKey && this.filterKey.toLowerCase()
                var order = this.sortOrders[sortKey] || 1
                var data = this.data
                if (filterKey) {
                    data = data.filter(function (row) {
                        return Object.keys(row).some(function (key) {
                        return String(row[key]).toLowerCase().indexOf(filterKey) > -1
                        })
                    })
                }
                if (sortKey) {
                    data = data.slice().sort(function (a, b) {
                        a = a[sortKey]
                        b = b[sortKey]
                        return (a === b ? 0 : a > b ? 1 : -1) * order
                    })
                }
                return data
            }
            */
            filteredData : function() {
                return this.data;
            }
        /*
        },
        filters: {
            capitalize: function (str) {
                return str.charAt(0).toUpperCase() + str.slice(1)
            }
        },
        methods: {
            "sortBy": function (key) {
                this.sortKey = key
                this.sortOrders[key] = this.sortOrders[key] * -1
            },
        */
        }
    });
};  
var _vueAppGrid = function( createVueInstance, client_lib, chartsleeping_lib ){
    var ICON_COLOR = {
        "active" : "color:#4444ff",
        "inactive" : "color:#aaaaaa"
    };
    var app_grid = createVueInstance({
        el: '#app_grid',
        data: {
            "searchQuery": '',
            "gridColumns": ['time', 'activity'],
            "gridData": [],
            "TEXT_GETUP" : ACTIVITY.GET_UP.title,
            "TEST_GOTOBED" : ACTIVITY.GOTO_BED.title,
            "chartIconColorBar" : ICON_COLOR.active,
            "chartIconColorLine" : ICON_COLOR.inactive,
            "lodingSpinnerDivStyle" : {"display" : "block"},
            "lastLoadedActivityData" : null, // 最初は「無し」
            "isRefreshDataIcon" : true,
            "isShowUploadingIcon" : false
        },
        methods : {
            "getGridData" : function() {
                var promise = client_lib.getActivityDataInAccordanceWithAccountVue();
                return promise.then((resultArray)=>{
                    var localtimedArray = client_lib.modifyTimezoneInActivityList( resultArray );
                    var grid_activity_data = client_lib.convertActivityList2GridData( localtimedArray );
                    this.gridData = grid_activity_data.slice(0, 6);
                    // ↑カットオフ入れてる。最大６つまで、で。

                    // ↓寺家列に対して grid_activity_data は逆順（最初が最新）なので、注意。
                    return Promise.resolve( localtimedArray );
                }).then(( activitiyData )=>{
                    // チャートのテスト
                    chartsleeping_lib.plot2Chart( activitiyData );
                    this.lastLoadedActivityData = activitiyData; // 記録しておく。
                    return Promise.resolve();
                }).then(()=>{ // thisの指す先に注意。ここではアロー演算子なので、Vueインスタンス自身。
                    // 読み込み中、の表示を消す。
                    this.lodingSpinnerDivStyle.display = "none";

                    // 続く時間差のテスト（なければ消す）。
                    return new Promise((resolve,reject)=>{
                        setTimeout(function() {
                            resolve();
                        }, 2000);
                    });
                });
            },
            "noticeGotUp" : function(){
                var promise = client_lib.addActivityDataInAccordanceWithAccountVue( ACTIVITY.GET_UP.type );

                this.isRefreshDataIcon = false;
                this.isShowUploadingIcon = true;
                promise.then((responsedata)=>{ // 引数は読み捨て。
                    return this.getGridData(); // ↑アロー演算子なので、このthisはvueのインスタンスを刺す。
                }).catch((err)=>{
                    if(err.response){ //暫定
                        alert(err.response.status);
                    }else{
                        alert(err.request);
                    }
                }).then(()=>{
                    this.isRefreshDataIcon = true;
                    this.isShowUploadingIcon = false;
                });
            },
            "noticeGotoBed" : function(){
                var promise = client_lib.addActivityDataInAccordanceWithAccountVue( ACTIVITY.GOTO_BED.type );

                this.isRefreshDataIcon = false;
                this.isShowUploadingIcon = true;
                promise.then((responsedata)=>{ // 引数は読み捨て。
                    return this.getGridData(); // ↑アロー演算子なので、このthisはvueのインスタンスを刺す。
                }).catch((err)=>{
                    alert(err); //暫定
                }).then(()=>{
                    this.isRefreshDataIcon = true;
                    this.isShowUploadingIcon = false;
                });
            },
            "refreshData" : function() {
                // 読み込み中、の表示を出す。
                this.lodingSpinnerDivStyle.display = "display";

                // データを、サーバーから再読み込みして表示する。
                this.getGridData();
            },
            "setChartStyleLine" : function(){
                chartsleeping_lib.plot2Chart( this.lastLoadedActivityData, "line" );
                this.chartIconColorBar  = ICON_COLOR.inactive;
                this.chartIconColorLine = ICON_COLOR.active;
            },
            "setChartStyleBar" : function(){
                chartsleeping_lib.plot2Chart( this.lastLoadedActivityData, "bar" );
                this.chartIconColorBar  = ICON_COLOR.active;
                this.chartIconColorLine = ICON_COLOR.inactive;
            }
        },
        "mounted" : function() {
            var self = this;
            setTimeout(function() {
                // 初期化の都合で、0.5秒後に実行する。【暫定】
                // ToDo：単純に「未だ準備が終わって無ければ1秒後にリトライ」が良いのでは？
                self.getGridData();
            }, 500);
        }
    });
    return app_grid;
};


var _vueAppSetup = function( createVueInstance ){
    var app_setup = createVueInstance({
        el: "#app_setup",
        data: {
            "userName": "",
            "passKeyWord" : ""
        },
        computed : {
            "userNameIsValid" : function(){
                var pattern = new RegExp("^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$");
                var str = this.userName + ""; // Chromeは、明示的に「文字列」にしないとダメなようだ。
                return str.match( pattern );
            },
            "passKeyIsValid" : function(){
                var key = this.passKeyWord;
                return (key) && (key.length > 8)
            }
        },
        methods : {
            createAccount(){
                var promise = account_lib.promiseCreateAccount( this.userName, this.passKeyWord );
                promise.then(function(result){
                    // ToDo：この辺の作りこみ後で。

                    var signupedInfomation = result.signuped;
                    var str = "ID: " + signupedInfomation.device_key + "\r\n";
                    str += "パスワード: " + signupedInfomation.password + "\r\n";
                    if( signupedInfomation.left ){
                        str += "\r\n上記のアカウントの有効性を確認しました。";
                    }else{
                        str += "\r\n上記にて、アカウント作成に成功しました。";
                    }
                    alert( str );

                    console.log( result );

                    client_lib.tinyCookie( COOKIE_USER_ID, signupedInfomation.device_key, COOKIE_OPTIONS );
                    client_lib.tinyCookie( COOKIE_USER_PASSWORD, signupedInfomation.password, COOKIE_OPTIONS );
                }).catch(function(err){
                    alert( "登録できませんでした。\r\n\r\n※詳細なエラー表示は未実装。" );
                });
            }
        },
        mounted : function(){
            var savedUserName = client_lib.tinyCookie( COOKIE_USER_ID );
            var savedPassKey = client_lib.tinyCookie( COOKIE_USER_PASSWORD );
            this.userName = savedUserName;
            this.passKeyWord = savedPassKey;
        }
    });
    return app_setup;
};
var COOKIE_USER_ID = "FLUORITE_LIFELOG_USERID20171017";
var COOKIE_USER_PASSWORD = "FLUORITE_LIFELOG_PASSWORD20171017";
var COOKIE_OPTIONS = { 
    "expires": "1M" // ToDo：要検討
};
if( this.window && this.window.location && (this.window.location.href.indexOf("https://")==0) ){
    COOKIE_OPTIONS["secure"] = true;
    // これを指定しないと、Chromeのhttps環境ではCookieが保存されない？？？
    // それからChrome「Smart Lock」が有効だと、Cookieによるフォームの初期化の
    // 実装とタイミング問題を起こすことがある？？？
}

// https://github.com/Alex1990/tiny-cookie
// 
// today + 1 year
// var exdate = new Date().getTime() + (1000*60*60*24*7*52);
// var date_cookie = new Date(exdate).toUTCString();


var _tinyCookie = this.window ? window.Cookie : undefined; // ブラウザ環境以外は敢えて「未定義」にしておく。
/*
    name = cookie( COOKIE_NAME + n, list[n].text, COOKIE_OPTIONS );
*/
        


// ToDo: axiosへのインスタンスをフックしておかないと、テストできない！
var _promiseCreateAccount = function( mailAddress ){
    // ToDo:これから実装
    return Promise.resolve( client_lib.axios );
};



/**
 * 動作種別の定義
 */
var ACTIVITY = {
    "GOTO_BED" : {
        "title" : "寝る",
        "type" : "101"
    },
    "GET_UP" : {
        "title" : "起きた",
        "type" : "102"
    }
};
if( !this.window ){
    exports.ACTIVITY = ACTIVITY;
}


/**
 * 動作ドメイン「azurewebsites.net/」で判別して、GMT→JST補正する。
 */
var convertGMT2JST = function( dateStr ){
    var dt;
    var TIME_ZONE = 9; // JST
    if( window && window.location && (window.location.href.indexOf("azurewebsites.net/")>0) ){
    dt = new Date( dateStr );
        dt.setHours(dt.getHours() + TIME_ZONE);
        dateStr = dt.toLocaleString();
    }
    return dateStr;
};
var _modifyTimezoneInActivityList = function( typeArray ){
    var n = typeArray.length
    while( 0<n-- ){
        typeArray[n].created_at = convertGMT2JST( typeArray[n].created_at );
    }
    return typeArray;
};

/**
 * 逆順で格納されるので注意（グリッドビューの表示は下→上を時系列とする）。
 */
var _convertActivityList2GridData = function( typeArray ){
    var array = typeArray; // [{ "create_at", "type" }]
    var n = array.length;
    var item, grid_activity_data = []; // [{"time", "type"}]
    while( 0<n-- ){
        item = array[n];
        grid_activity_data.push({
            "time" : item.created_at.substr(0, 16), // ToDo:「表示形式」での出力へ変更すること
            "activity" : (function( obj, type ){
                var keys = Object.keys(obj);
                var i = keys.length;
                while( 0<i-- ){
                    if( obj[ keys[i] ].type == type ){
                        return obj[ keys[i] ].title;
                    }
                }
                return "No title";
            }( ACTIVITY, item.type ))
        });
    }
    return grid_activity_data;
}


var _fake_ajax1 = function(){
    return new Promise(function(resolve,reject){
        setTimeout(function() {
            resolve({
                "data" : 
                {
                    "result":"fake ajax is is OK!",
                    "table":[
                        { "created_at" : "2017-10-13 01:00:00.000", "type" : 101 },
                        { "created_at" : "2017-10-13 06:00:00.000", "type" : 101 },
                        { "created_at" : "2017-10-13 23:45:00.000", "type" : 101 },
                        { "created_at" : "2017-10-14 08:30:20.000", "type" : 102 },
                        { "created_at" : "2017-10-14 23:30:00.000", "type" : 101 },
                        { "created_at" : "2017-10-15 06:00:20.000", "type" : 102 },
                        { "created_at" : "2017-10-16 00:38:21.000", "type" : 101 },
                        { "created_at" : "2017-10-16 06:23:57.000", "type" : 102 }
                    ]
                }        
            });
        }, 500);
    });
};
var _getActivityDataInAccordanceWithAccountVue = function(){
    var url = "./api/v1/activitylog/show";
    var axiosInstance = client_lib.axios;
    var promise;
    var savedUserName = client_lib.vueAccountInstance.userName;
    var savedPassKey  = client_lib.vueAccountInstance.passKeyWord;
    if( (savedUserName != null) && (savedUserName.length > 10) ){
console.log( "axios act!" ); // ←↑この辺は、テスト用。暫定。
        promise = axiosInstance.get(
            url,
            {
                "crossdomain" : true,
                "params" : {
                    "device_key" : savedUserName,
                    "pass_key" : savedPassKey
                }
            }
        );
    }else{
console.log( "fake_axios!" );        
        promise = _fake_ajax1();
    }
    return promise.then(function(result){
        var responsedata = result.data;
(function (array) { // デバッグ用。
    var str, i , n = array.length;
    for(i=0;i<n;i++){
        str = "[" + array[i].created_at + " - ";
        str += array[i].type + "]";
        console.log( str );
    }
}(responsedata.table));
        console.log( responsedata.table );
        return Promise.resolve( responsedata.table );     
        // 正常応答のフォーマットは、以下の公式さんを参照の事。
        // https://github.com/axios/axios#response-schema
    }).catch((err)=>{
        return Promise.reject(err); // ってコレだったら、catch()する必要ないんだが、、、まぁ様式美。
        // エラー応答のフォーマットは以下の公式さんを参照の事。
        // https://github.com/axios/axios#handling-errors
    });
};
var _addActivityDataInAccordanceWithAccountVue = function( typeValue ){
    var url = "./api/v1/activitylog/add";
    var axiosInstance = client_lib.axios;
    var promise;
    var savedUserName = client_lib.vueAccountInstance.userName;
    var savedPassKey  = client_lib.vueAccountInstance.passKeyWord;
    if( (savedUserName != null) && (savedUserName.length > 10) ){
console.log( "axios act!" ); // ←↑この辺は、テスト用。暫定。
        promise = axiosInstance.post(
            url,
            { // postData
                "device_key" : savedUserName,
                "pass_key" : savedPassKey,
                "type_value" : typeValue
            }
        );
    }else{
console.log( "fake_axios!" );        
        promise = Promise.resolve({
            "data" : { 
                result: 'Success to insert ' + typeValue + ' as activitylog on Database!',
                device_key: 'xingyanhuan@yahoo.co.jp'
            }
        });
        // promise = Promise.reject({
        //     "response" : {
        //         "status" : 401
        //     }
        // });
    }
    return promise.then(function(result){
        var responsedata = result.data;
console.log( responsedata );
        return Promise.resolve( responsedata );     
    })
};






// ----------------------------------------------------------------------
var client_lib = {
    "tinyCookie" : _tinyCookie,
    "modifyTimezoneInActivityList" : _modifyTimezoneInActivityList,
    "convertActivityList2GridData" : _convertActivityList2GridData,
    "getActivityDataInAccordanceWithAccountVue" : _getActivityDataInAccordanceWithAccountVue,
    "addActivityDataInAccordanceWithAccountVue" : _addActivityDataInAccordanceWithAccountVue
};

// typeof window !== 'undefined'
if( this.window ){
    // ブラウザ環境での動作
    var CREATE_VUE_INSTANCE = function(options){
        return new Vue(options);
    };
    var browserThis = this;
    window.onload = function(){
        client_lib["axios"] = (browserThis.window) ? browserThis.axios : {}; // ダミー

        _setVueComponentGrid( Vue );
        chartsleeping_lib.initialize( browserThis ); // このとき、this.document / window などが存在する。
        account_lib.initialize( browserThis );
        _vueAppGrid( CREATE_VUE_INSTANCE, client_lib, chartsleeping_lib );
        client_lib["vueAccountInstance"] = _vueAppSetup( CREATE_VUE_INSTANCE, client_lib, account_lib );
    };


}else{
    // ここに来るのは、テスト時だけ。on Node.js
    exports.setVueComponentGrid = _setVueComponentGrid;
    exports.vueAppGrid = _vueAppGrid;
    exports.vueAppSetup = _vueAppSetup;
    
    exports.promiseCreateAccount = _promiseCreateAccount;
    exports.client_lib = client_lib;
}


