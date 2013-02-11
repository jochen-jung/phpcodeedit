<?php
session_start();

if ($_POST['type'] == 'md5') $hash = md5($_POST['plain']);
elseif ($_POST['type'] == 'sha1') $hash = sha1($_POST['plain']);
else $hash = hash($_POST['type'], $_POST['plain']);

echo '{
  "success":true,
  "hash":"'. $hash .'",
}';
?>