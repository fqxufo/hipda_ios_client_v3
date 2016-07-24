// ==UserScript==
// @name Test'Em'All
// @namespace http://tampermonkey.net/empty.html
// @version 0.1
// @description this does nothing but giving a good example
// @match http://tampermonkey.net/empty.html
// @grand GM_addStyle
// ==/UserScript==
// ================= helpers ==================
console.log("running at " + window.location.href);

function q(s){if(document.body){return document.body.querySelector(s);}return null;}
function xpath(s) {
	return document.evaluate(s, document, null, XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE, null);
}

// 外部编辑器木有GM_xxx的支持
try{
  if (!this.GM_getValue || this.GM_getValue.toString().indexOf("not supported")>-1) {
      this.GM_getValue=function (key,def) {
          return localStorage[key] || def;
      };
      this.GM_setValue=function (key,value) {
          return localStorage[key]=value;
      };
  }
}
catch(e){}

// ================= UI ==================

// hi-pda-tools-by-2200
function addConfigDiv() {
    // GM_addStyle('\
    //   #hp_blacklist_config_div {position:fixed;align:center;width: 303px;padding: 15px;bottom:20px;right:20px;z-index:99;color:#fff;background:#9287AE;border:2px solid #bfbfbf;-moz-border-radius:5px;opacity:0.95;text-align:left;font-size:14px !important;}\
    //   #hp_blacklist_config_div hr {color: #bfbfbf;border: 1px solid;margin: 8px 0;}\
    //   #hp_blacklist_config_div a {-moz-border-radius: 4px;background: #eef9eb;width: 50px;border: 1px solid #aaa;}\
    //   #hp_blacklist_config_div a:hover {border: 1px solid #aaa;background: #fff;color: #000;}\
    //   #hp_blacklist_sync_button,#hp_blacklist_sync_button {padding:2px 5px;}\
    //   #hp_blacklist_blacklist {margin-left:5px;max-height:600px;overflow:auto;}\
    // ');
    var hp_cfg = document.createElement("div");
    hp_cfg.id = "hp_blacklist_config_div";
    hp_cfg.style = "position:fixed;align:center;width: 303px;padding: 15px;top:20px;right:20px;z-index:99;color:#fff;background:#9287AE;border:2px solid #bfbfbf;-moz-border-radius:5px;opacity:0.95;text-align:left;font-size:14px !important;"
    //hp_cfg.style.display = "none";
    hp_cfg.innerHTML = '\
    	<a href="javascript:void(0)" id="hp_blacklist_close_button" style="position:fixed; top:25px; right:25px; color:white">关闭</a>\
        <div id="hp_blacklist_blacklist"></div><br /><br />\
        先登录iCloud才能同步\
        <div id="apple-sign-in-button"></div>\
        <div id="apple-sign-out-button"></div>\
        <button id="hp_blacklist_sync_button" style="height: 40px; width: 218px; cursor: pointer; border: 1px solid black; border-radius: 5px; display: block; opacity: 1; background-color: white; font-size:18px">同步</button>\
        <input id="hp_blacklist_username_input" type="text" value="name"/><br />\
        <button id="hp_blacklist_add_btn">add user</button>\
        <button id="hp_blacklist_remove_btn">remove user</button>\
        ';
    q('#header').insertBefore(hp_cfg, q('#header').firstChild);
   
    q('#hp_blacklist_sync_button').addEventListener('click', function(){
    	var b = q('#hp_blacklist_sync_button');
    	b.innerHTML = '同步中...';
    	console.log('sync...');
    	update(function(error) {
    		if (!error) {
				b.innerHTML = '同步成功';
    		} else {
    			b.innerHTML = '同步失败';
    		}
    		console.log('sync result: ', _list);
    	});
    }, false);
    q('#hp_blacklist_close_button').addEventListener('click', function(){
    	hp_cfg.style.display = 'none';
    }, false);

    q('#hp_blacklist_add_btn').addEventListener('click', function(){
    	addUser(q('#hp_blacklist_username_input').value);
    }, false);

    q('#hp_blacklist_remove_btn').addEventListener('click', function(){
    	removeUser(q('#hp_blacklist_username_input').value);
    }, false);

    if (1) {
    	q('#hp_blacklist_username_input').style.display = 'none';
    	q('#hp_blacklist_add_btn').style.display = 'none';
    	q('#hp_blacklist_remove_btn').style.display = 'none';
    }

    document.getElementById('umenu').appendChild(document.createTextNode(" | "));
    menuitem=document.createElement('a');
    menuitem.innerHTML="黑名单";
    menuitem.href='javascript:void(0)';
    document.getElementById('umenu').appendChild(menuitem);
    menuitem.addEventListener('click', function(){
    	hp_cfg.style.display = hp_cfg.style.display === 'none' ? '' : 'none';
    }, false);
    hp_cfg.style.display = 'none';
}
addConfigDiv();

// hi-pda-tools-by-2200
function appendControl(){     // 添加[屏蔽]按钮
  var s = xpath("//div[@class='authorinfo']");

  for (var i = s.snapshotLength - 1; i >= 0; i--) {
    var t = s.snapshotItem(i);
      
    var a1=document.createElement('a');
    a1.innerHTML = '屏蔽';
    a1.href = '###';
 	a1.addEventListener('click', onBlockUser, false);
    t.appendChild(document.createTextNode(" | "));
    t.appendChild(a1);
  }
};
appendControl();

function updateUI() {
	updateBlockListUI();
	removeBlockedPost();
}

function updateBlockListUI() {
	var dom = q('#hp_blacklist_blacklist');
	var list = [];
	for (var i = 0; i < _list.length; i++) {
		var username = _list[i];
		list.push('<span class="hp_blacklist_username">' + username + '</span>&nbsp&nbsp<button username="'+username+'">x</button>');
	}
	dom.innerHTML = list.join('\n<br />');
	var buttons = dom.getElementsByTagName('button');
	for (var i = 0; i < buttons.length; i++) {
		var b = buttons[i];
		var u = b.getAttribute('username');
		(function(username){
			b.addEventListener('click', function(){
				removeUser(username);
			}, false);
		})(u)
	}
}

// hi-pda-tools-by-2200
function removeBlockedPost() {
    if (location.href.indexOf('viewthread.php') !== -1) {
        var s = xpath("//div[@class='postinfo']");
        for (var i = s.snapshotLength - 1; i >= 0; i--) {
            var t = s.snapshotItem(i);
            var a = t.getElementsByTagName('a')[0];
            if( a != undefined){
            	t.parentNode.parentNode.parentNode.parentNode.style.display = isUserInBlockList(a.text) ? 'none' : '';
            }
        }
    }
    if (location.href.indexOf('forumdisplay.php') !== -1) {
        var s = xpath("//td[@class='author']");
        console.log(s.snapshotLength);
        for (var i = s.snapshotLength - 1; i >= 0; i--) { // 屏蔽BLACK_LIST的发帖
            var t = s.snapshotItem(i);
            var a = t.getElementsByTagName('a')[0];
            if( a != undefined){
            	t.parentNode.style.display = isUserInBlockList(a.text) ? 'none' : '';
            }
        }
    }
}

// hi-pda-tools-by-2200
function onBlockUser(e){      // [屏蔽] 按钮触发
    var node = e.target.parentNode.parentNode.parentNode.parentNode.parentNode.getElementsByClassName('postinfo')[0].getElementsByTagName('a')[0];
    var username = node.text;
    addUser(username);
};

// ================= icloud auth ==================

window.addEventListener('cloudkitloaded', function() {
	CloudKit.configure({
		locale: 'zh-cn',
		containers: [{
			containerIdentifier: 'iCloud.wujichao.HiPDA',
			apiTokenAuth: {
				apiToken: 'a85b21e1fe1f4ad1c7f01bdff3b13a71005e410ed64c6471dad9a0512668e731',
				persist: true,
				signInButton: {
					id: 'apple-sign-in-button',
					theme: 'white-with-outline' // 'black', 'white', 'white-with-outline'
				},
				signOutButton: {
					id: 'apple-sign-out-button',
					theme: 'white-with-outline' // 'black', 'white', 'white-with-outline'
				}
			},
			environment: 'development'
		}]
	});

	demoSetUpAuth();
	init();
	console.log('config', _list);
	// console.log('test update');
	// update(function(error) {
	// 	console.log('update result: ', _list);
	// });
	//test();
});

function displayUserName(name) {
	console.log(name);
}

function showDialogForPersistError(err) {
	console.warn(err);
}

function demoSetUpAuth() {

  // Get the container.
  var container = CloudKit.getDefaultContainer();

  function gotoAuthenticatedState(userIdentity) {
    var name = userIdentity.nameComponents;
    if(name) {
      displayUserName(name.givenName + ' ' + name.familyName);
    } else {
      displayUserName('User record name: ' + userIdentity.userRecordName);
    }
    container
      .whenUserSignsOut()
      .then(gotoUnauthenticatedState);
  }
  function gotoUnauthenticatedState(error) {

    if(error && error.ckErrorCode === 'AUTH_PERSIST_ERROR') {
      showDialogForPersistError();
    }

    displayUserName('Unauthenticated User');
    container
      .whenUserSignsIn()
      .then(gotoAuthenticatedState)
      .catch(gotoUnauthenticatedState);
  }

  // Check a user is signed in and render the appropriate button.
  return container.setUpAuth()
    .then(function(userIdentity) {

      // Either a sign-in or a sign-out button was added to the DOM.

      // userIdentity is the signed-in user or null.
      if(userIdentity) {
        gotoAuthenticatedState(userIdentity);
      } else {
        gotoUnauthenticatedState();
      }
    });
}

// ================= blocklist service ================

var recordName = 'blocklist';
var _list = [];
var _hashTable = {};


function init() {
	rebuildWithList(getSavedList());
	migrateOldData();
	updateUI();
}
function rebuildWithList(list) {
	//console.log('rebuildWithList_with', list);
	_list = list;
	_hashTable = {};
	for (var i = 0; i < list.length; i++) {
		_hashTable[list[i]] = true;
	}
	//console.log('rebuildWithList_result', _list, _hashTable);
}

function rebuildWithRecord(record) {
	list = record.fields['list'] ? record.fields['list'].value : [];
	rebuildWithList(list);
}

function update(callback) {
	fetchRecord(function(record, error) {
		if (!error) {
			rebuildWithRecord(record);
			saveAll();
			updateUI();
		}
		callback(error);
	});
}

// ================= icloud database ==================

function fetchRecord(callback) {
	console.log('fetchRecord...');

	var container = CloudKit.getDefaultContainer();
	var privateDatabase = container.privateCloudDatabase;
	privateDatabase.fetchRecords(recordName).then(function(response) {
		var error = response.hasErrors ? response.errors[0] : null;
		var fetchedRecord = error ? null : response.records[0];
		console.log('fetchRecord result', error, fetchedRecord);

		if (error && error.ckErrorCode === "NOT_FOUND") {
			var record = {
				recordName: recordName,
				recordType: 'BlockList',
			};
			saveRecord(record, function(savedRecord, error) {
				callback(saveRecord, error);
			});
			return;
		}

		callback(fetchedRecord, error);
	});
}

function saveRecord(record, callback) {
	console.log('saveRecord...', record);

	var container = CloudKit.getDefaultContainer();
	var privateDatabase = container.privateCloudDatabase;

	privateDatabase.saveRecords(record).then(function(response) {
		var error = response.hasErrors ? response.errors[0] : null;
		var savedRecord = error ? null : response.records[0];
		console.log('saveRecord result', error, savedRecord);
		callback(savedRecord, error);
	});
}

function updateList(action) {
	console.log('updateList');

	// update local data
	console.log('update local data');
	action();
	saveAll();

	// update ui
	updateUI();
    
    //fetch latest data
    console.log('fetch latest data');
    fetchRecord(function(record, error) {
		if (!error) {
			rebuildWithRecord(record);

			action();
			saveAll();

			// update ui
			updateUI();

			record.fields['list'] = {value: _list};
			//console.log('fetch latest result', record);
			saveRecord(record, function(savedRecord, error) {
				//console.log('saveRecord result', record);
			});
		}
	});
}

// ================= blacklist ==================
function isUserInBlockList(username) {
	var a = _hashTable[username];
	return !!a;
}

function addUser(username) {
	addUsers([username]);
}
function removeUser(username) {
	removeUsers([username]);
}

function addUsers(usernames) {
	console.log('addUsers', usernames);
	updateList(function() {
		for (var i = 0; i < usernames.length; i++) {
			var username = usernames[i];
			if (isUserInBlockList(username)) {
				continue;
			}
			_list.push(username);
			_hashTable[username] = true;
		}
	});
}

function removeUsers(usernames) {
	console.log('removeUsers', usernames);
	updateList(function() {
		for (var i = 0; i < usernames.length; i++) {
			var username = usernames[i];
			if (!username) {
				throw new Error();
			}

			if (!isUserInBlockList(username)) {
				continue;
			}
			var index = _list.indexOf(username);
			if (index > -1) {
				_list.splice(index, 1);
			} else {
				throw new Error();
			}
			_hashTable[username] = false;
		}
	});
}


// ================= persistence ==================

function saveAll() {
	console.log('saveAll');
	saveList(_list);
}

function getSavedList() {
	var value = GM_getValue('HPSavedList_V2') || '';
	return value.split(',');
}

function saveList(list) {
	GM_setValue('HPSavedList_V2', list);
}

// ================= migrate ==================
function migrateOldData() {

}

// ================= test ==================
function assert(v1, v2) {
	if (v1 !== v2) {
		throw new Error();
	}
}

function test() {
	// console.log('test update');
	// update(function(error) {
	// 	console.log('update result: ', _list);
	// });

	console.log('test current config');
	console.log(_list);
	console.log(_hashTable);

	console.log('test add user');
	addUser('test_a');
	assert(isUserInBlockList('test_a'), true);
	assert(isUserInBlockList('test_b'), false);

	console.log('test add users');
	addUsers(['test_a', 'test_a', 'test_b', 'test_c', 'test_d']);
	assert(isUserInBlockList('test_a'), true);
	assert(isUserInBlockList('test_b'), true);
	assert(isUserInBlockList('test_c'), true);
	assert(isUserInBlockList('test_d'), true);

	console.log('log current config');
	console.log(_list);
	console.log(_hashTable);

	console.log('test remove user');
	removeUser('......');
	removeUser('test_a');
	assert(isUserInBlockList('test_a'), false);
	console.log('test remove users');
	removeUsers(['test_a', 'test_b', 'test_c']);
	assert(isUserInBlockList('test_a'), false);
	assert(isUserInBlockList('test_b'), false);
	assert(isUserInBlockList('test_c'), false);
	assert(isUserInBlockList('test_d'), true);

	console.log('log current config');
	console.log(_list);
	console.log(_hashTable);
}
