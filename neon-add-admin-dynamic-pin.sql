-- PIN dinamico temporal para administradores (2FA por correo y Telegram)
ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS pin_dinamico_hash VARCHAR(255);

ALTER TABLE usuarios
  ADD COLUMN IF NOT EXISTS pin_dinamico_expira_en TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_usuarios_pin_dinamico_expira_en
ON usuarios(pin_dinamico_expira_en);
