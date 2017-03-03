<?php
session_start();

include_once('config.php');
$link = mysqli_connect($mysql_host, $mysql_user, $mysql_pass, $mysql_db);
if (!$link) die('Could not connect: ' . mysqli_error());

if ($_POST['userid']) {
  if ($_SESSION['userid'] == $_POST['userid']) {
    mysqli_query($link, 'UPDATE user SET first = "'. addslashes($_POST['first']) .'",
      last = "'. addslashes($_POST['last']) .'",
      email = "'. addslashes($_POST['email']) .'"
      WHERE userid = "'. (int)($_POST['userid']) .'"
      ');
  } else die('Auth Error');
} else {
  $res = mysqli_query($link, 'INSERT INTO user SET first = "'. addslashes($_POST['first']) .'",
    last = "'. addslashes($_POST['last']) .'",
    email = "'. addslashes($_POST['email']) .'",
    password = "'. sha1($_POST['password']) .'"
    ');
  $id = mysqli_insert_id();
  mkdir('../edit-files/'. (int)$id .'/');
}

mysqli_close($link);
?>
