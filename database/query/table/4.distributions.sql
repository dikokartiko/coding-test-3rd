CREATE TABLE IF NOT EXISTS distributions (
    id SERIAL PRIMARY KEY,
    fund_id INTEGER REFERENCES funds(id),
    distribution_date DATE NOT NULL,
    distribution_type VARCHAR(100),
    is_recallable BOOLEAN DEFAULT FALSE,
    amount DECIMAL(15, 2) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
