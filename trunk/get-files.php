<?php
session_start();

if ($_POST['node'] == 'src') $dir = '../edit-files/'. (int)$_SESSION['userid'];
else {
  str_replace('..', '', $_POST['node']);
  $dir = '../edit-files/'. (int)$_SESSION['userid'] .'/'. $_POST['node'];
  $cur_dir = $_POST['node'] . '/';
}
$first = true;
if ($handle = opendir($dir)) {
  echo '[';
  while (false !== ($file = readdir($handle))) if ($file != "." && $file != "..") {
    if ($first) $first = false;
    else echo ",";

    if (is_dir($dir .'/'. $file)) echo '{"text":"'. $file .'","id":"'. addslashes($cur_dir . $file) .'","cls":"folder"}';
    else {
      $ending = substr($file, strrpos($file, '.') + 1, 5);
      $cls = 'file';
      switch ($ending) {
        case 'php': $cls = 'file_php'; break;
        case 'htm':
        case 'xhtml':
        case 'html': $cls = 'file_html'; break;
        case 'css': $cls = 'file_css'; break;
        case 'js': $cls = 'file_js'; break;
        case 'sql': $cls = 'file_sql'; break;
        case 'gif':
        case 'png': $cls = 'file_png'; break;
        case 'bmp':
        case 'jpeg':
        case 'jpg': $cls = 'file_jpg'; break;
        case 'bash':
        case 'csh':
        case 'sh': $cls = 'file_sh'; break;
        case 'mpg':
        case 'mpeg':
        case 'mov':
        case 'avi': $cls = 'file_avi'; break;
        case 'wav':
        case 'ogg':
        case 'mp3': $cls = 'file_mp3'; break;
      }
      echo '{"text":"'. $file .'","id":"'. addslashes($cur_dir . $file) .'","leaf":true,"cls":"'. $cls .'"}';
    }
  }
  closedir($handle);
  echo ']';
} else die ('Open dir failed');
// [{"text":"test","id":"\/test","cls":"folder"},{"text":"pkgs","id":"\/pkgs","cls":"folder"},{"text":"INCLUDE_ORDER.txt","id":"\/INCLUDE_ORDER.txt","leaf":true,"cls":"file"},{"text":"gpl-3.0.txt","id":"\/gpl-3.0.txt","leaf":true,"cls":"file"},{"text":"adapter","id":"\/adapter","cls":"folder"},{"text":"examples","id":"\/examples","cls":"folder"},{"text":"docs","id":"\/docs","cls":"folder"},{"text":"ext-all.js","id":"\/ext-all.js","leaf":true,"cls":"file"},{"text":"ext.jsb2","id":"\/ext.jsb2","leaf":true,"cls":"file"},{"text":"license.txt","id":"\/license.txt","leaf":true,"cls":"file"},{"text":"ext-all-debug.js","id":"\/ext-all-debug.js","leaf":true,"cls":"file"},{"text":"resources","id":"\/resources","cls":"folder"},{"text":"welcome","id":"\/welcome","cls":"folder"},{"text":"ext-all-debug-w-comments.js","id":"\/ext-all-debug-w-comments.js","leaf":true,"cls":"file"},{"text":"src","id":"\/src","cls":"folder"},{"text":"index.html","id":"\/index.html","leaf":true,"cls":"file"}]
?>