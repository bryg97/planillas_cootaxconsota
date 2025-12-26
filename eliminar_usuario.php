<?php
include __DIR__ . '/config_planillas/config.php';
 if(!isset($_SESSION['rol']) || $_SESSION['rol']!=='admin'){ header('Location: login.php'); exit(); }
$id=intval($_GET['id']??0); if($id){ $s=$conn->prepare('DELETE FROM usuarios WHERE id=?'); $s->bind_param('i',$id); $s->execute(); registrar_auditoria('Eliminó usuario '.$id,'Usuarios'); }
header('Location: usuarios.php'); exit();
