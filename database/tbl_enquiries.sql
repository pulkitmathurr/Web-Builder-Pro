-- Backs the Admission Enquiry and Career Enquiry modules (Milestone 3).
-- Both modules share this table, distinguished by `enquiry_type`. Already
-- applied to the local dev database; apply by hand against production too
-- (no migration runner in this project).

CREATE TABLE IF NOT EXISTS tbl_enquiries (
  id INT NOT NULL AUTO_INCREMENT,
  uuid VARCHAR(36) NOT NULL,
  school_id INT NOT NULL,
  enquiry_type ENUM('admission','career') NOT NULL,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(150) DEFAULT NULL,
  phone VARCHAR(20) NOT NULL,
  message TEXT DEFAULT NULL,
  extra_data LONGTEXT CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(extra_data)),
  status ENUM('new','contacted','closed') DEFAULT 'new',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uuid (uuid),
  KEY school_id (school_id),
  CONSTRAINT tbl_enquiries_ibfk_1 FOREIGN KEY (school_id) REFERENCES tbl_schools (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
