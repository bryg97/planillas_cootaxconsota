<?php
include __DIR__ . '/config_planillas/config.php';
 if(!isset($_SESSION['rol']) || $_SESSION['rol']!=='admin'){ header('Location: login.php'); exit(); }
$id=intval($_GET['id']??0); if(!$id) header('Location: usuarios.php');
$msg=''; if($_SERVER['REQUEST_METHOD']==='POST'){ $pass=trim($_POST['password']); if($pass){ $h=password_hash($pass,PASSWORD_BCRYPT); $s=$conn->prepare('UPDATE usuarios SET clave=? WHERE id=?'); $s->bind_param('si',$h,$id); $s->execute(); $msg='Contraseña actualizada.'; registrar_auditoria('Actualizó clave usuario '.$id,'Usuarios'); } }
$u=$conn->query('SELECT * FROM usuarios WHERE id='.$id)->fetch_assoc();
?>
<!doctype html><html><head><meta charset="utf-8"><title>Editar Usuario</title><link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet"></head>
<body><div class="container mt-4"><h3>Editar Usuario <?=$u['usuario']?></h3><a href="usuarios.php" class="btn btn-secondary mb-3">Regresar</a><?php if($msg):?><div class="alert alert-success"><?=htmlspecialchars($msg)?></div><?php endif;?>
<form method="post"><div class="mb-3"><label>Nueva contraseña</label><input name="password" class="form-control" required></div><button class="btn btn-primary">Guardar</button></form></div></body></html>
