<?php
// Configuración de zona horaria
date_default_timezone_set(getenv('TZ') ?: 'America/Bogota');

// Obtener variables de entorno (Vercel usa getenv)
$db_host = getenv('DB_HOST') ?: 'db.vxmggzvypaipbegeroxy.supabase.co';
$db_port = getenv('DB_PORT') ?: '5432';
$db_user = getenv('DB_USER') ?: 'postgres.vxmggzvypaipbegeroxy';
$db_pass = getenv('DB_PASS') ?: '7906aVxM1Jg7VXbP';
$db_name = getenv('DB_NAME') ?: 'postgres';

// Conexión a PostgreSQL usando PDO
try {
    $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;sslmode=require";
    $conn = new PDO($dsn, $db_user, $db_pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false
    ]);
    
    // Configurar zona horaria de PostgreSQL
    $conn->exec("SET TIME ZONE 'America/Bogota'");
    
} catch (PDOException $e) {
    error_log("Error de conexión DB: " . $e->getMessage());
    die("Error de conexión: " . $e->getMessage());
}

// Clase helper para compatibilidad MySQLi -> PDO
class DB {
    private $pdo;
    
    public function __construct($pdo) {
        $this->pdo = $pdo;
    }
    
    public function query($sql) {
        // Convertir AUTO_INCREMENT a SERIAL para PostgreSQL
        $sql = str_ireplace('AUTO_INCREMENT', '', $sql);
        // Convertir INSERT IGNORE a INSERT ... ON CONFLICT DO NOTHING
        $sql = preg_replace('/INSERT\s+IGNORE/i', 'INSERT', $sql);
        // Convertir NOW() a CURRENT_TIMESTAMP
        $sql = str_ireplace('NOW()', 'CURRENT_TIMESTAMP', $sql);
        // Para queries SELECT con FOR UPDATE
        $result = $this->pdo->query($sql);
        return new DBResult($result);
    }
    
    public function prepare($sql) {
        return $this->pdo->prepare($sql);
    }
    
    public function exec($sql) {
        return $this->pdo->exec($sql);
    }
    
    public function lastInsertId() {
        return $this->pdo->lastInsertId();
    }
    
    public function beginTransaction() {
        return $this->pdo->beginTransaction();
    }
    
    public function commit() {
        return $this->pdo->commit();
    }
    
    public function rollback() {
        return $this->pdo->rollback();
    }
    
    public function real_escape_string($string) {
        return trim($this->pdo->quote($string), "'");
    }
}

class DBResult {
    private $stmt;
    private $data = [];
    private $position = 0;
    
    public function __construct($stmt) {
        $this->stmt = $stmt;
        if ($stmt) {
            $this->data = $stmt->fetchAll(PDO::FETCH_ASSOC);
        }
    }
    
    public function fetch_assoc() {
        if ($this->position < count($this->data)) {
            return $this->data[$this->position++];
        }
        return null;
    }
    
    public function num_rows() {
        return count($this->data);
    }
    
    public function fetch_all($mode = MYSQLI_ASSOC) {
        return $this->data;
    }
}

// Envolver $conn en nuestra clase helper
$conn = new DB($conn);
?>
