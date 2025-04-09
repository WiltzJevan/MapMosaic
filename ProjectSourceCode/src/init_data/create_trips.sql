DROP TABLE IF EXISTS trips;

CREATE TABLE trips (
  id SERIAL PRIMARY KEY,
  user_id INT REFERENCES users(id),
  title TEXT NOT NULL,
  location TEXT,
  country_name TEXT,
  description TEXT,
  image_path TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);