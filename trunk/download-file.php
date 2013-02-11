<?php
session_start();
$_POST['path'] = str_replace('..', '', $_POST['path']);
#$_POST['code'] = stripslashes($_POST['code']);

header('Content-Type: application/octetstream; charset=utf-8');
header('Content-Disposition: attachment; filename="'. $_POST['path'] .'"');
header('Content-Length: '. strlen($_POST['code']));
header('Expires: 0');
header('Cache-Control: no-cache, must-revalidate');
header('Pragma: public');

echo $_POST['code'];
?>