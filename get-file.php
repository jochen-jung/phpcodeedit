<?php
session_start();
$_GET['path'] = str_replace('..', '', $_GET['path']);

if (substr($_GET['path'], 0, 4) != 'tmp/') $_GET['path'] = '../edit-files/'. (int)$_SESSION['userid'] .'/'. $_GET['path'];

$handle = fopen($_GET['path'], "r");
if ($handle) {
  while (!feof($handle)) {
    $buffer = fgets($handle, 4096);
    echo $buffer;
  }
  fclose($handle);
}
?>