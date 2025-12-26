<?php
require('fpdf/fpdf.php'); // asegúrate de tener la carpeta /fpdf/ instalada
include 'config.php';
session_start();

if(!isset($_SESSION['rol']) || !in_array($_SESSION['rol'], ['admin', 'tesorera'])){
    header("Location: login.php");
    exit();
}

class PDF extends FPDF {
    function Header() {
        $this->Image('https://cootaxconsota.com/wp-content/uploads/2024/07/logo-empresa-png2-1.png',10,6,25);
        $this->SetFont('Arial','B',14);
        $this->Cell(80);
        $this->Cell(80,10,'Reporte de Liquidaciones',0,0,'C');
        $this->Ln(15);
        $this->SetFont('Arial','B',10);
        $this->Cell(15,10,'ID',1);
        $this->Cell(30,10,'N° Planilla',1);
        $this->Cell(25,10,'Vehiculo',1);
        $this->Cell(25,10,'Tipo',1);
        $this->Cell(25,10,'Valor',1);
        $this->Cell(35,10,'Operador',1);
        $this->Cell(30,10,'Estado',1);
        $this->Ln();
    }
    function Footer() {
        $this->SetY(-15);
        $this->SetFont('Arial','I',8);
        $this->Cell(0,10,'Pagina '.$this->PageNo().'/{nb}',0,0,'C');
    }
}

$pdf = new PDF();
$pdf->AliasNbPages();
$pdf->AddPage();
$pdf->SetFont('Arial','',10);

$sql = "
SELECT l.id AS id_liq, l.estado, p.numero_planilla, p.valor, p.tipo, 
       v.codigo_vehiculo, u.usuario AS operador
FROM liquidaciones l
INNER JOIN planillas p ON l.planilla_id=p.id
INNER JOIN vehiculos v ON p.vehiculo_id=v.id
INNER JOIN usuarios u ON l.operador_id=u.id
ORDER BY l.fecha_solicitud DESC
";
$result = $conn->query($sql);

while($row = $result->fetch_assoc()){
    $pdf->Cell(15,10,$row['id_liq'],1);
    $pdf->Cell(30,10,$row['numero_planilla'],1);
    $pdf->Cell(25,10,$row['codigo_vehiculo'],1);
    $pdf->Cell(25,10,ucfirst($row['tipo']),1);
    $pdf->Cell(25,10,'$'.number_format($row['valor'],2),1);
    $pdf->Cell(35,10,$row['operador'],1);
    $pdf->Cell(30,10,ucfirst($row['estado']),1);
    $pdf->Ln();
}

$pdf->Output('I', 'liquidaciones_'.date('Y-m-d').'.pdf');
?>
