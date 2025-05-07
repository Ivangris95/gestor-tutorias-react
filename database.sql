-- Crear la base de datos
CREATE DATABASE tutoring_db;
USE tutoring_db;

-- Tabla de usuarios
CREATE TABLE users (
   user_id int NOT NULL AUTO_INCREMENT,
   username varchar(50) NOT NULL,
   email_address varchar(100) NOT NULL,
   user_password varchar(255) NOT NULL,
   registration_date datetime DEFAULT CURRENT_TIMESTAMP,
   last_login datetime DEFAULT NULL,
   is_admin tinyint(1) DEFAULT 0,
   PRIMARY KEY (user_id),
   UNIQUE KEY username (username),
   UNIQUE KEY email_address (email_address)
);

-- Tabla de horarios predefinidos
CREATE TABLE predefined_times (
   time_id int NOT NULL AUTO_INCREMENT,
   start_time time NOT NULL,
   end_time time NOT NULL,
   is_active tinyint(1) DEFAULT 1,
   PRIMARY KEY (time_id),
   UNIQUE KEY start_time (start_time)
);

-- Tabla de tokens
CREATE TABLE tokens (
   token_id int NOT NULL AUTO_INCREMENT,
   user_id int NOT NULL,
   tokens_available int NOT NULL DEFAULT 0,
   tokens_used int NOT NULL DEFAULT 0,
   last_updated datetime DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (token_id),
   KEY user_id (user_id),
   FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Tabla de compras de tokens
CREATE TABLE token_purchases (
   purchase_id int NOT NULL AUTO_INCREMENT,
   user_id int NOT NULL,
   tokens_amount int NOT NULL,
   payment_amount decimal(10,2) NOT NULL,
   payment_method varchar(50) NOT NULL,
   transaction_id varchar(100) DEFAULT NULL,
   purchase_date datetime DEFAULT CURRENT_TIMESTAMP,
   status enum('completed','pending','failed') DEFAULT 'pending',
   PRIMARY KEY (purchase_id),
   KEY user_id (user_id),
   FOREIGN KEY (user_id) REFERENCES users (user_id)
);

-- Tabla de notificaciones
CREATE TABLE notifications (
   notification_id int NOT NULL AUTO_INCREMENT,
   user_id int NOT NULL,
   message text NOT NULL,
   is_read tinyint(1) DEFAULT 0,
   created_at datetime DEFAULT CURRENT_TIMESTAMP,
   notification_type enum('reminder','token','system') DEFAULT 'system',
   PRIMARY KEY (notification_id),
   KEY user_id (user_id),
   FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

-- Tabla de configuración de Zoom del tutor ( En el caso de expandir la aplicación y tener varios tutores)
/*CREATE TABLE tutor_zoom_settings (
   setting_id int NOT NULL AUTO_INCREMENT,
   user_id int NOT NULL,
   zoom_api_key varchar(255) DEFAULT NULL,
   zoom_api_secret varchar(255) DEFAULT NULL,
   zoom_email varchar(100) DEFAULT NULL,
   PRIMARY KEY (setting_id),
   UNIQUE KEY user_id (user_id),
   FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE
);*/

-- Tabla de horarios disponibles
CREATE TABLE available_slots (
   slot_id int NOT NULL AUTO_INCREMENT,
   slot_date date NOT NULL,
   start_time time NOT NULL,
   end_time time NOT NULL,
   is_booked tinyint(1) DEFAULT 0,
   created_by int NOT NULL,
   slot_duration int NOT NULL DEFAULT 60,
   PRIMARY KEY (slot_id),
   KEY created_by (created_by),
   FOREIGN KEY (created_by) REFERENCES users (user_id)
);

-- Tabla de reservas
CREATE TABLE bookings (
   booking_id int NOT NULL AUTO_INCREMENT,
   user_id int NOT NULL,
   slot_id int NOT NULL,
   tokens_used int NOT NULL DEFAULT 1,
   zoom_link varchar(255) DEFAULT NULL,
   meeting_id varchar(100) DEFAULT NULL,
   meeting_password varchar(50) DEFAULT NULL,
   booking_date datetime DEFAULT CURRENT_TIMESTAMP,
   remider_sent tinyint(1) DEFAULT 0,
   status enum('upcoming','completed','cancelled') DEFAULT 'upcoming',
   notes text,
   PRIMARY KEY (booking_id),
   KEY user_id (user_id),
   KEY slot_id (slot_id),
   FOREIGN KEY (user_id) REFERENCES users (user_id) ON DELETE CASCADE,
   FOREIGN KEY (slot_id) REFERENCES available_slots (slot_id)
);

-- Tabla de recordatorios de tutorías
CREATE TABLE tutoring_reminders (
   reminder_id int NOT NULL AUTO_INCREMENT,
   booking_id int NOT NULL,
   reminder_time datetime NOT NULL,
   is_sent tinyint(1) DEFAULT 0,
   sent_at datetime DEFAULT NULL,
   message text,
   PRIMARY KEY (reminder_id),
   KEY booking_id (booking_id),
   FOREIGN KEY (booking_id) REFERENCES bookings (booking_id) ON DELETE CASCADE
);

-- Tabla para almacenar horas deshabilitadas
CREATE TABLE disabled_hours (
    id INT NOT NULL AUTO_INCREMENT,
    disabled_date DATE NOT NULL,
    time_id INT NOT NULL,
    admin_id INT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    
    UNIQUE KEY unique_disabled_hour (disabled_date, time_id),
    
    -- Referencias a otras tablas
    FOREIGN KEY (time_id) REFERENCES predefined_times (time_id),
    FOREIGN KEY (admin_id) REFERENCES users (user_id)
);

CREATE TABLE IF NOT EXISTS app_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  zoom_access_token TEXT,
  zoom_refresh_token TEXT,
  zoom_token_expiry DATETIME NULL
);

INSERT IGNORE INTO app_settings (id) VALUES (1);

-- Datos de ejemplo (opcional)

-- Insertar usuarios de prueba
INSERT INTO users (username, email_address, user_password, is_admin) VALUES
('admin_user', 'admin@example.com', 'admin123', 1),
('student_jane', 'jane@example.com', 'student0123', 0),
('student_john', 'john@example.com', 'student123', 0),
('student_maria', 'maria@example.com', 'student123', 0);

-- Insertar horarios predefinidos
INSERT INTO predefined_times (start_time, end_time) VALUES
('08:00:00', '09:00:00'),
('09:00:00', '10:00:00'),
('10:00:00', '11:00:00'),
('11:00:00', '12:00:00'),
('12:00:00', '13:00:00'),
('13:00:00', '14:00:00'),
('14:00:00', '15:00:00'),
('15:00:00', '16:00:00'),
('17:00:00', '18:00:00'),
('18:00:00', '19:00:00'),
('19:00:00', '20:00:00'),
('20:00:00', '21:00:00');

-- Asignar tokens a usuarios
INSERT INTO tokens (user_id, tokens_available) VALUES
(3, 5),
(4, 10);

-- Insertar compras de tokens
INSERT INTO token_purchases (user_id, tokens_amount, payment_amount, payment_method, transaction_id, status) VALUES
(3, 5, 25.00, 'PayPal', 'PAY-1234567890', 'completed'),
(4, 10, 50.00, 'Stripe', 'ch_1234567890', 'completed');

-- Insertar horarios disponibles
INSERT INTO available_slots (slot_date, start_time, end_time, created_by) VALUES
('2025-03-20', '09:00:00', '10:00:00', 1),
('2025-03-20', '10:30:00', '11:30:00', 1),
('2025-03-20', '12:00:00', '13:00:00', 1),
('2025-03-21', '14:00:00', '15:00:00', 1),
('2025-03-21', '15:30:00', '16:30:00', 1);
