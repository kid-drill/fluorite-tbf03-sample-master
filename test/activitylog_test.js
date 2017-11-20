/*
	[activitylog_test.js]

	encoding=utf-8
*/

var chai = require("chai");
var assert = chai.assert;
var expect = chai.expect;
var sinon = require("sinon");
var shouldFulfilled = require("promise-test-helper").shouldFulfilled;
var shouldRejected  = require("promise-test-helper").shouldRejected;
require('date-utils');
var ApiCommon_StubAndHooker = require("./support_stubhooker.js").ApiCommon_StubAndHooker;

const activitylog = require("../src/api/activitylog.js");

var TEST_CONFIG_SQL = { // テスト用
	database : "fake_db_name.sqlite3"
};


describe( "activitylog.js", function(){

    var COMMON_STUB_MANAGER = new ApiCommon_StubAndHooker(function(){
        return {
            "CONFIG_SQL" : TEST_CONFIG_SQL, 
            "sql_parts" : {
                "createPromiseForSqlConnection" : sinon.stub(),
                "closeConnection" : sinon.stub(),
                "isOwnerValid" : sinon.stub(),
                "getNumberOfUsers" : sinon.stub(),
                "setupTable1st" : sinon.stub(),
                "addNewUser" : sinon.stub(),
                "getInsertObjectFromPostData" : sinon.stub(),
                "getShowObjectFromGetData" : sinon.stub(),
                "getDeleteObjectFromGetData" : sinon.stub(), 
                "addActivityLog2Database" : sinon.stub(),
                "getListOfActivityLogWhereDeviceKey" : sinon.stub(),
                "deleteActivityLogWhereDeviceKey" : sinon.stub()
            }
        };
    });
    

    describe("::api_vi_activitylog_setup()",function(){
        var stubs, original = {};
        beforeEach(function(){ // 内部関数をフックする。
            original["SETUP_KEY"] = activitylog.factoryImpl.SETUP_KEY.getInstance(); 
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( activitylog, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( activitylog );
            activitylog.factoryImpl.SETUP_KEY.setStub( original.SETUP_KEY );
        });

        it("正常系", function(){
            var queryFromGet = null;
            var dataFromPost = { "create_key" : "せっとあっぷきー" };
            var EXPECTED_NEW_TABLE = { "hoge" : "fuga" };
            var api_vi_activitylog_setup = activitylog.api_vi_activitylog_setup;

            activitylog.factoryImpl.SETUP_KEY.setStub( dataFromPost.create_key );
            stubs.sql_parts.createPromiseForSqlConnection.onCall(0).returns(
                Promise.resolve()
            );
            stubs.sql_parts.setupTable1st.withArgs( TEST_CONFIG_SQL.database ).returns(
                Promise.resolve( EXPECTED_NEW_TABLE )
            );
            stubs.sql_parts.closeConnection.withArgs( TEST_CONFIG_SQL.database ).returns(
                Promise.resolve()
            );

            return shouldFulfilled(
                api_vi_activitylog_setup( queryFromGet, dataFromPost )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.setupTable1st.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );
                expect( result ).to.have.property( "jsonData" );
                expect( result.jsonData ).to.have.property( "tables" );
                expect( result.jsonData.tables ).to.deep.equal( EXPECTED_NEW_TABLE );
                expect( result ).to.have.property( "status" ).to.equal( 200 );
            });
        });
        it("異常系：テーブル生成失敗の内部エラー", function(){
            var queryFromGet = null;
            var dataFromPost = { "create_key" : "せっとあっぷきー" };
            var EXPECTED_FAILED_OBJ = { "table" : "cant create." };
            var api_vi_activitylog_setup = activitylog.api_vi_activitylog_setup;
    
            activitylog.factoryImpl.SETUP_KEY.setStub( dataFromPost.create_key );
            stubs.sql_parts.createPromiseForSqlConnection.onCall(0).returns(
                Promise.resolve()
            );
            stubs.sql_parts.setupTable1st.withArgs( TEST_CONFIG_SQL.database ).returns(
                Promise.reject( EXPECTED_FAILED_OBJ )
            );
            stubs.sql_parts.closeConnection.withArgs( TEST_CONFIG_SQL.database ).returns(
                Promise.resolve()
            );
    
            return shouldFulfilled(
                api_vi_activitylog_setup( queryFromGet, dataFromPost )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.setupTable1st.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );
                expect( result ).to.have.property( "jsonData" );
                expect( result.jsonData ).to.have.property( "setup_err" );
                expect( result.jsonData.setup_err ).to.deep.equal( EXPECTED_FAILED_OBJ );
                expect( result ).to.have.property( "status" ).to.equal( 500 );
            });
        });
        it("異常系：セットアップキーが不正", function(){
            var queryFromGet = null;
            var dataFromPost = { "create_key" : "不正なキー" };
            var EXPECTED_FAILED_OBJ = { "table" : "cant create." };
            var api_vi_activitylog_setup = activitylog.api_vi_activitylog_setup;
    
            activitylog.factoryImpl.SETUP_KEY.setStub( "期待キー" );

            return shouldFulfilled(
                api_vi_activitylog_setup( queryFromGet, dataFromPost )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.notCalled );
                assert( stubs.sql_parts.setupTable1st.notCalled );
                assert( stubs.sql_parts.closeConnection.notCalled );
                expect( result ).to.have.property( "jsonData" );
                expect( result ).to.have.property( "status" ).to.equal( 403 );
            });
        });
    });

    describe("::api_vi_activitylog_signup()",function(){
        var stubs, original = {};
        beforeEach(function(){ // 内部関数をフックする。
            original["MAX_USERS"] = activitylog.factoryImpl.MAX_USERS.getInstance();
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( activitylog, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( activitylog );
            activitylog.factoryImpl.MAX_USERS.setStub( original.MAX_USERS );
        });

        it("正常系：新規ユーザー追加", function(){
            var queryFromGet = null;
            var dataFromPost = { 
                "username" : "nyan1nyan2nyan3nayn4nayn5nyan6ny",
                "passkey"  : "cat1cat2"
            };
            var api_vi_activitylog_signup = activitylog.api_vi_activitylog_signup;

            stubs.sql_parts.createPromiseForSqlConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.withArgs( TEST_CONFIG_SQL.database ).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.reject({"here" : "is new user"})
            );
            stubs.sql_parts.getNumberOfUsers.withArgs( TEST_CONFIG_SQL.database ).returns(
                Promise.resolve( 15 )
            );
            activitylog.factoryImpl.MAX_USERS.setStub( 16 );
            stubs.sql_parts.addNewUser.onCall(0).returns(
                Promise.resolve()
            );
           

            return shouldFulfilled(
                api_vi_activitylog_signup( queryFromGet, dataFromPost )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                assert( stubs.sql_parts.getNumberOfUsers.calledOnce );
                assert( stubs.sql_parts.addNewUser.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );

                expect( stubs.sql_parts.addNewUser.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.addNewUser.getCall(0).args[1] ).to.equal( dataFromPost.username );
                // expect( stubs.sql_parts.addNewUser.getCall(0).args[2] ).to.equal( 128 ); データ数は未定。
                expect( stubs.sql_parts.addNewUser.getCall(0).args[3] ).to.equal( dataFromPost.passkey );
                
                expect( result ).to.have.property( "jsonData" );
                expect( result.jsonData ).to.have.property( "signuped" );
                expect( result.jsonData.signuped ).to.deep.equal({
                    "device_key" : dataFromPost.username,
                    "password"   : dataFromPost.passkey
                });
                expect( result ).to.have.property( "status" ).to.equal( 200 );
            });
        });
        it("正常系：既存ユーザーは、追加しないがOK応答する。", function(){
            var queryFromGet = null;
            var dataFromPost = { 
                "username" : "nyan1nyan2nyan3nayn4nayn5nyan6ny",
                "passkey"  : "cat1cat2"
            };
            var api_vi_activitylog_signup = activitylog.api_vi_activitylog_signup;

            stubs.sql_parts.createPromiseForSqlConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.withArgs( TEST_CONFIG_SQL.database ).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( 128 )
            );

            return shouldFulfilled(
                api_vi_activitylog_signup( queryFromGet, dataFromPost )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                assert( stubs.sql_parts.getNumberOfUsers.notCalled );
                assert( stubs.sql_parts.addNewUser.notCalled );
                assert( stubs.sql_parts.closeConnection.calledOnce );

                expect( result ).to.have.property( "jsonData" );
                expect( result.jsonData ).to.have.property( "signuped" );
                expect( result.jsonData.signuped ).to.deep.equal({
                    "device_key" : dataFromPost.username,
                    "password"   : dataFromPost.passkey,
                    "left" : 128 // isOwnerValid()が返した数値
                });
                expect( result ).to.have.property( "status" ).to.equal( 200 );
            });
        });

    });

    describe("::api_v1_activitylog_BASE()", function() {
        var stubs;
        var API_V1_BASE = activitylog.API_V1_BASE;

        /**
         * @type beforeEachで初期化される。
         */
        beforeEach(function(){ // 内部関数をフックする。
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( activitylog, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( activitylog );
        });

        // ここからテスト。
        it("正常系", function(){
            var instance = new API_V1_BASE();
            var spied_requestSql = sinon.spy( instance, "requestSql" );
            var inputData = {
                "device_key" : "これは識別キー。必ず必要",
                "pass_key"   : "これもセットで識別する。"
            };
            var EXPECTED_MAX_COUNT = 32;

            stubs.sql_parts.createPromiseForSqlConnection.withArgs( TEST_CONFIG_SQL ).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_COUNT )
            );

            return shouldFulfilled(
                instance.run( inputData )
            ).then(function( result ){
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );

                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                expect( stubs.sql_parts.isOwnerValid.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubs.sql_parts.isOwnerValid.getCall(0).args[1] ).to.equal( inputData.device_key );
                expect( stubs.sql_parts.isOwnerValid.getCall(0).args[2] ).to.equal( inputData.pass_key ); 

                assert( spied_requestSql.calledOnce );
                expect( spied_requestSql.getCall(0).args[0] ).to.have.property("getDeviceKey");
                expect( spied_requestSql.getCall(0).args[0] ).to.have.property("getPassKey");
                expect( spied_requestSql.getCall(0).args[0] ).to.have.property("getTypeValue");
               
                expect( result ).to.be.exist;
                expect( result ).to.have.property("jsonData");
                expect( result ).to.have.property("status").to.equal(200);
            });
        });
        it("異常系：認証NGの401");
    });
    
    describe("::api_v1_activitylog_show() over API_V1_BASE()", function(){
        var stubs;
        var api_v1_activitylog_show = activitylog.api_v1_activitylog_show;

        /**
         * @type beforeEachで初期化される。
         */
        beforeEach(function(){ // 内部関数をフックする。
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( activitylog, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( activitylog );
        });

        // ここからテスト。
        it("正常系", function(){
            var queryFromGet = { "here" : "is スルーパス、なので何でも良い" };
            var dataFromPost = null;
            var EXPECTED_PARAM_WITH_AUTO_DATE = { 
                "device_key" : "これは識別キー。必ず必要",
                "pass_key"   : "これもセットで識別する。",
                "date_start" : "2017-02-01", // queryGetに無い場合でも、getShowObjectFromGetData()でデフォルトを生成する。
                "date_end"   : "2017-02-14"  // 上同。
            };
            var EXPECTED_RECORDSET = [
                {"created_at":"2017-02-08T00:47:25.000Z","type": "101"},
                {"created_at":"2017-02-11T12:36:01.000Z","type": "102"}
            ];
            var EXPECTED_MAX_COUNT = 32;

            stubs.sql_parts.createPromiseForSqlConnection.withArgs( TEST_CONFIG_SQL ).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_COUNT )
            );
            stubs.sql_parts.getShowObjectFromGetData.withArgs(queryFromGet).returns( EXPECTED_PARAM_WITH_AUTO_DATE );
            stubs.sql_parts.getListOfActivityLogWhereDeviceKey.onCall(0).returns(
                Promise.resolve( EXPECTED_RECORDSET )
            );

            return shouldFulfilled(
                api_v1_activitylog_show( queryFromGet, dataFromPost )
            ).then(function( result ){
                var stubList = stubs.sql_parts.getListOfActivityLogWhereDeviceKey;
                
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                expect( result ).to.be.exist;
                expect( result ).to.have.property("jsonData");
                expect( result ).to.have.property("status").to.equal(200);
                // ここまでは、API_V1_BASE()で検証済みなので、簡易検証。

                assert( stubs.sql_parts.getShowObjectFromGetData.calledOnce, "呼び出しパラメータの妥当性検証＆整形、が一度呼ばれること" );
                expect( stubs.sql_parts.getShowObjectFromGetData.getCall(0).args[0] ).to.equal(queryFromGet);

                assert( stubList.calledOnce, "SQLへのログ取得クエリー。getListOfActivityLogWhereDeviceKey()が1度呼ばれること。" );
                expect( stubList.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( stubList.getCall(0).args[1] ).to.equal( EXPECTED_PARAM_WITH_AUTO_DATE.device_key );
                expect( stubList.getCall(0).args[2] ).to.deep.equal({
                    "start" : EXPECTED_PARAM_WITH_AUTO_DATE.date_start,
                    "end"   : EXPECTED_PARAM_WITH_AUTO_DATE.date_end 
                });

                expect( result.jsonData ).to.have.property( "table" );
                expect( result.jsonData.table ).to.deep.equal( EXPECTED_RECORDSET );
            });
        });
        it("異常系::getList～（）の部分");// だけでいい。他の401認証NGとかは、API_V1_BASE()で検証済み。
    });

    describe("::api_vi_activitylog_add()",function(){
        var stubs;
        var api_v1_activitylog_add = activitylog.api_v1_activitylog_add;

        /**
         * @type beforeEachで初期化される。
         */
        beforeEach(function(){ // 内部関数をフックする。
            stubs = COMMON_STUB_MANAGER.createStubs();

            COMMON_STUB_MANAGER.hookInstance( activitylog, stubs );
        });
        afterEach(function(){
            COMMON_STUB_MANAGER.restoreOriginal( activitylog );
        });

        // ここからテスト。
        it("正常系", function(){
            var queryFromGet = null;
            var dataFromPost = { "here" : "is スルーパス、なので何でも良い" };
            var EXPECTED_CONVERTED_PARAM = { 
                "device_key" : "これは識別キー。必ず必要",
                "pass_key"   : "これもセットで識別する。",
                "type_value" : "101"
            };
            var EXPECTED_MAX_COUNT = 32;
            var EXPECTED_INSERTED = {
                "device_key" : "これは識別キー。必ず必要",
                "type_value" : "101"
            };

            stubs.sql_parts.createPromiseForSqlConnection.withArgs( TEST_CONFIG_SQL ).returns( Promise.resolve() );
            stubs.sql_parts.closeConnection.onCall(0).returns( Promise.resolve() );
            stubs.sql_parts.isOwnerValid.onCall(0).returns(
                Promise.resolve( EXPECTED_MAX_COUNT )
            );
            stubs.sql_parts.getInsertObjectFromPostData.withArgs(dataFromPost).returns( EXPECTED_CONVERTED_PARAM );
            stubs.sql_parts.addActivityLog2Database.onCall(0).returns(
                Promise.resolve( EXPECTED_INSERTED )
            );

            return shouldFulfilled(
                api_v1_activitylog_add( queryFromGet, dataFromPost )
            ).then(function( result ){
                var addedResponse = stubs.sql_parts.addActivityLog2Database;
                
                assert( stubs.sql_parts.createPromiseForSqlConnection.calledOnce );
                assert( stubs.sql_parts.closeConnection.calledOnce );
                assert( stubs.sql_parts.isOwnerValid.calledOnce );
                expect( result ).to.be.exist;
                expect( result ).to.have.property("jsonData");
                expect( result ).to.have.property("status").to.equal(200);
                // ここまでは、API_V1_BASE()で検証済みなので、簡易検証。

                assert( stubs.sql_parts.getInsertObjectFromPostData.calledOnce, "呼び出しパラメータの妥当性検証＆整形、が一度呼ばれること" );
                expect( stubs.sql_parts.getInsertObjectFromPostData.getCall(0).args[0] ).to.equal(dataFromPost);

                assert( addedResponse.calledOnce, "SQLへのログ追加クエリー。getListOfActivityLogWhereDeviceKey()が1度呼ばれること。" );
                expect( addedResponse.getCall(0).args[0] ).to.equal( TEST_CONFIG_SQL.database );
                expect( addedResponse.getCall(0).args[1] ).to.equal( EXPECTED_CONVERTED_PARAM.device_key );
                expect( addedResponse.getCall(0).args[2] ).to.equal( EXPECTED_CONVERTED_PARAM.type_value );

                expect( result.jsonData ).to.have.property( "device_key" );
                // jsonData.resultには文字列が入るが、特に規定はしない。
            });
        });
        it("異常系::addActivityLog～（）の部分");// だけでいい。他の401認証NGとかは、API_V1_BASE()で検証済み。
    });

});
/*
    参照先Webページメモ
    http://chaijs.com/api/bdd/
    http://sinonjs.org/docs/
    http://qiita.com/xingyanhuan/items/da9f814ce4bdf8f80fa1
    http://azu.github.io/promises-book/#basic-tests
*/






