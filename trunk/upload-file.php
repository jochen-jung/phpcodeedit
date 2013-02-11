<?php
session_start();
$_POST['path'] = str_replace('..', '', $_POST['path']);
$_FILES['file']['name'] = str_replace('..', '', $_FILES['file']['name']);

// TODO Path

if (move_uploaded_file($_FILES['file']['tmp_name'], 'tmp/'. $_FILES['file']['name'])) {
  echo '{
    "success":true,
    "msg":"File uploaded",
    "file":"' .$_FILES['file']['name']. '",
    "filepath":"tmp/' .$_FILES['file']['name']. '"
  }';
} else{
  echo '{
    "success":false,
    "msg":"Error: '. $_FILES['file']['error'] .'"
  }';
}
?>