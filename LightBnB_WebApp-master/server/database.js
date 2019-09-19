const properties = require('./json/properties.json');
const users = require('./json/users.json');
const { Pool } = require('pg');
const pool = new Pool({
  user: 'vagrant',
  password: '123',
  host: 'localhost',
  database: 'lightbnb'
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */


const getUserWithEmail = function (email) {
  let userQuery = `
  SELECT * FROM users
  WHERE email = $1`
  return pool.query(userQuery, [email])
  .then(res => res.rows[0])
  .catch(err => null)
}

exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */

const getUserWithId = function(id) {
  let userQuery = `
  SELECT * FROM users
  WHERE id = $1`
  return pool.query(userQuery, [id])
  .then(res => res.rows[0])
  .catch(err => console.log(err))
}

exports.getUserWithId = getUserWithId;



/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */

const addUser = function(user) {
  let userQuery = `
  INSERT INTO users(name, email, password)
  VALUES ($1, $2, $3)
  RETURNING *;
  `
  return pool.query(userQuery, [user.name, user.email, user.password])
  .then(res => res.rows[0])
  .catch(err => null)
}
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
// const getAllReservations = function(guest_id, limit = 10) {
//   return getAllProperties(null, 2);
// }

const getAllReservations = function (guest_id, limit = 10) {
  let userQuery = `
  SELECT properties.*, reservations.*, avg(rating) as average_rating
  FROM reservations
  JOIN properties ON reservations.property_id = properties.id
  JOIN property_reviews ON properties.id = property_reviews.property_id 
  WHERE reservations.guest_id = $1
  AND reservations.end_date < now()::date
  GROUP BY properties.id, reservations.id
  ORDER BY reservations.start_date
  LIMIT $2;`
  return pool.query(userQuery, [guest_id, limit = 10])
  .then (res => res.rows)
  .catch(err => null)

}
exports.getAllReservations = getAllReservations;

/// Properties


/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */

const getAllProperties = function(options, limit = 10) {
  // 1
  const queryParams = [];
  // 2
  let queryString = `
  SELECT properties.*, avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_id
  `;

  // 3
  if (options.city) {
    queryParams.push(options.city);
    queryString += `WHERE city LIKE $${queryParams.length} `;
  }

  if (options.owner_id) {
    queryParams.push(options.owner_id);
    queryString += `AND owner_id = $${queryParams.length}`;
  }
  
  if (options.minimum_price_per_night) {
    queryParams.push(options.minimum_price_per_night);
    queryString += `AND cost_per_night >= $${queryParams.length}`
  }

  if (options.maximum_price_per_night) {
    queryParams.push(options.maximum_price_per_night);
    queryString += `AND cost_per_night <= $${queryParams.length}`
  }




if (options.minimum_rating) {
  queryParams.push(options.minimum_rating);
  queryString += `GROUP BY properties.id HAVING avg(property_reviews.rating) >= $${queryParams.length}`
}

if (!options.minimum_rating) {
  queryString += `GROUP BY properties.id`
}

queryParams.push(limit);
queryString += `
ORDER BY cost_per_night
LIMIT $${queryParams.length};
`;

  // 5
  console.log(queryString, queryParams);

  // 6
  return pool.query(queryString, queryParams)
  .then(res => res.rows);
}

// const getAllProperties = function(options, limit = 10) {
//   let userQuery = `
//     SELECT properties.*, avg(property_reviews.rating) as average_rating
//     FROM properties
//     JOIN property_reviews ON properties.id = property_id
//     WHERE city LIKE '%ancouv%'
//     GROUP BY properties.id
//     HAVING avg(property_reviews.rating) >= 4
//     ORDER BY cost_per_night
//     LIMIT 10;`
//   return pool.query(userQuery, [limit])
//   .then(res => res.rows);
// }



exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
}
exports.addProperty = addProperty;




// if (options.minimum_rating) {
//   queryParams.push(options.minimum_rating);
//   queryString += `AND rating >= $${queryParams.length}`
// }

// // 4
// queryParams.push(limit);
// queryString += `
// GROUP BY properties.id
// ORDER BY cost_per_night
// LIMIT $${queryParams.length};
// `;