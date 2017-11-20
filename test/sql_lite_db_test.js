/*
    [sql_lite_db_test.js]

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

const sql_parts = require("../src/api/sql_lite_db.js");




describe( "sql_lite_db_test.js", function(){
    /**
     * @type 各テストからはアクセス（ReadOnly）しない定数扱いの共通変数。
     */
    var ORIGINAL = {};
    var sqlConfig = { "database" : "だみ～.sqlite3" };
    beforeEach( function(){
        ORIGINAL[ "sqlite3" ] = sql_parts.factoryImpl.sqlite3.getInstance();
        ORIGINAL[ "dbs" ] = sql_parts.factoryImpl.db.getInstance();
    });
    afterEach( function(){
        sql_parts.factoryImpl.sqlite3.setStub( ORIGINAL.sqlite3 );
        sql_parts.factoryImpl.db.setStub( ORIGINAL.dbs );
    });
    

    describe( "::createPromiseForSqlConnection()",function(){
        var createPromiseForSqlConnection = sql_parts.createPromiseForSqlConnection;
        var stubInstance, databaseArgs1, stubDbs = {};

        beforeEach( function(){
            var stubSqlite3 = { 
                "verbose" : sinon.stub() 
            };
            stubInstance = { "sqlite3" : "fake"}; // newで返すオブジェクトのモック。
            databaseArgs1 = "";
    
            // sqlite3モジュールに対するI/Oをモックに差し替える。
            stubSqlite3.verbose.onCall(0).returns({
                "Database" : function( databaseName, callback ){
                    // newされた時のコンスタラクタ処理に相当。
                    // returnすることで差替えることが出来る。
                    setTimeout(function() {
                        callback(); // 非同期で呼ばれる、、、を疑似的に行う。
                    }, 100);
                    databaseArgs1 = databaseName;
                    return stubInstance;
                }
            });
            sql_parts.factoryImpl.sqlite3.setStub( stubSqlite3 );
            sql_parts.factoryImpl.db.setStub( stubDbs ); // ToDo: これ、ちゃんと動作してる？
        });
    
        it("正常系",function(){
            var dbs = sql_parts.factoryImpl.db.getInstance(); 

            expect( dbs[ sqlConfig.database ] ).to.not.exist;
            return shouldFulfilled(
                sql_parts.createPromiseForSqlConnection( sqlConfig )
            ).then(function(){
                expect( databaseArgs1 ).to.equal( sqlConfig.database, "呼び出したデータベース名でnew Databese()されたこと" );
                expect( dbs[ sqlConfig.database ] ).to.equal( stubInstance, "空だったdbsに、データベースインスタンスが追加されている事" );
            });
        });
        it("異常系");
    });
    describe( "::closeConnection()",function(){
        var closeConnection = sql_parts.closeConnection;
        it("正常系。期間指定なし。",function(){
            var period = null; //無しの場合
            var deviceKey = "にゃーん。";
            var dbs = sql_parts.factoryImpl.db.getInstance();
            var stub_instance = sinon.stub();

            dbs[ sqlConfig.database ] = {
                "close" : stub_instance
            };
            stub_instance.callsArgWith(0, null);
            return shouldFulfilled(
                sql_parts.closeConnection( sqlConfig.database )
            ).then(function(result){
                assert( stub_instance.calledOnce );
                expect( dbs[ sqlConfig.database ] ).to.not.be.exist;
            });
            
        });
    });
    describe( "::isOwnerValid()", function(){
        var isOwnerValid = sql_parts.isOwnerValid;
        var stubDbs = {};

        beforeEach(function () {
            stubDbs[ sqlConfig.database ] = {};
            sql_parts.factoryImpl.db.setStub( stubDbs );
        });

        it("正常系", function(){
            var databaseName = sqlConfig.database;
            var deviceKey = "にゃ～ん";
            var password = "ほげ";
            var expectedMaxCount = 32;
            var stub_instance = sinon.stub();
            var stub_wrapperStr = sinon.stub()
            .callsFake( function(str){ return str; } );
            var dbs = sql_parts.factoryImpl.db.getInstance();
            
            dbs[ databaseName ] = {
                "all" : stub_instance
            };
            stub_instance.callsArgWith(2, null, [{
                "owners_hash" : deviceKey,
                "password" : password, 
                "max_entrys" : expectedMaxCount
            }]);
            sql_parts.factoryImpl._wrapStringValue.setStub( stub_wrapperStr );

            return shouldFulfilled(
                isOwnerValid( databaseName, deviceKey, password )
            ).then(function (result) {
                assert( stub_wrapperStr.withArgs( deviceKey ).calledOnce );
                assert( stub_wrapperStr.withArgs( password ).calledOnce );
                assert( stub_instance.calledOnce );
                var called_args = stub_instance.getCall(0).args;
                expect( called_args[0] ).to.equal(
                    "SELECT owners_hash, password, max_entrys " 
                    + "FROM owners_permission "
                    + "WHERE [owners_hash]=\'" + deviceKey + "\'"
                );
                expect( called_args[1].length ).to.equal( 0 );
                expect( result ).to.equal( expectedMaxCount );
                
            });
        });
        it("異常系::識別キーは在ったが、パスワードが異なる");
    });
    describe( "::getListOfActivityLogWhereDeviceKey()",function(){
        var getListOfActivityLogWhereDeviceKey = sql_parts.getListOfActivityLogWhereDeviceKey;

        it("正常系。期間指定なし。",function(){
            var period = null; //無しの場合
            var deviceKey = "にゃーん。";
            var dbs = sql_parts.factoryImpl.db.getInstance();
            var expectedRows = [
                { "created_at": '2017-10-22 23:59:00.000', "type": 900 }
            ];
            var stub_instance = sinon.stub();
            var stub_wrapperStr = sinon.stub()
            .callsFake( function(str){ return str; } );

            dbs[ sqlConfig.database ] = {
                "all" : stub_instance
            };
            stub_instance.callsArgWith(2, /* err= */null, /* rows= */expectedRows);

            sql_parts.factoryImpl._wrapStringValue.setStub( stub_wrapperStr );


            return shouldFulfilled(
                sql_parts.getListOfActivityLogWhereDeviceKey( sqlConfig.database, deviceKey, period )
            ).then(function(result){
                assert( stub_wrapperStr.withArgs( deviceKey ).calledOnce );
                assert( stub_instance.calledOnce );
                var called_args = stub_instance.getCall(0).args;
                expect( called_args[0] ).to.equal(
                    "SELECT created_at, type FROM activitylogs " 
                    + "WHERE [owners_hash]=\'" + deviceKey + "\'"
                );
                expect( called_args[1].length ).to.equal( 0 );
                expect( result ).to.deep.equal( expectedRows );
            });
        });
    });
    describe( "::addActivityLog2Database()", function () {
        var addActivityLog2Database = sql_parts.addActivityLog2Database;
        it("正常系", function () {
            var deviceKey = "にゃーん。";
            var typeOfAction = "111";
            var dbs = sql_parts.factoryImpl.db.getInstance();
            var stub_instance = sinon.stub();
            var stub_wrapperStr = sinon.stub().callsFake( function(str){ return str; } );
            var clock = sinon.useFakeTimers(); // これで時間が止まる。「1970-01-01 09:00:00.000」に固定される。
            
            dbs[ sqlConfig.database ] = {
                "all" : stub_instance
            };
            stub_instance.callsArgWith(2, /* err= */null, /* rows= */null);
            sql_parts.factoryImpl._wrapStringValue.setStub( stub_wrapperStr );

            return shouldFulfilled(
                sql_parts.addActivityLog2Database( sqlConfig.database, deviceKey, typeOfAction )
            ).then(function(result){
                clock.restore(); // 時間停止解除。

                assert( stub_wrapperStr.withArgs( deviceKey ).calledOnce );
                assert( stub_instance.calledOnce );
                var called_args = stub_instance.getCall(0).args;
                expect( called_args[0] ).to.equal(
                    "INSERT INTO activitylogs(created_at, type, owners_hash ) " 
                    + "VALUES('1970-01-01 09:00:00.000', " + typeOfAction + ", '" + deviceKey + "')"
                );
                expect( called_args[1].length ).to.equal( 0 );
                expect( result ).to.deep.equal({
                    "type_value" : typeOfAction,
                    "device_key" : deviceKey
                });
            });
            
        });
    });
    describe( "::deleteActivityLogWhereDeviceKey()",function(){
        it("正常系");
    });


    describe( "::addNewUser()",function(){
        var addNewUser = sql_parts.addNewUser;
        it("正常系");
    });
    describe( "::getNumberOfUsers()",function(){
        var getNumberOfUsers = sql_parts.getNumberOfUsers;
        it("正常系");
    });
    describe( "deleteExistUser()", function () {
       it("正常系"); 
    });


    describe( "::getShowObjectFromGetData()",function(){
        it("正常系");
    })
    describe( "::getInsertObjectFromPostData()", function(){
        it("正常系");
    });
});

