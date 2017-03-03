<?php
session_start();

include_once('config.php');
$link = mysqli_connect($mysql_host, $mysql_user, $mysql_pass, $mysql_db);
if (!$link) die('Could not connect: ' . mysqli_error());

$ftp_id = (int)substr($_GET['path'], 0, strpos($_GET['path'], ':'));
$ftp_path = substr($_GET['path'], strpos($_GET['path'], ':') + 1, strlen($_GET['path']));

$res = mysqli_query($link, 'SELECT id, server, user, password FROM ftp WHERE id = '. (int)$ftp_id .' AND userid = '. (int)$_SESSION['userid']);
$row = mysqli_fetch_array($res, MYSQLI_ASSOC);
mysqli_free_result($res);

$conn_id = ftp_connect($row['server']);
$login_result = ftp_login($conn_id, $row['user'], $row['password']);
if ((!$conn_id) || (!$login_result)) die("FTP connection has failed !");

$local_file = '../tmp/ftp_tmp_'. (int)$_SESSION['userid'];
ftp_get($conn_id, $local_file, $ftp_path, FTP_BINARY); // FTP_ASCII  [, int $resumepos = 0 ]

$handle = fopen($local_file, "r");
if ($handle) {
  while (!feof($handle)) {
    $buffer = fgets($handle, 4096);
    echo $buffer;
  }
  fclose($handle);
}

unlink($local_file);
ftp_close($conn_id);
?>