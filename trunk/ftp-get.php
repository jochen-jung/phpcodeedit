<?php
session_start();
error_reporting(0);

include_once('config.php');
$link = mysql_connect($mysql_host, $mysql_user, $mysql_pass);
if (!$link) die('Could not connect: ' . mysql_error());
$db_selected = mysql_select_db($mysql_db, $link);
if (!$db_selected) die ('Can\'t use '. $mysql_db .': ' . mysql_error());

function ftp_is_dir($dir) {
  global $conn_id;
  if (ftp_chdir($conn_id, $dir)) {
    ftp_chdir($conn_id, '..');
    return true;
  } else {
    return false;
  }
}

if ($_POST['node'] == '/') {
  echo '[';
  $res = mysql_query('SELECT id, server, user FROM ftp WHERE userid = '. (int)$_SESSION['userid']);
  $first = true;
  while ($row = mysql_fetch_array($res, MYSQL_ASSOC)) {
    if ($first) $first = false;
    else echo ",";
    echo '{"text":"'. $row['user'] .'@'. $row['server'] .'","id":"'. $row['id'] .':/","cls":"folder"}';
  }
  mysql_free_result($res);
  echo ']';

} else {
  $ftp_id = (int)substr($_POST['node'], 0, strpos($_POST['node'], ':'));
  $ftp_path = substr($_POST['node'], strpos($_POST['node'], ':') + 1, strlen($_POST['node']));

  $res = mysql_query('SELECT id, server, user, password FROM ftp WHERE id = '. (int)$ftp_id .' AND userid = '. (int)$_SESSION['userid']);
  $row = mysql_fetch_array($res, MYSQL_ASSOC);
  mysql_free_result($res);

  $conn_id = ftp_connect($row['server']);
  $login_result = ftp_login($conn_id, $row['user'], $row['password']);
  if ((!$conn_id) || (!$login_result)) die("FTP connection has failed !");

  if ($ftp_path) if (!ftp_chdir($conn_id, $ftp_path)) echo "Couldn't change directory\n";
  $contents = ftp_nlist($conn_id, ".");
  echo '[';
  $first = true;
  foreach ($contents as $key => $val) if ($val != '.' and $val != '..') {
    if ($first) $first = false;
    else echo ",";
    if (ftp_is_dir($val)) echo '{"text":"'. $val .'","id":"'. $row['id'] .':'. ftp_pwd($conn_id) .'/'. $val .'","cls":"folder"}';
    else {
      $ending = substr($val, strrpos($val, '.') + 1, 5);
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
      echo '{"text":"'. $val .'","id":"'. $row['id'] .':'. ftp_pwd($conn_id) .'/'. $val .'","leaf":true,"cls":"'. $cls .'"}';
    }
  }
  echo ']';
  ftp_close($conn_id);
}
?>