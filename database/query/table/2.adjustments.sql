CREATE TABLE IF NOT EXISTS adjustments (
    id SERIAL PRIMARY KEY,
    fund_id INTEGER REFERENCES funds(id),
    adjustment_date DATE NOT NULL,
    adjustment_type VARCHAR(100),
    category VARCHAR(100),
    amount DECIMAL(15, 2) NOT NULL,
    is_contribution_adjustment BOOLEAN DEFAULT FALSE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
