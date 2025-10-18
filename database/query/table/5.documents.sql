CREATE TABLE IF NOT EXISTS documents (
    id SERIAL PRIMARY KEY,
    fund_id INTEGER REFERENCES funds(id),
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500),
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    parsing_status VARCHAR(50) DEFAULT 'pending',
    error_message TEXT
);
