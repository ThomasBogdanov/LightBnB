SELECT properties.city as city, count(property_reviews.id) as total_reservations
FROM properties
JOIN property_reviews ON properties.id = property_id
GROUP BY properties.city
ORDER BY total_reservations DESC;