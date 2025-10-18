CREATE TABLE IF NOT EXISTS capital_calls (
    id SERIAL PRIMARY KEY,
    fund_id INTEGER REFERENCES funds(id),
    call_date DATE NOT NULL,
    call_type VARCHAR(100),
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
