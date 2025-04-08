DROP TABLE IF EXISTS users;
CREATE TABLE users (
  username VARCHAR(50) PRIMARY KEY,
  password VARCHAR(60) NOT NULL
);

DROP TABLE IF EXISTS trips;
CREATE TABLE trips (
    username VARCHAR(50),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    location_name VARCHAR(255),
    image_url TEXT,
    description TEXT
);