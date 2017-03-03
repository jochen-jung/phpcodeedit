<?php
session_start();
date_default_timezone_set('Europe/Berlin');

// Init DB
include_once('config.php');
$link = mysqli_connect($mysql_host, $mysql_user, $mysql_pass, $mysql_db);
if (!$link) die('Could not connect: ' . mysqli_error());

// Init Smarty
include_once('smarty/libs/Smarty.class.php');
$smarty = new Smarty();
$smarty->left_delimiter = '{{';
$smarty->right_delimiter = '}}';
$smarty->template_dir = '.';
$smarty->compile_dir = './smarty/templates_c/';
$smarty->cache_dir = './smarty/templates_cache/';
$smarty->caching = false;
$smarty->cache_lifetime = 0; // 60 * 60 * 24 * 356; // sec
//$smarty->compile_check = true;
$smarty->assign('alertMsg', '');

// Logout
if ($_GET['a'] == 'logout') {
  mysqli_query($link, 'DELETE FROM session WHERE sid = "'. session_id() .'"');
  foreach ($_SESSION as $key => $val) unset($_SESSION[$key]);
}

// Login
if ($_POST['email'] and $_POST['password']) {
  $res = mysqli_query($link, 'SELECT userid, password FROM user WHERE email = "'. addslashes($_POST['email']) .'" OR userid = '. (int)($_POST['email']));
  $row = mysqli_fetch_array($res);
  // echo "Ext.Msg.alert('". mysqli_errno($link) ." - ');";
  if ($_POST['password'] != '' and $row['password'] == sha1($_POST['password'])) {
    // Set sid
    mysqli_query($link, 'REPLACE INTO session SET sid = "'. session_id() .'", userid = '. (int)$row['userid']);
    // $smarty->assign('alertMsg', "Ext.Msg.alert('Login success', 'Succesfully logged in');");
  } else $smarty->assign('alertMsg', "Ext.Msg.alert('Login failed', 'Make sure you entered your password correctly<br><br>Forgot your Password?<br><a id=\"resetPW\" href=\"#\">Click here to reset it</a>');
    Ext.get(\"resetPW\").on('click', function() {
      resetPWClick('". $_POST['email'] ."');
    });
    ");
  mysqli_free_result($res);
}

// Check sid
$res = mysqli_query($link, 'SELECT s.userid,
    u.first AS firstname, u.last AS lastname, u.email
  FROM session AS s
  LEFT JOIN user AS u ON s.userid = u.userid
  WHERE s.sid = "'. session_id() .'"');
$row = mysqli_fetch_array($res, MYSQLI_ASSOC);
mysqli_free_result($res);
if ($row['userid']) {
  foreach($row as $key => $val) {
    $_SESSION[$key] = $val;
    $smarty->assign($key, $val);
  }
} else {
  $smarty->assign('userid', '');
  unset($_SESSION['userid']);
}

if ($_SERVER['HTTPS'] == 'on' or getenv(REMOTE_ADDR) == "62.67.200.4") $smarty->assign('isSSL', true);
else $smarty->assign('isSSL', false);

$smarty->assign('hash_algos', hash_algos());
$smarty->display('main.htm');
mysqli_close($link);
?>