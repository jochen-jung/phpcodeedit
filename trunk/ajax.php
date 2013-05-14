<?php
session_start();

include_once('config.php');
$link = mysql_connect($mysql_host, $mysql_user, $mysql_pass);
if (!$link) die('Could not connect: ' . mysql_error());
$db_selected = mysql_select_db($mysql_db, $link);
if (!$db_selected) die ('Can\'t use '. $mysql_db .': ' . mysql_error());

// Don't allow changes to upper directories
$_POST['path'] = str_replace('..', '', $_POST['path']);
$_POST['oldfile'] = str_replace('..', '', $_POST['oldfile']);
$_POST['newfile'] = str_replace('..', '', $_POST['newfile']);
$_FILES['file']['name'] = str_replace('..', '', $_FILES['file']['name']);

function ftpConnect($ftpid) {
  global $success, $msg;

  $res = mysql_query('SELECT id, server, user, password FROM ftp WHERE id = '. (int)$ftpid .' AND userid = '. (int)$_SESSION['userid']);
  $row = mysql_fetch_array($res, MYSQL_ASSOC);
  mysql_free_result($res);

  $conn_id = ftp_connect($row['server']);
  $login_result = ftp_login($conn_id, $row['user'], $row['password']);
  if ((!$conn_id) || (!$login_result)) {
    $success = false;
    $msg = 'FTP connection has failed';
    return false;
  }

  return $conn_id;
}

$success = true;
$msg = '';
echo '{';

switch ($_GET['a']) {
  case 'getCommands':
    echo 'items: [';
    $res = mysql_query('SELECT command FROM command
      WHERE lang = "'. addslashes(strtoupper($_GET['lang'])) .'"
      AND SUBSTRING(command, 1, '. (int)strlen($_GET['search']) .') = "'. addslashes($_GET['search']) .'"');
    $first = 1;
    while ($row = mysql_fetch_array($res, MYSQL_ASSOC)) {
      if ($first) $first = 0;
      else echo ',';
      echo '{name: "'. chop(addslashes(substr($row['command'], strlen($_GET['search']), strlen($row['command'])))) .'"}';
    }
    echo '],';
    mysql_free_result($res);
  break;

  case 'getFTPServer':
    $res = mysql_query('SELECT id, server, user, password FROM ftp WHERE id = '. (int)$_GET['id'] .' AND userid = '. (int)$_SESSION['userid']);
    while ($row = mysql_fetch_array($res, MYSQL_ASSOC)) {
      echo '"id": "'. $row['id'] .'",
        "server": "'. $row['server'] .'",
        "user": "'. $row['user'] .'",
        "password": "'. $row['password'] .'",
        ';
    }
    mysql_free_result($res);
  break;

  case 'deleteFTPServer':
    mysql_query('DELETE FROM ftp WHERE id = '. (int)$_GET['id'] .' AND userid = '. (int)$_SESSION['userid']);
    $msg = 'Server has been deleted';
  break;
}

if ($_POST['a']) switch ($_POST['a']) {

  case 'resetPW':
    $newPw = uniqid();
    mail($_POST['email'],
      'Password has been resetted',
      'You asked us to reset your password on edit.orgapage.de.'."\n"
      .'The new password is: '. $newPw,
      'From: webmaster@orgapage.de'."\r\n"
    );
    mysql_query('UPDATE user SET password = \''. sha1($newPw) .'\' WHERE email = \''. addslashes($_POST['email']) .'\'');
    $msg = 'Password has been resetted';
  break;

  case 'deleteFile':
    if (!(int)$_SESSION['userid']) {
      $success = false;
      $msg = 'You need to be logged in';
    } else {
      $localPrefix = '../edit-files/'. (int)$_SESSION['userid'] .'/';
      if (@unlink($localPrefix . $_POST['path'])) {
        $msg = 'File \''. $_POST['path'] .'\' deleted';
        echo '"path": "'. $_POST['path'] .'",';
      } else {
        $success = false;
        $msg = 'Could not delete file \''. $_POST['path'] .'\'';
      }
    }
  break;

  case 'deleteFTPFile':
    if (!(int)$_SESSION['userid']) {
      $success = false;
      $msg = 'You need to be logged in';
    } else {
      $ftp_id = (int)substr($_POST['path'], 0, strpos($_POST['path'], ':'));
      $ftp_path = substr($_POST['path'], strpos($_POST['path'], ':') + 1, strlen($_POST['path']));

      $conn_id = ftpConnect($ftp_id);
      if ($conn_id) {
        if (@ftp_delete($conn_id, $ftp_path)) {
          $msg = 'File \''. $ftp_path .'\' deleted';
          echo '"path": "'. $_POST['path'] .'",';
        } else {
          $success = false;
          $msg = 'Could not delete file \''. $ftp_path .'\'';
        }
      }
    }
  break;

  case 'renameFile':
    if (!(int)$_SESSION['userid']) {
      $success = false;
      $msg = 'You need to be logged in';
    } else {
      $ftp_id_oldfile = (int)substr($_POST['oldfile'], 0, strpos($_POST['oldfile'], ':'));
      $ftp_id_newfile = (int)substr($_POST['newfile'], 0, strpos($_POST['newfile'], ':'));

      if ($ftp_id_oldfile) $path_oldfile = substr($_POST['oldfile'], strpos($_POST['oldfile'], ':') + 1, strlen($_POST['oldfile']));
      else $path_oldfile = $_POST['oldfile'];
      if ($ftp_id_newfile) $path_newfile = substr($_POST['newfile'], strpos($_POST['newfile'], ':') + 1, strlen($_POST['newfile']));
      else $path_newfile = $_POST['newfile'];
/*
      // Add filename to new dir
      if (strrpos($path_oldfile, '/') !== false) $startpos = strrpos($path_oldfile, '/') + 1;
      else $startpos = 0;
      $old_filename = substr($path_oldfile, $startpos, strlen($path_oldfile));
      if (substr($path_newfile, strlen($path_newfile) - 1, 1) != '/') $path_newfile .= '/';
      $path_newfile .= $old_filename;
*/
      $localPrefix = '../edit-files/'. (int)$_SESSION['userid'] .'/';

      // Local move
      if (!$ftp_id_oldfile and !$ftp_id_newfile) {
        if (@rename($localPrefix . $path_oldfile, $localPrefix . $path_newfile)) {
          $msg = "Done: $path_oldfile -> $path_newfile";
          echo '"newfile": "'. $path_newfile .'",';
        } else {
          $success = false;
          $msg = 'Could not move local file \''. $localPrefix . $path_oldfile .'\' to (\''. $localPrefix . $path_newfile .'\')';
        }

      // Local -> FTP
      } elseif (!$ftp_id_oldfile and $ftp_id_newfile) {
        $conn_id = ftpConnect($ftp_id_newfile);
        if ($conn_id) {
          if (@ftp_put($conn_id, $path_newfile, $localPrefix . $path_oldfile, FTP_BINARY)) {
            unlink($localPrefix . $path_oldfile);
            $msg = "Done: $path_oldfile -> $path_newfile";
            echo '"newfile": "'. $ftp_id_newfile .':'. $path_newfile .'",';
          } else {
            $success = false;
            $msg = 'Could not save file \''. $localPrefix . $path_oldfile .'\' to FTP (\''. $path_newfile .'\')';
          }
        }

      // FTP -> Local
      } elseif ($ftp_id_oldfile and !$ftp_id_newfile) {
        $conn_id = ftpConnect($ftp_id_oldfile);
        if ($conn_id) {
          if (@ftp_get($conn_id, $localPrefix . $path_newfile, $path_oldfile, FTP_BINARY)) {
            ftp_delete($conn_id, $path_oldfile);
            $msg = "Done: $path_oldfile -> $path_newfile";
            echo '"newfile": "'. $path_newfile .'",';
          } else {
            $success = false;
            $msg = 'Could not get file \''. $localPrefix . $path_oldfile .'\' from FTP (\''. $path_newfile .'\')';
          }
        }

      // FTP move
      } elseif ($ftp_id_oldfile and $ftp_id_newfile) {
        // Same FTP
        if ($ftp_id_oldfile == $ftp_id_newfile) {
          $conn_id = ftpConnect($ftp_id_newfile);
          if ($conn_id) {
            if (@ftp_rename($conn_id, $path_oldfile, $path_newfile)) {
              $msg = "Done: $path_oldfile -> $path_newfile";
              echo '"newfile": "'. $ftp_id_newfile .':'. $path_newfile .'",';
            } else {
              $success = false;
              $msg = 'Could not move FTP file \''. $path_oldfile .'\' to \''. $path_newfile .'\'';
            }
          }
        // Different FTP
        } else {
          $success = false;
          $msg = 'FTP -> FTP move is not supported, yet';
        }
      }
    }
  break;

  case 'uploadFile':
    if ((int)$_SESSION['userid']) $file = '../edit-files/'. (int)$_SESSION['userid'] .'/'. $_FILES['file']['name'];
    else $file = 'tmp/'. $_FILES['file']['name'];
    
    if (!$_POST['allowoverwrite'] and file_exists($file)) {
      unlink($_FILES['file']['tmp_name']);
      $success = false;
      $msg = 'File already exists';
    } elseif ($_FILES['userfile']['size'] > 1024 * 500) {
      unlink($_FILES['file']['tmp_name']);
      $success = false;
      $msg = 'Files currently may have a maximum size of 500K';
    } else {
      if (move_uploaded_file($_FILES['file']['tmp_name'], $file)) {
        echo '"file":"' .$_FILES['file']['name']. '",';
        if ((int)$_SESSION['userid']) echo '"filepath":"' .$_FILES['file']['name']. '",';
        else echo '"filepath":"tmp/' .$_FILES['file']['name']. '",';
        $msg = 'File uploaded';
      } else{
        $success = false;
        $msg = 'Error: '. $_FILES['file']['error'];
      }
    }
  break;

  case 'saveFile':
    if (!(int)$_SESSION['userid']) {
      $success = false;
      $msg = 'You need to be logged in to save files';
    } else {
      $first_colon = strpos($_POST['path'], ':');
      // FTP file
      if ($first_colon > 0 and $first_colon < 10) {
        $ftp_id = (int)substr($_POST['path'], 0, strpos($_POST['path'], ':'));
        $ftp_path = substr($_POST['path'], strpos($_POST['path'], ':') + 1, strlen($_POST['path']));

        $res = mysql_query('SELECT id, server, user, password FROM ftp WHERE id = '. (int)$ftp_id .' AND userid = '. (int)$_SESSION['userid']);
        $row = mysql_fetch_array($res, MYSQL_ASSOC);
        mysql_free_result($res);

        $conn_id = ftp_connect($row['server']);
        $login_result = ftp_login($conn_id, $row['user'], $row['password']);
        if ((!$conn_id) || (!$login_result)) {
          $success = false;
          $msg = 'FTP connection has failed';
        } else {
          $local_file = '../tmp/ftp_tmp_'. (int)$_SESSION['userid'];
          $handle = fopen($local_file, "w");
          fwrite($handle, $_POST['code']);
          fclose($handle);
          ftp_put($conn_id, $ftp_path, $local_file, FTP_BINARY); // FTP_ASCII  [, int $resumepos = 0 ]
          unlink($local_file);
          $msg = 'File \''. $ftp_path .'\' has been saved';
          if ($_POST['denyoverwrite']) $msg .= '<br><br>Use the navigation tree to drag your new file to the directory / FTP you like to place it';
        }
      // Regular file
      } else {
        $file = '../edit-files/'. (int)$_SESSION['userid'] .'/'. $_POST['path'];
        if ($_POST['denyoverwrite'] and file_exists($file)) {
          $success = false;
          $msg = 'File already exists';
        } else {
          $handle = fopen($file, "w");
          //if not logged in... $handle = fopen('tmp/'. $_POST['path'], "w");
          fwrite($handle, $_POST['code']);
          fclose($handle);
          $msg = 'File \''. $_POST['path'] .'\' has been saved';
          if ($_POST['denyoverwrite']) $msg .= '<br><br>Use the navigation tree to drag your new file to the directory / FTP you like to place it';
        }
      }
    }
  break;

  case 'saveFTPServer':
    if (!(int)$_SESSION['userid']) {
      $success = false;
      $msg = 'You need to be logged in create / edit FTP servers';
    } else {
      if ($_POST['ftp_id']) {
        $res = mysql_query('SELECT userid FROM ftp WHERE id = '. (int)($_POST['ftp_id']));
        if (!$res) {
          $success = false;
          $msg = 'Server does not exist';
        } else {
          $row = mysql_fetch_array($res, MYSQL_ASSOC);
          mysql_free_result($res);

          if ($_SESSION['userid'] == $row['userid']) {
            mysql_query('UPDATE ftp SET server = "'. addslashes($_POST['ftp_server']) .'",
              user = "'. addslashes($_POST['ftp_user']) .'",
              password = "'. addslashes($_POST['ftp_password']) .'"
              WHERE id = "'. (int)($_POST['ftp_id']) .'"
              ');
              $msg = 'FTP has been edited.<br>Changes will take effekt after next login';
          } else {
            $success = false;
            $msg = 'Auth Error';
          }
        }
      } else {
        mysql_query('INSERT INTO ftp SET server = "'. addslashes($_POST['ftp_server']) .'",
          user = "'. addslashes($_POST['ftp_user']) .'",
          password = "'. addslashes($_POST['ftp_password']) .'",
          userid = '. (int)$_SESSION['userid']
          );
        $msg = 'FTP has been created';
        #echo mysql_error($link);
      }
    }
  break;
}

echo '"success": "'. $success .'", "msg": "'. $msg .'"}';

mysql_close($link);
?>
