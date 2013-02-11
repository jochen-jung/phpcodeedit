<?php
session_start();

include_once('config.php');
$link = mysql_connect($mysql_host, $mysql_user, $mysql_pass);
if (!$link) die('Could not connect: ' . mysql_error());
$db_selected = mysql_select_db($mysql_db, $link);
if (!$db_selected) die ('Can\'t use '. $mysql_db .': ' . mysql_error());

if ($_POST['userid']) {
  if ($_SESSION['userid'] == $_POST['userid']) {
    mysql_query('UPDATE user SET first = "'. addslashes($_POST['first']) .'",
      last = "'. addslashes($_POST['last']) .'",
      email = "'. addslashes($_POST['email']) .'"
      WHERE userid = "'. (int)($_POST['userid']) .'"
      ');
  } else die('Auth Error');
} else {
  $res = mysql_query('INSERT INTO user SET first = "'. addslashes($_POST['first']) .'",
    last = "'. addslashes($_POST['last']) .'",
    email = "'. addslashes($_POST['email']) .'",
    password = "'. sha1($_POST['password']) .'"
    ');
  $id = mysql_insert_id();
  mkdir('../edit-files/'. (int)$id .'/');
}

mysql_close($link);
?>
