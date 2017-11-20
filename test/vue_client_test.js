/*
    [vue_promise_test.js]
    encoding=utf-8
*/

var chai = require("chai");
var expect = chai.expect;
var sinon = require("sinon");
var promiseTestHelper = require("promise-test-helper");
var shouldFulfilled = promiseTestHelper.shouldFulfilled;
var target = require("../src/public/javascripts/vue_client.js");


describe("TEST for vue_client.js", function(){
    this.timeout( 5000 );
    var stub_vue, stub_static_vue, stub_axios;
	var original;
	beforeEach(()=>{ // フック前の関数を保持する。
		original = { 
        };

        stub_vue = sinon.stub();
        stub_static_vue = {
            "component" : sinon.stub()
        };
        stub_axios = sinon.stub();
        // axiosInstance.get(url).then();
	});
	afterEach(()=>{ // フックした（かもしれない）関数を、元に戻す。
        // target.set.data_manager = original.data_manager;
	});

    describe("::setVueComponentGrid()",function(){
        it('construct', function(){
            var setVueComponentGrid = target.setVueComponentGrid( stub_static_vue );

console.log( stub_static_vue.component.getCall(0).args[0] );
console.log( stub_static_vue.component.getCall(0).args[1] );
        });
    });
    describe("::vueAppGrid()",function(){
        it('construct', function(){
            var vueAppGrid = target.vueAppGrid( stub_vue );

            expect( stub_vue.getCall(0).args[0] ).to.be.exist;
            // ToDo: 2回以上呼ばれる場合、区別せずにチェックする方法なかったっけ？
console.log( stub_vue.getCall(0).args[0] );
        });

    });
    describe("::promiseCreateAccount()",function(){
        it('正常系', function(){
            var stub_axios = {
                "get" : sinon.stub(),
                "post" : sinon.stub()
            };
            var mailAddress = "hogehoge";
            var promiseCreateAccount = target.promiseCreateAccount;
            target.client_lib.axios = stub_axios;
            
            var promise = promiseCreateAccount( mailAddress );
            return shouldFulfilled(
                promise
            ).then(function(result){
                expect(result).to.equal( stub_axios );
            });
        });
    });
});



