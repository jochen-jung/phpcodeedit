var codeEditor = [];
var tabFiles = [];
var titles = [];
var fileTypes = [];
var searchVals = [];
var formVals = [];

var showLineNumbers = true;
var disableSpellcheck = true;
var autoMatchParens = true;
var tabMode = "shift"; // or "spaces" "indent", "default", "shift"
var filesOpen = 1;

var uploadwin = false;
var searchwin = false;
var ftpwin = false;
var win = false;
var loremIpsumWin = false;
var suggestMode = false;

var tb = null;
var tabs = null;
var viewport = null;
var tree = null;
var tree_ftp = null;

/* General functions */

function getScrollWidth() {
  var w = window.pageXOffset || document.body.scrollLeft || document.documentElement.scrollLeft;
  return w ? w : 0;
}
function getScrollHeight() {
  var h = window.pageYOffset || document.body.scrollTop || document.documentElement.scrollTop;
  return h ? h : 0;
}

function insertCode(code) {
  // var actTab = tabs.getActiveTab().id.substr(3, 3);
  // obj = codeEditor[actTab].cursorPosition();
  // codeEditor[actTab].insertIntoLine(codeEditor[actTab].cursorLine(), obj.character, code);

  var actTab = tabs.getActiveTab().id.substr(3, 3);
  obj = codeEditor[actTab].getCursor();

  var line = codeEditor[actTab].getLine(obj.line);
  var output = [line.slice(0, obj.ch), code, line.slice(obj.ch)].join('');

  codeEditor[actTab].setLine(obj.line, output);
}

function post(URL, PARAMS, new_win, method) {
  var temp=document.createElement("form");
  temp.action=URL;
  if (method == 'GET') temp.method="GET";
  else temp.method="POST";
  if (new_win) temp.target="_blank";
  temp.style.display="none";
  for(var x in PARAMS) {
    var opt=document.createElement("textarea");
    opt.name=x;
    opt.value=PARAMS[x];
    temp.appendChild(opt);
  }
  document.body.appendChild(temp);
  temp.submit();
  return temp;
}

function include(file, id) {
  if (Ext.get(id) == null) {
    var scr = document.createElement('script');
    scr.id = id;
    scr.type = 'text/javascript';
    scr.src = file;
    scr.async = true;
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(scr, s);

    Ext.get(id).on('load', function() {
      viewport.addEvents(id +'Included', viewport);
      viewport.fireEvent(id +'Included', viewport);
    });
  } else viewport.fireEvent(id +'Included', viewport);
}

/* Helper functions */

function ReloadSubTree(oldfile, newfile) {
  var oldpath = oldfile;
  if (oldfile.lastIndexOf('/') > 0) oldpath = oldfile.substr(0, oldfile.lastIndexOf('/'));
  if (tree.getNodeById(oldpath) && tree.getNodeById(oldpath) != 'undefined') tree.getNodeById(oldpath).reload();
  else if (tree_ftp.getNodeById(oldpath) && tree_ftp.getNodeById(oldpath) != 'undefined') tree_ftp.getNodeById(oldpath).reload();
  if (newfile != '') {
    var newpath = newfile;
    if (newfile.lastIndexOf('/') > 0) newpath = newfile.substr(0, newfile.lastIndexOf('/'));
    if (tree.getNodeById(newpath) && tree.getNodeById(newpath) != 'undefined') tree.getNodeById(newpath).reload();
    else if (tree_ftp.getNodeById(newpath) && tree_ftp.getNodeById(newpath) != 'undefined') tree_ftp.getNodeById(newpath).reload();
  }
}

function RenameRequest(oldfile, newfile) {
  Ext.Ajax.request({
    url : 'ajax.php' ,
    params : { a: 'renameFile', oldfile: oldfile, newfile: newfile},
    method: 'POST',
    success: function (result, request) {
      var r = Ext.util.JSON.decode(result.responseText);
      if (r.success) {
        if (r.newfile) {
          if (tree.getNodeById(oldfile) && tree.getNodeById(oldfile) != 'undefined') tree.getNodeById(oldfile).id = r.newfile;
          else if (tree_ftp.getNodeById(oldfile) && tree_ftp.getNodeById(oldfile) != 'undefined') tree_ftp.getNodeById(oldfile).id = r.newfile;
          else Ext.MessageBox.alert('Move warning', 'Lost element name. Please save all files and reload editor');
          ReloadSubTree(oldfile, newfile);
        }
        // Ext.MessageBox.alert('Moved file'+ oldfile +' -> '+ newfile +'('+ r.newfile +')', r.msg);
      } else {
        ReloadSubTree(oldfile, newfile);
        Ext.MessageBox.alert('Failed moving file', oldfile +' -> '+ newfile +'<br>'+ r.msg);
      }
    },
    failure: function (result, request) {
      ReloadSubTree(oldfile, newfile);
      var r = Ext.util.JSON.decode(result.responseText);
      Ext.MessageBox.alert('Failed moving file', oldfile +' -> '+ newfile +'<br>'+ r.msg);
    }
  });
}

function getHashCode(fp) {
  if (fp.getForm().isValid()){
    fp.getForm().submit({
      url: 'hash.php',
      waitMsg: 'Generating hash...',
      success: function(form, action) {
        form.findField('hash').setValue(action.result.hash);
      },
      failure: function (form, action) {
        Ext.Msg.alert('Failed loading hash', action.result.msg);
      }
    });
  }
}

/* Load editor */

function codeSuggest() {
  var actTab = parseInt(tabs.getActiveTab().id.substr(3, 3), 10);
  if (fileTypes[actTab] == 'php' || fileTypes[actTab] == 'css') {
    var obj = codeEditor[actTab].getCursor();
    var cur_line = codeEditor[actTab].getLine(obj.line);
    var till_cursor = cur_line.substr(0, obj.ch);
    for (var i = till_cursor.length - 1; i >= 0; i--) {
      var cur_char = till_cursor[i];
      if (cur_char.search(/(\W)/) != -1) { // \W = [^a-zA-Z0-9_]
        break;
      }
    }
    if (till_cursor.length >= 0) i++;
    till_cursor = till_cursor.substr(i, obj.ch);
    var suggestBox = Ext.getDom('suggestBox');

    //var h = Ext.getDom('center').pageYOffset || Ext.getDom('center').scrollTop
    if (till_cursor.length >= 2) {
      suggestBox.style.display = 'block';
      suggestBox.style.top = (34 + codeEditor[actTab].getLine(obj.line) * 16) + 'px';
      suggestBox.style.left = (40 + i * 8) + 'px';

      var suggestInput = Ext.getDom('suggestInput');
      suggestInput.value = till_cursor;

      var suggestList = Ext.getDom('suggestList');
      Ext.Ajax.request({
        url: 'ajax.php' ,
        params: { a: 'getCommands', lang: fileTypes[actTab], search: till_cursor },
        method: 'GET',
        success: function (result, request) {
          var r = Ext.util.JSON.decode(result.responseText);
          var out = '';
          Ext.each(r.items, function(item) {
            out += '<div class="suggestItem"><span class="suggestItemSearched">'+ till_cursor +'</span><span class="suggestItemSuggested">'+ item.name +'</span></div>';
          });
          suggestList.innerHTML = out;
          var items = Ext.get(Ext.query(".suggestItem"));
          Ext.each(items, function(item) {
            item.on('click', function() {
              var codeBlock = Ext.query(".suggestItemSuggested", this);
              var code = codeBlock[0].innerText;
              insertCode(code);
              suggestBox.style.display = 'none';
              codeEditor[actTab].focus();
              codeEditor[actTab].setSelection(obj.line, obj.character + code.length);
            });
          });
        },
        failure: function ( result, request) {
          // Ext.MessageBox.alert('Failed opening file', result.responseText);
        }
      });

    } else suggestBox.style.display = 'none';
  }
}

function onCodeChange(cursor) {
  // Old. Now ctl + Space
}

function addCodeToTab(filesOpen, code) {
  var parserfile = '';
  var stylesheet = '';
  var codemirrorMode = 'application/x-httpd-php';
  switch (fileTypes[filesOpen]) {
    case 'htm':
    case 'html':
      codemirrorMode = 'text/html';
    break;
    case 'js':
      codemirrorMode = 'javascript';
    break;
    case 'css':
      codemirrorMode = 'text/css';
    break;
    case 'xml':
      codemirrorMode = 'xml';
    break;
    case 'sql':
      codemirrorMode = 'sql';
    break;
    case 'py':
      codemirrorMode = 'python';
    break;
    case 'php':
    default:
      codemirrorMode: 'application/x-httpd-php';
      //codemirrorMode: 'application/x-httpd-php';
      //parserfile = ["parsexml.js", "parsecss.js", "tokenizejavascript.js", "parsejavascript.js", "../contrib/php/js/tokenizephp.js", "../contrib/php/js/parsephp.js",
      //  "../contrib/php/js/parsephphtmlmixed.js"];
      //stylesheet = ["codemirror/css/xmlcolors.css", "codemirror/css/jscolors.css", "codemirror/css/csscolors.css", "codemirror/contrib/php/css/phpcolors.css"];
    break;
  }

  var elem = 'inputfield' + filesOpen;
  //document.getElementById(elem).innerText = code;
  codeEditor[filesOpen] = new CodeMirror.fromTextArea(document.getElementById(elem), {
    mode: codemirrorMode, /*{name: codemirrorMode, json: true},*/
    undoDepth: 50,
    lineWrapping: true,
    lineNumbers: showLineNumbers,
    /*cursorActivity: onCodeChange,*/
    indentUnit: 2,
    extraKeys: {
      "Ctrl-F": function(instance) { searchClick(''); },
      "Ctrl-Space": function(instance) { suggestMode = true; codeSuggest(); return false; },
      "Ctrl-Esc": function(instance) { suggestBox.style.display = 'none'; suggestMode = false; },
      "Ctrl-F3": function(instance) { findClick(''); }
    }


/*
    setValue: code,
    parserfile: parserfile,
    stylesheet: stylesheet,
    path: "codemirror/lib/",
    continuousScanning: 500,
    undoDelay: 800,
    disableSpellcheck: disableSpellcheck,
    textWrapping: true,
    readOnly: false,
    dumbTabs: false,
    tabMode: tabMode,
    autoMatchParens: autoMatchParens,
    basefiles: ['prod_base_c21cb4dde2c20e8f098b71afff0368db.js'],
    iframeClass: null,
    passDelay: 200,
    passTime: 50,
    parserConfig: null,
    reindentOnLoad: false,
    activeTokens: null,
    saveFunction: saveClick,
    onChange: null
*/
  });
  codeEditor[filesOpen].setValue(code);

  CodeMirror.commands.save = saveClick;

  tb.items.get('insert').enable();
  tb.items.get('search').enable();
  tb.items.get('save').enable();
}


/* Add tabs / Load files to editor */

function addTab(title) {
  var fo = addTabDo('');
  tabFiles[fo] = '';
  addCodeToTab(fo, '');
}

function addTabDo(title) {
  if (title == '') { title = 'New File'; }
  filesOpen++;
  titles[filesOpen] = title;
  fileTypes[filesOpen] = title.substr(title.lastIndexOf('.') + 1, 5);
  var tab = tabs.add({
    title: title,
    iconCls: '',
    html: '<form style="width:100%; height:100%"><div style="border: 1px solid black; padding: 3px; background-color: #F8F8F8; width:100%; height:100%">' +
      '<textarea id="inputfield' + filesOpen + '"></textarea></div></form>',
    id: 'tab'+ filesOpen,
    closable:true
  }).show();
  tab.on("beforeclose", function (tabItem, e){
    var thisTab = parseInt(tabItem.id.substr(3, 3), 10);
    codeEditor[thisTab] = null;
  });
  return filesOpen;
}

function openCodeFile(fo, path) {
  Ext.Ajax.request({
    url : 'get-file.php' ,
    params : { path : path },
    method: 'GET',
    success: function ( result, request ) {
      addCodeToTab(fo, result.responseText);
      tabFiles[fo] = path;
    },
    failure: function ( result, request) {
      Ext.MessageBox.alert('Failed opening file', result.responseText);
    }
  });
}

function openFTPCodeFile(fo, path) {
  Ext.Ajax.request({
    url : 'ftp-get-file.php' ,
    params : { path : path },
    method: 'GET',
    success: function ( result, request ) {
      addCodeToTab(fo, result.responseText);
      tabFiles[fo] = path;
    },
    failure: function ( result, request) {
      Ext.MessageBox.alert('Failed opening file', result.responseText);
    }
  });
}


/* Click handler */

function searchClick(btn){
  if (!searchwin) {
    searchwin = new Ext.Window({
      applyTo:'searchBox', layout:'fit', width:600, autoHeight: true, title: 'Search', closeAction:'hide', plain: true,
      items: fp = new Ext.FormPanel({
        width: 500, frame: false, autoHeight: true, bodyStyle: 'padding: 10px 10px 0 10px;', labelWidth: 50, defaultType: 'textfield',
        defaults: { anchor: '95%', allowBlank: false, msgTarget: 'side' },
        listeners:{
          "render":function() {
            var map = new Ext.KeyMap(this.id, {
              key: Ext.EventObject.ENTER,
              fn: function() {
                if (this.getForm().isValid()) {
                  searchVals = this.getForm().getFieldValues();
                  findClick('');
                  searchwin.hide();
                }
              },
              scope: this
            });
          }
        },
        items: [
          { fieldLabel: 'Search', name: 'search', xtype: 'textfield', allowBlank: false/*,
            onViewClick: function() {
              Ext.form.TextField.prototype.onViewClick.apply(this, arguments);
              this.focus();
            }*/
          },
          { fieldLabel: 'Replace', name: 'replace', xtype: 'textfield', allowBlank: true },
          { fieldLabel: '', name: 'fromstart', xtype: 'checkbox', boxLabel: 'Search from start of document' },
          { fieldLabel: '', name: 'casesensitive', xtype: 'checkbox', boxLabel: 'Case Sensitive' }
        ]
      }),
      buttons: [{
        text: 'Search',
        handler: function(){
          // if(fp.getForm().isValid()){
            searchVals = fp.getForm().getFieldValues();
            findClick('');
            searchwin.hide();
          // }
        }
      },{
        text: 'Cancel',
        handler: function(){
          searchwin.hide();
        }
      }]
    });
  }
  searchwin.show(this);
  searchwin.getComponent(0).getForm().findField('search').focus(true, true);
}

function findClick(btn) {
  if (searchVals.search) {
    var actTab = parseInt(tabs.getActiveTab().id.substr(3, 3), 10);
    var startPos = null;
    if (!searchVals.fromstart) startPos = codeEditor[actTab].getCursor();
    var obj = codeEditor[actTab].getSearchCursor(searchVals.search, startPos, !searchVals.casesensitive);
    if (obj.findNext()) {
      if (searchVals.replace) { obj.replace(searchVals.replace); }
      else { codeEditor[actTab].setSelection(obj.from(), obj.to()); }
      searchVals.fromstart = false;
    } else { Ext.Msg.alert('Search', 'Could not find "' + searchVals.search +'"'); }
  } else { Ext.Msg.alert('Search', 'No search string given.<br>Use "Search / Replace" first'); }
  codeEditor[actTab].focus();
}

function wikiClick(btn) {
  window.open("http://code.google.com/p/phpcodeedit/w/list", "_blank", "");
}

function bugreportClick(btn) {
  window.open("http://code.google.com/p/phpcodeedit/issues/list", "_blank", "");
}

function validateHTMLClick(btn) {
  var actTab = parseInt(tabs.getActiveTab().id.substr(3, 3), 10);
  post('http://validator.w3.org/check', {
    fragment: codeEditor[actTab].getValue()
  }, true, '');
}

function validateCSSClick(btn) {
  var actTab = parseInt(tabs.getActiveTab().id.substr(3, 3), 10);
  post('http://jigsaw.w3.org/css-validator/validator', {
    text: codeEditor[actTab].getValue()
  }, true, 'GET');
}

function validateJSClick(btn) {
  var actTab = parseInt(tabs.getActiveTab().id.substr(3, 3), 10);
  // Alternative: http://jslint.com
  post('http://www.javascriptlint.com/online_lint.php', {
    script: codeEditor[actTab].getValue()
  }, true, '');
}

function minimizeJSClick(btn) {
  var actTab = parseInt(tabs.getActiveTab().id.substr(3, 3), 10);
  post('http://closure-compiler.appspot.com/compile', {
    compilation_level: 'WHITESPACE_ONLY',
    output_format: 'text',
    output_info: 'compiled_code',
    js_code: codeEditor[actTab].getValue()
  }, true, '');

/*
  Ext.Ajax.request({
    url : 'http://closure-compiler.appspot.com/compile',
    params : { compilation_level: 'WHITESPACE_ONLY', output_format: 'text', output_info: 'compiled_code', js_code: codeEditor[actTab].getValue() },
    method: 'POST',
    success: function (result, request) {
      var title = tabFiles[actTab] + '_min';
      //.substr(id.lastIndexOf('/') + 1, id.length);
      var fo = addTabDo(title);
      addCodeToTab(fo, result.responseText);
      tabFiles[fo] = path;
    },
    failure: function (result, request) {
      Ext.MessageBox.alert('Failure', 'Could not load closure compiler. '+ result.responseText);
    }
  });
*/
}

function logoutClick(btn){
  document.location.href = "index.php?a=logout";
}

function LoremIpsumClick(btn) {
  if (!loremIpsumWin) {
    loremIpsumWin = new Ext.Window({
      id: 'LIWin',
      applyTo: 'liwinBox',
      layout: 'fit',
      width: 400,
      autoHeight: true,
      closeAction: 'hide',
      plain: true,
      title: 'Lorem ipsum generator',
      items: fp = new Ext.FormPanel({
        labelWidth: 175,
        frame: false,
        title: '',
        bodyStyle: 'padding:5px 5px 0',
        width: 350,
        defaults: {width: 230},
        autoHeight: true,
        defaultType: 'textfield',
        items: [
          { fieldLabel: 'Min Words per Sentence', xtype: 'numberfield', name: 'min_wps', value: 10, allowBlank: false },
          { fieldLabel: 'Max Words per Sentence', xtype: 'numberfield', name: 'max_wps', value: 25, allowBlank: false },
          { fieldLabel: 'Number of Sentence', xtype: 'numberfield', name: 'sentences', value: 10, allowBlank: false }
        ],
        buttons: [{
          text: 'Generate',
          handler: function(){
            if(fp.getForm().isValid()){
              include('loremipsum.js', 'loremIpsumScript');
              viewport.on('loremIpsumScriptIncluded', function() {
                LoremIpsum.min_wps = fp.getForm().findField('min_wps').getValue();
                LoremIpsum.max_wps = fp.getForm().findField('max_wps').getValue();
                var ipsum = LoremIpsum.sentences(fp.getForm().findField('sentences').getValue());
                //var ipsum = LoremIpsum.words(10);
                insertCode(ipsum);
                loremIpsumWin.hide();
              });
            }
          }
        },{
          text: 'Cancel',
          handler: function(){
            loremIpsumWin.hide();
          }
        }]
      })
    });
  }
  loremIpsumWin.show(this);
}

function aboutClick(btn) {
  Ext.Msg.alert('About PHP Code Editor', 'PHP Code Editor is developed  by Jochen Jung' +
    '<br><br><br>Special thanks to:' +
    '<br><br><a href="http://www.smarty.net/" target="_blank">Smarty</a> (PHP Template Engine)' +
    '<br><a href="http://www.extjs.com/" target="_blank">ExtJS</a> (JavaScript Framework)' +
    '<br><a href="http://codemirror.net/" target="_blank">Codemirror</a> (JavaScript Code Highlighter)' +
    '<br><a href="http://www.famfamfam.com/" target="_blank">Famfamfam</a> (Iconset)'
    );
}

function contactUsClick(btn) {
  Ext.Msg.alert('Contact us',
    '<iframe src="https://spreadsheets.google.com/embeddedform?formkey=dEM3UnNxNlBGV29yN0NTaGtfclgzQkE6MQ" width="460" height="458" frameborder="0" marginheight="0" marginwidth="0">Loading...</iframe>'
  );
}

function resetPWClick(email) {
  Ext.Ajax.request({
    url : 'ajax.php' ,
    params : { a: 'resetPW', email: email },
    method: 'POST',
    success: function(result, request) {
      var r = Ext.util.JSON.decode(result.responseText);
      Ext.MessageBox.alert('Success', r.msg);
      ReloadSubTree(r.path, '');
    },
    failure: function (result, request) {
      var r = Ext.util.JSON.decode(result.responseText);
      Ext.MessageBox.alert('Failure', r.msg);
    }
  });
}

function spacesAsTabsClick(item, checked) {
  if (checked) { tabMode = "shift"; }
  else { tabMode = "default"; }
  for (var k = 2; k < codeEditor.length; k++) {
    if (codeEditor[k] !== null) { codeEditor[k].setTabMode(tabMode); }
  }
}

function enableSpellcheckClick(item, checked) {
  disableSpellcheck = !checked;
  for (var k = 2; k < codeEditor.length; k++) {
    if (codeEditor[k] !== null) { codeEditor[k].setSpellcheck(!checked); }
  }
}

function autoMatchParensesClick(item, checked) {
  autoMatchParens = checked;
  Ext.MessageBox.alert('Changes will take effekt with the next file you open', '');
  /*for (var k = 2; k < codeEditor.length; k++) {
    if (codeEditor[k] !== null) { codeEditor[k].setLineNumbers(checked); }
  }*/
}

function showLineNumbersClick(item, checked) {
  showLineNumbers = checked;
  for (var k = 2; k < codeEditor.length; k++) {
    if (codeEditor[k] !== null) { codeEditor[k].setLineNumbers(checked); }
  }
}

function downloadClick(btn){
  var actTab = parseInt(tabs.getActiveTab().id.substr(3, 3), 10);
  if (isNaN(actTab) || actTab <= 1) {
    Ext.MessageBox.alert('No Tab selected', 'There is no current code tab selected.');
  } else {
    var fileName = tabs.getActiveTab().title;
    if (fileName == 'New File') {
      fileName = prompt("Enter file name:", 'new_file.txt');
    }
    if (fileName) {
      post('download-file.php', {
        path: fileName,
        code: codeEditor[actTab].getValue()
      }, false, '');
    }
  }
}

function openFileClick(btn, event, id) {
  //id = btn.id.substr(17, btn.id.length);
  var title = id.substr(id.lastIndexOf('/') + 1, id.length);
  var fo = addTabDo(title);
  openCodeFile(fo, id);
}

function renameFileClick(btn, event, oldfile) {
  var newfile = false;
  if (oldfile.indexOf(':') > -1) {
    var oldname = oldfile.substr(oldfile.indexOf(':') + 1, oldfile.length);
    var oldid = oldfile.substr(0, oldfile.indexOf(':'));
    newfile = oldid +':'+ prompt("New file name", oldname);
  } else newfile = prompt("New file name", oldfile);
  if (newfile) RenameRequest(oldfile, newfile);
}

function deleteFileClick(btn, event, path) {
  Ext.Ajax.request({
    url : 'ajax.php' ,
    params : { a: 'deleteFile', path: path },
    method: 'POST',
    success: function(result, request) {
      var r = Ext.util.JSON.decode(result.responseText);
      Ext.MessageBox.alert('Success', r.msg);
      ReloadSubTree(r.path, '');
    },
    failure: function (result, request) {
      var r = Ext.util.JSON.decode(result.responseText);
      Ext.MessageBox.alert('Failure', r.msg);
    }
  });
}

function deleteFTPFileClick(btn, event, path) {
  Ext.Ajax.request({
    url : 'ajax.php' ,
    params : { a: 'deleteFTPFile', path: path },
    method: 'POST',
    success: function(result, request) {
      var r = Ext.util.JSON.decode(result.responseText);
      Ext.MessageBox.alert('Success', r.msg);
      ReloadSubTree(r.path, '');
    },
    failure: function (result, request) {
      var r = Ext.util.JSON.decode(result.responseText);
      Ext.MessageBox.alert('Failure', r.msg);
    }
  });
}

function todoClick(btn){
  Ext.MessageBox.alert('This feature is not implemented, yet', 'Please be patient...');
}

function deleteFTPClick(btn, event, id) {
  Ext.Ajax.request({
    url : 'ajax.php' ,
    params : { a: 'deleteFTPServer', id: id },
    method: 'GET',
    success: function(result, request) {
      var r = Ext.util.JSON.decode(result.responseText);
      Ext.MessageBox.alert('Success', r.msg);
      tree_ftp.getRootNode().reload();
    },
    failure: function (result, request) {
      var r = Ext.util.JSON.decode(result.responseText);
      Ext.MessageBox.alert('Failure', r.msg);
    }
  });
}

function addFTPClick(btn, event, id) {
  var fp = null;
  if(!ftpwin) {
    ftpwin = new Ext.Window({
      id: 'FTPWin',
      applyTo: 'ftpwinBox',
      layout: 'fit',
      width: 400,
      autoHeight: true,
      closeAction: 'hide',
      plain: true,
      title: ' ',
      items: fp = new Ext.FormPanel({
        labelWidth: 75,
        frame: false,
        title: '',
        bodyStyle: 'padding:5px 5px 0',
        width: 350,
        defaults: {width: 230},
        autoHeight: true,
        defaultType: 'textfield',
        items: [
          { xtype: 'hidden', fieldLabel: 'ID', name: 'ftp_id', allowBlank: false },
          { fieldLabel: 'Server', name: 'ftp_server', allowBlank: false },
          { fieldLabel: 'Username', name: 'ftp_user', allowBlank: false },
          { inputType: 'password', fieldLabel: 'Password', name: 'ftp_password', allowBlank: false }
        ],
        buttons: [{
          text: 'Save',
          handler: function(){
            if(fp.getForm().isValid()){
              fp.getForm().submit({
                url: 'ajax.php',
                waitMsg: 'Processing...',
                params: { a : 'saveFTPServer'},
                success: function(fp, action){
                  Ext.MessageBox.alert('Success', action.result.msg);
                  tree_ftp.getRootNode().reload();
                  ftpwin.hide();
                },
                failure: function (fp, action) {
                  Ext.MessageBox.alert('Failure', 'Error: '+ action.result.msg);
                }
              });
            }
          }
        },{
          text: 'Cancel',
          handler: function(){
            ftpwin.hide();
          }
        }]
      })
    });
  }

  if (id) {
    ftpwin.setTitle('Edit FTP');
    fp.getForm().findField('ftp_id').setValue(id);
    Ext.Ajax.request({
      url : 'ajax.php' ,
      params : { a: 'getFTPServer', id: id },
      method: 'GET',
      success: function(result, request) {
        var r = Ext.util.JSON.decode(result.responseText);
        fp.getForm().findField('ftp_server').setValue(r.server);
        fp.getForm().findField('ftp_user').setValue(r.user);
        fp.getForm().findField('ftp_password').setValue(r.password);
      },
      failure: function (result, request) {
        Ext.MessageBox.alert('Error executing query', result.responseText);
      }
    });

  } else {
    ftpwin.setTitle('Add FTP');
    fp.getForm().findField('ftp_id').setValue(0);
  }
  ftpwin.show(this);
}

function openClick(btn){
  if (!uploadwin) {
    include('extjs/examples/ux/fileuploadfield/FileUploadField.js', 'FileUploadField');
    viewport.on('FileUploadFieldIncluded', function() {
      uploadwin = new Ext.Window({
        applyTo:'uploadBox',
        layout:'fit',
        width:600,
        autoHeight: true,
        closeAction:'hide',
        title: 'Upload',
        plain: true,
        items: fp = new Ext.FormPanel({
          fileUpload: true,
          width: 500,
          frame: false,
          autoHeight: true,
          bodyStyle: 'padding: 10px 10px 0 10px;',
          labelWidth: 50,
          defaults: {
            anchor: '95%',
            allowBlank: false,
            msgTarget: 'side'
          },
          defaultType: 'textfield',
          items: [{
            fieldLabel: 'Folder',
            name: 'folder',
            value: 'The uploaded file will be placed within the root directory of your "My files" folder.<br>After upload, use drag & drop to place it where ever you like.',
            xtype: 'displayfield'
          },{
            xtype: 'fileuploadfield',
            id: 'form-file',
            emptyText: 'Select a file',
            fieldLabel: 'File',
            name: 'file',
            buttonText: '',
            buttonCfg: {
              iconCls: 'upload-icon',
              buttonOnly: true
            }
          }, {
            fieldLabel: '',
            boxLabel: 'Overwrite existing files',
            name: 'allowoverwrite',
            xtype: 'checkbox'
          }]
        }),
        buttons: [{
          text: 'Upload',
          handler: function(){
            if(fp.getForm().isValid()){
              fp.getForm().submit({
                url: 'ajax.php',
                params: { a : 'uploadFile'},
                waitMsg: 'Uploading file...',
                success: function(fp, action) {
                  var fo = addTabDo(action.result.file);
                  openCodeFile(fo, action.result.filepath);
                  ReloadSubTree(action.result.filepath, '');
                  uploadwin.hide();
                },
                failure: function (fp, action) {
                  Ext.Msg.alert('Failed uploading file', action.result.msg);
                  uploadwin.hide();
                }
              });
            }
          }
        },{
          text: 'Cancel',
          handler: function(){
            uploadwin.hide();
          }
        }]
      });
      uploadwin.show(this);
    });
  } else uploadwin.show(this);
}
