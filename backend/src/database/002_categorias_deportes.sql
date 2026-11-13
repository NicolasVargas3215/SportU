CREATE TABLE IF NOT EXISTS categorias_deportivas (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(80) NOT NULL UNIQUE,
  descripcion VARCHAR(255) NULL,
  estado ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo'
) ENGINE=InnoDB;

INSERT INTO categorias_deportivas (nombre, descripcion) VALUES
('Deportes individuales', 'La participación se centra en el desempeño de una persona.'),
('Deportes de conjunto', 'Se practican mediante equipos o grupos de participantes.'),
('Deportes de combate', 'Incluyen oposición física o técnica entre participantes.'),
('Deportes acuáticos', 'Se realizan en piscina, río, lago o espacios acuáticos.'),
('Deportes de raqueta', 'Utilizan raqueta, pala o implemento similar.'),
('Deportes con balón', 'Utilizan un balón como elemento principal del juego.'),
('Atletismo y carreras', 'Comprenden carreras, saltos, lanzamientos y pruebas atléticas.'),
('Deportes recreativos', 'Promueven actividad física, integración y participación libre.'),
('Deportes de precisión', 'Requieren puntería, control y exactitud del movimiento.'),
('Otros deportes', 'Categoría disponible para disciplinas que no encajen en las anteriores.')
ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);

ALTER TABLE deportes ADD COLUMN id_categoria INT NULL AFTER id_deporte;

UPDATE deportes d
INNER JOIN categorias_deportivas c ON c.nombre = 'Otros deportes'
SET d.id_categoria = c.id_categoria
WHERE d.id_categoria IS NULL;

ALTER TABLE deportes
  ADD CONSTRAINT fk_deportes_categoria
  FOREIGN KEY (id_categoria) REFERENCES categorias_deportivas(id_categoria)
  ON UPDATE CASCADE ON DELETE RESTRICT;

CREATE INDEX idx_deportes_categoria ON deportes(id_categoria);
