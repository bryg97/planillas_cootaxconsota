<?php
// Script para corregir rutas de inclusión en todos los archivos PHP

$files = [
    'analizar.php', 'aprobar_liquidacion.php', 'auditoria.php', 'autocomplete_vehiculos.php',
    'cartera.php', 'cartera', 'cartera22dic25', 'check_deuda.php', 'configuracion.php',
    'depuracion.php', 'depuracion_financiera.php', 'depuracion_completa.php', 'depuracion_taxi.php',
    'depuracion_vehiculo.php', 'depu_taxi.php', 'diagnostico', 'editar_saldo.php', 'editar_planilla.php',
    'editar_usuario.php', 'eliminar_usuario.php', 'liquidacion.php', 'liquidaciones', 'liquidaciones.php',
    'liquidaciones16dic2025', 'login', 'login.php', 'operaciones', 'operaciones.php', 'operaciones_OLD',
    'panel', 'panel.php', 'panel241125ok', 'planillas.php', 'recargas.php', 'recaudar_deuda.php',
    'rechazar_liquidacion.php', 'reportes.php', 'reportes_OK_SIN_FILTRO_ESTATUS', 'usuarios.php',
    'verificar_deuda.php'
];

$search = "__DIR__ . '/../../config_planillas/config.php'";
$replace = "__DIR__ . '/config_planillas/config.php'";
$count = 0;

foreach ($files as $file) {
    if (file_exists($file)) {
        $content = file_get_contents($file);
        if (strpos($content, $search) !== false) {
            $content = str_replace($search, $replace, $content);
            file_put_contents($file, $content);
            echo "✓ Actualizado: $file\n";
            $count++;
        }
    }
}

echo "\n✅ Total de archivos actualizados: $count\n";
?>
